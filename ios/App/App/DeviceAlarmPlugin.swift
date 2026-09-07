import AlarmKit
import Capacitor
import CryptoKit
import Foundation
import SwiftUI
import UIKit

private struct GoalAlarmPayload: Codable, Equatable {
    let body: String
    let fireAt: String
    let goalId: String
    let id: String
    let occurrenceId: String
    let route: String
    let snoozeMinutes: Int
    let title: String
}

@available(iOS 26.0, *)
private struct GoalAlarmMetadata: AlarmMetadata {
    let alarmId: String
    let route: String
}

@objc(DeviceAlarmPlugin)
final class DeviceAlarmPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "DeviceAlarmPlugin"
    let jsName = "DeviceAlarm"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "cancelAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reconcile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
    ]

    private let storageKey = "vybaa.goalAlarmPayloads"
    private var activeObserver: NSObjectProtocol?

    override func load() {
        activeObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.publishOpenedAlarmIfNeeded()
        }
        publishOpenedAlarmIfNeeded()
    }

    deinit {
        if let activeObserver {
            NotificationCenter.default.removeObserver(activeObserver)
        }
    }

    @objc func cancelAll(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else {
            savePayloads([])
            call.resolve()
            return
        }
        for payload in loadPayloads() {
            try? AlarmManager.shared.cancel(id: uuid(for: payload.id))
        }
        savePayloads([])
        call.resolve()
    }

    @objc func checkPermission(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else {
            call.resolve(["state": "unsupported"])
            return
        }
        call.resolve(["state": permissionName(AlarmManager.shared.authorizationState)])
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else {
            call.resolve([
                "permission": "unsupported",
                "scheduledCount": 0,
                "supported": false,
            ])
            return
        }
        let managedIds = Set(loadPayloads().map { uuid(for: $0.id) })
        let scheduledCount = (try? AlarmManager.shared.alarms.filter { managedIds.contains($0.id) }.count) ?? 0
        call.resolve([
            "permission": permissionName(AlarmManager.shared.authorizationState),
            "scheduledCount": scheduledCount,
            "supported": true,
        ])
    }

    @objc func reconcile(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else {
            call.resolve(["scheduledIds": []])
            return
        }
        guard let objects = call.getArray("alarms", JSObject.self) else {
            call.reject("A valid alarms array is required")
            return
        }

        do {
            let data = try JSONSerialization.data(withJSONObject: objects)
            let payloads = try JSONDecoder().decode([GoalAlarmPayload].self, from: data)
            let cancelSnoozesForGoalIds = Set(
                call.getArray("cancelSnoozesForGoalIds", String.self) ?? []
            )
            Task { @MainActor in
                do {
                    let scheduledIds = try await self.reconcile(
                        payloads,
                        cancelSnoozesForGoalIds: cancelSnoozesForGoalIds
                    )
                    call.resolve(["scheduledIds": scheduledIds])
                } catch {
                    call.reject("Could not schedule goal alarms", nil, error)
                }
            }
        } catch {
            call.reject("Goal alarm payload is invalid", nil, error)
        }
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        guard #available(iOS 26.0, *) else {
            call.resolve(["state": "unsupported"])
            return
        }
        Task { @MainActor in
            do {
                let state = try await AlarmManager.shared.requestAuthorization()
                call.resolve(["state": self.permissionName(state)])
            } catch {
                call.reject("Could not request alarm permission", nil, error)
            }
        }
    }

    @available(iOS 26.0, *)
    @MainActor
    private func reconcile(
        _ desiredPayloads: [GoalAlarmPayload],
        cancelSnoozesForGoalIds: Set<String>
    ) async throws -> [String] {
        let now = Date()
        let desired = desiredPayloads.filter { payload in
            guard let date = parseDate(payload.fireAt) else { return false }
            return date > now
        }
        let desiredById = Dictionary(uniqueKeysWithValues: desired.map { ($0.id, $0) })
        let previousById = Dictionary(uniqueKeysWithValues: loadPayloads().map { ($0.id, $0) })
        let systemAlarms = try AlarmManager.shared.alarms
        let systemIds = Set(systemAlarms.map(\.id))
        let systemAlarmsById = Dictionary(uniqueKeysWithValues: systemAlarms.map { ($0.id, $0) })
        var retainedCountdowns: [GoalAlarmPayload] = []

        for (id, previous) in previousById where desiredById[id] != previous {
            let systemAlarm = systemAlarmsById[uuid(for: id)]
            let shouldRetainSnooze = desiredById[id] == nil
                && !cancelSnoozesForGoalIds.contains(previous.goalId)
                && systemAlarm?.state == .countdown
            if shouldRetainSnooze {
                retainedCountdowns.append(previous)
                continue
            }
            try? AlarmManager.shared.cancel(id: uuid(for: id))
        }

        var scheduled: [GoalAlarmPayload] = []
        for payload in desired {
            let alarmId = uuid(for: payload.id)
            if previousById[payload.id] == payload, systemIds.contains(alarmId) {
                scheduled.append(payload)
                continue
            }
            guard let fireDate = parseDate(payload.fireAt) else { continue }
            do {
                let snoozeButton = AlarmButton(
                    text: "Snooze",
                    textColor: .white,
                    systemImageName: "zzz"
                )
                let stopButton = AlarmButton(
                    text: "Stop",
                    textColor: .white,
                    systemImageName: "stop.fill"
                )
                let alert = AlarmPresentation.Alert(
                    title: LocalizedStringResource(stringLiteral: payload.title),
                    stopButton: stopButton,
                    secondaryButton: snoozeButton,
                    secondaryButtonBehavior: .countdown
                )
                let countdown = AlarmPresentation.Countdown(
                    title: LocalizedStringResource(stringLiteral: payload.title)
                )
                let attributes = AlarmAttributes(
                    presentation: AlarmPresentation(alert: alert, countdown: countdown),
                    metadata: GoalAlarmMetadata(alarmId: payload.id, route: payload.route),
                    tintColor: .red
                )
                let duration = Alarm.CountdownDuration(
                    preAlert: nil,
                    postAlert: TimeInterval(payload.snoozeMinutes * 60)
                )
                let configuration = AlarmManager.AlarmConfiguration(
                    countdownDuration: duration,
                    schedule: .fixed(fireDate),
                    attributes: attributes
                )
                _ = try await AlarmManager.shared.schedule(
                    id: alarmId,
                    configuration: configuration
                )
                scheduled.append(payload)
            } catch AlarmManager.AlarmError.maximumLimitReached {
                break
            } catch {
                continue
            }
        }
        savePayloads(retainedCountdowns + scheduled)
        return scheduled.map(\.id)
    }

    private func loadPayloads() -> [GoalAlarmPayload] {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return [] }
        return (try? JSONDecoder().decode([GoalAlarmPayload].self, from: data)) ?? []
    }

    private func parseDate(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: value)
    }

    @available(iOS 26.0, *)
    private func permissionName(_ state: AlarmManager.AuthorizationState) -> String {
        switch state {
        case .authorized:
            return "granted"
        case .denied:
            return "denied"
        case .notDetermined:
            return "prompt"
        @unknown default:
            return "denied"
        }
    }

    private func publishOpenedAlarmIfNeeded() {
        guard #available(iOS 26.0, *),
              let alertingAlarm = try? AlarmManager.shared.alarms.first(where: { $0.state == .alerting })
        else { return }
        let payloads = loadPayloads()
        guard let payload = payloads.first(where: { uuid(for: $0.id) == alertingAlarm.id }) else { return }
        notifyListeners(
            "alarmAction",
            data: ["alarmId": payload.id, "route": payload.route, "type": "opened"],
            retainUntilConsumed: true
        )
    }

    private func savePayloads(_ payloads: [GoalAlarmPayload]) {
        if let data = try? JSONEncoder().encode(payloads) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func uuid(for value: String) -> UUID {
        let digest = SHA256.hash(data: Data(value.utf8))
        var bytes = Array(digest.prefix(16))
        bytes[6] = (bytes[6] & 0x0F) | 0x50
        bytes[8] = (bytes[8] & 0x3F) | 0x80
        return UUID(uuid: (
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
            bytes[8], bytes[9], bytes[10], bytes[11],
            bytes[12], bytes[13], bytes[14], bytes[15]
        ))
    }
}
