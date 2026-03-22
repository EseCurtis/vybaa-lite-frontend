
import { SafeArea } from "capacitor-plugin-safe-area";

const webConfig = () => {
    document.documentElement.style.setProperty('--statusbar-clearfix', '0px');
    document.documentElement.style.setProperty('--statusbar-clearfix', '25px');

    SafeArea.getSafeAreaInsets().then(({ insets }) => {
        // alert(JSON.stringify(insets));
        for (const [key, value] of Object.entries(insets)) {
            document.documentElement.style.setProperty(
                `--safe-area-inset-${key}`,
                `${value+10}px`,
            );
        }
    })
}

export default webConfig;