import Capacitor

final class AlarmBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(DeviceAlarmPlugin())
    }
}
