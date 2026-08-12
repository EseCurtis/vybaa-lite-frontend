
import { IS_ANDROID } from "@/shared/constants.shared";
import { SafeArea } from "capacitor-plugin-safe-area";
import { addPushNotificationListeners, createPushNotificationChannels, registerPushNotifications } from "../plugins/push-notification.plugin";

const mobileConfig = async () => {
    //return 
    await Promise.all([
        await registerPushNotifications().then(async () => {
        }).catch(() => { }),
        await Promise.all([
            await addPushNotificationListeners(),
            await createPushNotificationChannels()
        ]).then(() => { }),
        SafeArea.getSafeAreaInsets().then(({ insets }) => {
            // alert(JSON.stringify(insets));
            for (let [key, value] of Object.entries(insets)) {

                if (key == "bottom" && IS_ANDROID) {
                    // Android has a soft navigation bar that overlaps the app content, so we set a larger bottom inset to account for it.
                    value += 20
                }
                document.documentElement.style.setProperty(
                    `--safe-area-inset-${key}`,
                    `${value}px`,
                );
            }
        })

    ])


}

export default mobileConfig;
