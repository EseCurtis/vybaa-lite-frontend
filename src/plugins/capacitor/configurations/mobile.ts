
import { configPurchases } from "@/plugins/revenuecat/configure-purchases";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { addPushNotificationListeners, createPushNotificationChannels, registerPushNotifications } from "../plugins/push-notification.plugin";

const mobileConfig = async () => {
    //return 
    await Promise.all([
        await Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
            await configPurchases({ customerInfo });
        }),
        await registerPushNotifications().then(async () => {
           
          

        }).catch(() => {
            //alert(error)
        }),

          await Promise.all([
                await addPushNotificationListeners(),
                await createPushNotificationChannels()
            ]).then(() => {
               // alert("X=>>"+JSON.stringify(res2))
            })
    ])
}

export default mobileConfig;