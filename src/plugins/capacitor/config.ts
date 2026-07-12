import ENV from '@/env';
import { App } from '@capacitor/app';
import androidConfig from './configurations/android';
import iosConfig from './configurations/ios';
import webConfig from './configurations/web';

type CapacitorAppConfigOptions = {
    onBack?: () => void;
};

const ConfigCapacitorApp = (options: CapacitorAppConfigOptions = {}) => {
    App.addListener('backButton', ({ canGoBack }: any) => {
        if (!canGoBack) {
            App.exitApp();
        } else {
            options.onBack?.();
        }
    });
    

    switch (ENV.PLATFORM) {
        case ENV.PLATFORMS.ANDROID:
            androidConfig()
            break;

        case ENV.PLATFORMS.IOS:
            iosConfig()
            break;

        case ENV.PLATFORMS.WEB:
            webConfig()
            break;

    }
}

export default ConfigCapacitorApp;
