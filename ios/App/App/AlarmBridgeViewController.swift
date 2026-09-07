import Capacitor

final class AlarmBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(DeviceAlarmPlugin.self)
    }
}
