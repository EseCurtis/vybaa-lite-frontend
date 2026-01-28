import { StatusBar } from "@capacitor/status-bar";
import mobileConfig from "./mobile";

const androidConfig = () => {
    StatusBar.setOverlaysWebView({ overlay: true });
    document.documentElement.style.setProperty('--statusbar-clearfix', '20px');
    // initSubscriptionPlugin();
    mobileConfig();
}

export default androidConfig;