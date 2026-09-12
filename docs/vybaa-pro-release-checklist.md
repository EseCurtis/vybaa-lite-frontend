# Vybaa Pro release checklist

## App Store Connect

- Sign the Paid Applications Agreement and finish banking and tax setup.
- Create the `Vybaa Pro` auto-renewable subscription group.
- Create `com.vybaa.pro.monthly` at USD 4.99 per month.
- Create `com.vybaa.pro.annual` at USD 39.99 per year.
- Add a seven-day introductory free trial to both products. Apple limits introductory eligibility across the subscription group.
- Add localized names, descriptions, review screenshots, Terms, and Privacy links.

## RevenueCat

- Add the Vybaa App Store app and its In-App Purchase key.
- Create entitlement `vybaa_pro`.
- Attach both App Store products to `vybaa_pro`.
- Create offering `default` with `$rc_monthly` and `$rc_annual` packages.
- Publish a native paywall for `default` with the annual option emphasized.
- State the seven-day trial, renewal price and period, automatic renewal, Apple cancellation path, Terms, Privacy, and Restore Purchases action.
- Enable Customer Center with subscription management, restore, refund guidance, and support contact.
- Put the public iOS SDK key in `VITE_REVENUECAT_IOS_API_KEY`. Never put a RevenueCat secret REST key in the app.
- Put the secret RevenueCat v1 REST key in the cloud as `REVENUECAT_REST_API_KEY` and keep `REVENUECAT_ENTITLEMENT_ID=vybaa_pro`.

## Google Play Console

- Create the Android app with package name `com.vybaa.app`.
- Upload a signed Android App Bundle to an internal or closed test track before testing purchases.
- Create subscription `com.vybaa.app.pro.monthly` with base plan `monthly` at USD 4.99 per month.
- Create subscription `com.vybaa.app.pro.annual` with base plan `annual` at USD 39.99 per year.
- Add a seven-day new-customer trial to both base plans and activate the subscriptions and base plans.
- Add license testers and make sure test accounts install Vybaa through the Play testing opt-in link, not through Android Studio.

## RevenueCat Android

- Android app `com.vybaa.app` is registered in the Vybaa RevenueCat project.
- Android products use `com.vybaa.app.pro.monthly:monthly` and `com.vybaa.app.pro.annual:annual` and are attached to `vybaa_pro`.
- The Android products are attached to `$rc_monthly` and `$rc_annual` in the current `default` offering.
- The default native paywall is published. Review its final copy, colors, Terms, Privacy, trial, renewal, and restore presentation in the RevenueCat editor before release.
- Create a dedicated Google Play service account for RevenueCat. Grant **View app information and download bulk reports**, **View financial data, orders, and cancellation survey responses**, and **Manage orders and subscriptions**.
- Upload that service-account JSON in RevenueCat under the Vybaa Android app and wait for every credential check to pass. Do not use the Firebase Admin service account for this.
- Configure Google Real-Time Developer Notifications for the RevenueCat Android app.
- Keep `VITE_REVENUECAT_ANDROID_API_KEY` set to the public `goog_` key in release builds. Never ship the shared `test_` key.

## Sandbox verification

- Run `pnpm build`, `pnpm exec cap sync ios`, and install the generated pods.
- Test monthly and annual trial purchase, cancellation, renewal, expiration, restore, account switching, relaunch persistence, and Customer Center on a physical iPhone.
- Verify purchases unlock immediately and the server still rejects spoofed client entitlement state.
- Verify downgraded users can read and check into existing content but cannot create above free limits.
- Run `pnpm build --mode production`, `pnpm exec cap sync android`, and `JAVA_HOME=$(/usr/libexec/java_home -v 21) ./android/gradlew -p android assembleDebug`.
- Test monthly and annual trial purchase, cancellation, renewal, expiration, restore, account switching, relaunch persistence, pending payment, and Customer Center on a physical Android device through a Play test track.

## Competition delivery

- Release the first public version by September 15, 2026.
- Export one real app screenshot at exactly 1179 x 2556 pixels, without a device frame.
- Use the existing 1024 x 1024 Vybaa icon.
- Record a two-minute device demo: goal, community, Rewind, Pro gate, RevenueCat paywall, sandbox trial, immediate unlock, and Settings subscription management.
- Use original app audio or no music.
- Submit the public App Store URL, text description, video URL, icon, screenshot, and a working trial.
