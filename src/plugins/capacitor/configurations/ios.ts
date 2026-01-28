import { StatusBar } from "@capacitor/status-bar";
import mobileConfig from "./mobile";

const iosConfig = () => {
    StatusBar.setOverlaysWebView({ overlay: true });
    document.documentElement.style.setProperty('--statusbar-clearfix', '25px');

    mobileConfig();
}

export default iosConfig;