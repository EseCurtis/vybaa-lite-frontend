
import { configPurchases } from "@/plugins/revenuecat/configure-purchases";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { SafeArea } from "capacitor-plugin-safe-area";
import { addPushNotificationListeners, createPushNotificationChannels, registerPushNotifications } from "../plugins/push-notification.plugin";

const mobileConfig = async () => {
    //return 
    await Promise.all([
        await Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
            await configPurchases({ customerInfo });
        }),
        await registerPushNotifications().then(async () => {
        }).catch(() => { }),
        await Promise.all([
            await addPushNotificationListeners(),
            await createPushNotificationChannels()
        ]).then(() => { }),
        SafeArea.getSafeAreaInsets().then(({ insets }) => {
           // alert(JSON.stringify(insets));
            for (const [key, value] of Object.entries(insets)) {
                document.documentElement.style.setProperty(
                    `--safe-area-inset-${key}`,
                    `${value}px`,
                );
            }
        })

    ])


}

export default mobileConfig;