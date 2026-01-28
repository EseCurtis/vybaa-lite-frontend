import type { CustomerInfo } from "@revenuecat/purchases-capacitor";

export const configPurchases = async ({ }: { customerInfo: CustomerInfo }) => {
    // return Purchases.getCustomerInfo()
    //     .then(async (mainInfo) => {
    //         let { customerInfo } = defaultsMainInfo || mainInfo;
    //         let isSubscribed = customerInfo.activeSubscriptions.length > 0;
    //         let matchedProduct = await getProduct(customerInfo.activeSubscriptions);


    //         let aPackage = matchedProduct && matchedProduct[0] || null;


    //         setConfig(sync, aPackage, isSubscribed, { managementURL: customerInfo.managementURL, expirationDates: customerInfo.allExpirationDates });
    //     })
    //     .catch((error) => {

    //         !sync && setConfig(sync);
    //         //dev_log({ customerInfo: { error: error.toString() } });
    //     });
}


