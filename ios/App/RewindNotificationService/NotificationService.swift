import Foundation
import Intents
import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
  private struct CommunicationMetadata {
    let avatarURL: URL
    let conversationID: String
    let message: String
    let senderID: String
    let senderName: String
  }

  private let deliveryLock = NSLock()
  private var bestAttemptContent: UNMutableNotificationContent?
  private var contentHandler: ((UNNotificationContent) -> Void)?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    guard let mutableContent = request.content.mutableCopy() as? UNMutableNotificationContent else {
      deliver(request.content)
      return
    }

    bestAttemptContent = mutableContent
    guard let metadata = communicationMetadata(from: request.content.userInfo) else {
      deliver(mutableContent)
      return
    }

    var avatarRequest = URLRequest(url: metadata.avatarURL)
    avatarRequest.timeoutInterval = 8
    URLSession.shared.dataTask(with: avatarRequest) { [weak self] data, _, _ in
      guard let self else { return }
      let avatarData = data.flatMap { $0.count <= 1_000_000 ? $0 : nil }
      donateAndDeliver(
        content: mutableContent,
        metadata: metadata,
        avatarData: avatarData
      )
    }.resume()
  }

  override func serviceExtensionTimeWillExpire() {
    if let bestAttemptContent {
      deliver(bestAttemptContent)
    }
  }

  private func communicationMetadata(
    from userInfo: [AnyHashable: Any]
  ) -> CommunicationMetadata? {
    guard
      userInfo["type"] as? String == "rewind_chat_message",
      let avatarValue = userInfo["avatarUrl"] as? String,
      let avatarURL = trustedAvatarURL(from: avatarValue),
      let conversationID = nonEmptyString(userInfo["conversationId"]),
      let senderID = nonEmptyString(userInfo["senderId"]),
      let senderName = nonEmptyString(userInfo["senderName"])
    else {
      return nil
    }

    return CommunicationMetadata(
      avatarURL: avatarURL,
      conversationID: conversationID,
      message: bestAttemptContent?.body ?? "",
      senderID: senderID,
      senderName: senderName
    )
  }

  private func deliver(_ content: UNNotificationContent) {
    deliveryLock.lock()
    let handler = contentHandler
    contentHandler = nil
    deliveryLock.unlock()
    handler?(content)
  }

  private func donateAndDeliver(
    content: UNMutableNotificationContent,
    metadata: CommunicationMetadata,
    avatarData: Data?
  ) {
    let avatar = avatarData.map(INImage.init(imageData:))
    let sender = INPerson(
      personHandle: INPersonHandle(value: metadata.senderID, type: .unknown),
      nameComponents: nil,
      displayName: metadata.senderName,
      image: avatar,
      contactIdentifier: nil,
      customIdentifier: metadata.senderID
    )
    let intent = INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: metadata.message,
      speakableGroupName: nil,
      conversationIdentifier: metadata.conversationID,
      serviceName: "Vybaa",
      sender: sender,
      attachments: nil
    )
    let interaction = INInteraction(intent: intent, response: nil)
    interaction.direction = .incoming
    interaction.donate { [weak self] error in
      guard let self else { return }
      guard error == nil else {
        deliver(content)
        return
      }

      do {
        deliver(try content.updating(from: intent))
      } catch {
        deliver(content)
      }
    }
  }

  private func nonEmptyString(_ value: Any?) -> String? {
    guard let string = value as? String else { return nil }
    let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }

  private func trustedAvatarURL(from value: String) -> URL? {
    guard
      let url = URL(string: value),
      url.scheme == "https",
      url.host == "res.cloudinary.com",
      url.path.hasPrefix("/dqdtazdda/image/upload/")
    else {
      return nil
    }
    return url
  }
}
