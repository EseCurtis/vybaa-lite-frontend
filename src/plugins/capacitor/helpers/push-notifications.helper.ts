

import type { Importance, Visibility } from "@capacitor/push-notifications";

export function createPushNotificationChannel({
    id, name, description, sound, importance = 2, visibility, vibration, lightColor, lights,
}: { id: string, name: string, description: string, sound: string, importance: Importance, visibility: Visibility, lights: boolean, lightColor: string, vibration: boolean }) {
    // Validate inputs if needed
    if (!id || !name || !description || !sound || !visibility) {
        throw new Error("Missing required parameters");
    }

    // Construct payload
    const payload = {
        id,
        name,
        description,
        sound,
        importance,
        visibility,
        lights,
        lightColor,
        vibration
    };

    return payload;
}

