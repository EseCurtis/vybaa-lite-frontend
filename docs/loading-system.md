# Loading system

## Startup contract

`index.html` owns the only branded splash. It renders before JavaScript, using the existing icon and Outfit font. There is no percentage, minimum display time, animated dot sequence, or font-loading gate.

`StartupHandoff` dismisses it after the initial auth decision and route commit. React paints the destination before the splash fades. The `loaded` latch is document-scoped: navigation, background refresh, and warm resume cannot replay it. The application is inert to assistive technology and input until handoff. Reduced motion removes the fade.

Session restoration is a critical request with a 15-second network timeout, not a simulated delay. A transient startup failure retains tokens and exposes retry. Background session failures retain an already loaded session only while authentication tokens remain present. Rejected/removed credentials still go through existing authentication handling. No user/session data is persisted to disk by this change.

## Content and actions

- `Skeleton` is the shared opaque, CSS-only pulse primitive. Motion uses one 1.8-second timing and respects reduced motion. Decorative blocks are hidden from screen readers; sections provide the loading announcement.
- Existing Communities, Rewind, profile, wallet, and Journal skeleton consumers inherit that primitive without screen redesigns.
- `AppLoadingState` remains a compatibility boundary, rendering page-shaped placeholders rather than a splash or bottom dock. Select `home`, `auth`, or `list` for the relevant route.
- Home goals have the same 76px reserved rail height in pending, empty, and loaded states. Other Home sections remain mounted and interactive while goals load or fail.
- Keep actual content during background fetches. Use `isPending && !data` for first-load placeholders and `error && !data` for replacement errors; background failures should not discard data.
- Community templates, members, and activity keep their existing items and virtualization while another page loads. Their Load more actions are disabled during the incremental request. Flexx renders each card from its own resource rather than waiting for insights, Rewind, and achievements together.
- `QueryFeedback` standardizes section retry. `ConnectionNotice` is informational and never blocks content.
- Mutation buttons retain labels, icons, geometry, and disabled behavior, announcing `aria-busy` instead of swapping the entire action for a spinner. RevenueCat's native paywall and promise guard remain authoritative; no second fullscreen loading overlay is drawn.
- The legacy `Spinner` export remains for compatibility and uses the common compact placeholder. New content surfaces should use shaped skeletons instead.

## Requests

`createAppQueryClient` gives queries a 30-second fresh window and a 15-minute in-memory retention window. Existing per-feature stale times and mutation invalidations still take precedence. Concurrent observers share query keys. Stale cached data renders immediately while revalidation occurs on mount, focus/native resume, or reconnect. Mutations never retry automatically; queries retry transient failures once, not authorization/validation failures or cancellation.

Goals and Rewind read hooks pass AbortSignals through Axios, including cursor pagination. Cancellation remains cancellation in the interceptor; it cannot trigger token refresh. GET requests have a 20-second timeout; explicit request timeouts take precedence.

Goal page-size variants have distinct cache keys without changing the existing default key. Journal pagination now calls the real paginated endpoint, includes page size in infinite keys, follows the server's `hasMore`, and uses TanStack Query v5's `placeholderData` for page changes. Existing cursor-based Goals, Communities, Rewind, and reward lists stay paginated.

Home does not wait for a combined request bundle. The local greeting randomizers still render immediately. The optional chat-list request is deferred until a home-greeting response shows that a fallback chat lookup is needed. Goal detail prefetching happens only on press intent and uses the same key and cancellation-aware query as the destination. Existing route-code splitting and intent preloading remain enabled.

## Verification

Focused tests cover startup handoff/no replay, request deduplication, cached failures, independent resources, cancellation, offline/reconnect, page retention, and incremental fetching. `scripts/verify-loading.mjs` runs the actual app against controlled API responses and checks startup, pending Home goals, layout stability, warm navigation, request counts, offline retention, and startup retry. Supply Playwright as an external module path if it isn't installed locally; the project has no new dependency.

Example:

```
node scripts/verify-loading.mjs /path/to/playwright/index.mjs http://127.0.0.1:3018 /tmp/vybaa-loading-qa
```

Run this against a production build/preview to avoid React StrictMode's development-only mount/cancel/remount cycle inflating request counts. Browser fixtures do not exercise live backend latency or native OS launch screens; iOS/Android cold launch, background resume, and native paywall presentation still need a device smoke test.
