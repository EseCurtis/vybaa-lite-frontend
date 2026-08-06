# Vybaa Pro release checklist

## App Store Connect

- Sign the Paid Applications Agreement and finish banking and tax setup.
- Create the `Vybaa Pro` auto-renewable subscription group.
- Create `com.vybaa.app.pro.monthly` at USD 4.99 per month.
- Create `com.vybaa.app.pro.annual` at USD 39.99 per year.
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

## Sandbox verification

- Run `pnpm build`, `pnpm exec cap sync ios`, and install the generated pods.
- Test monthly and annual trial purchase, cancellation, renewal, expiration, restore, account switching, relaunch persistence, and Customer Center on a physical iPhone.
- Verify purchases unlock immediately and the server still rejects spoofed client entitlement state.
- Verify downgraded users can read and check into existing content but cannot create above free limits.

## Competition delivery

- Release the first public version by September 15, 2026.
- Export one real app screenshot at exactly 1179 x 2556 pixels, without a device frame.
- Use the existing 1024 x 1024 Vybaa icon.
- Record a two-minute device demo: goal, community, Rewind, Pro gate, RevenueCat paywall, sandbox trial, immediate unlock, and Settings subscription management.
- Use original app audio or no music.
- Submit the public App Store URL, text description, video URL, icon, screenshot, and a working trial.
