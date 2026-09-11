# Native releases

Run from `app/` on your Mac:

```sh
npm run release -- --env production
```

This builds bundled web assets, syncs Capacitor, generates and verifies a signed Android AAB, and archives the iOS app using the shared **Vybaa** scheme. It opens the finished archive in Xcode. Nothing is uploaded automatically.

## One-time signing setup

Install dependencies, JDK 21, Android SDK 36, Xcode and CocoaPods. Sign into your Apple Developer team in Xcode; the app and notification extension must both have working automatic signing. The command checks for an Apple signing identity before changing versions. Xcode may download provisioning profiles during archiving.

Create `app/release-signing.local.json` (already ignored by Git):

```json
{
  "VYBAA_ANDROID_KEYSTORE": "./vybaa.keystore",
  "VYBAA_ANDROID_STORE_PASSWORD": "YOUR_STORE_PASSWORD",
  "VYBAA_ANDROID_KEY_ALIAS": "YOUR_UPLOAD_KEY_ALIAS",
  "VYBAA_ANDROID_KEY_PASSWORD": "YOUR_KEY_PASSWORD"
}
```

Use the existing Play Console upload key, not a new key or the debug keystore. Relative keystore paths resolve against the signing file's directory. Keep this file private; never commit passwords. These four values can instead be environment variables, which take precedence. A different file can be selected with `--signing-file PATH`. No passwords are passed as command-line arguments.

On non-Mac Android build machines, set `JAVA_HOME` to JDK 21 and `ANDROID_HOME` to the SDK directory. iOS always requires macOS.

## Check, build and retry

```sh
# Preview only: no credentials needed, no changes
npm run release -- --env production --dry-run

# Validate local signing/tooling without bumping or building
npm run release:check -- --env production

# Build one platform
npm run release -- --env production --platform android
npm run release -- --env production --platform ios

# Use another environment
npm run release -- --env development

# Retry a failed platform using the already-bumped versions
npm run release -- --env production --platform ios --no-bump
```

`--no-open` prevents opening Xcode after archiving. A lock prevents concurrent release commands. After an interrupted process, remove `releases/.release.lock` only after confirming no release is running.

## Environments

`--env` selects the Vite mode and requires `.env.<name>` to exist. For staging, create `.env.staging` first. Normal Vite precedence applies: shell environment variables and mode-specific `.local` overrides still take precedence. Check API URLs before building. Environment selection does **not** change bundle IDs, signing identities or store listings; development builds replace the same installed app. All native builds use Release configuration. Live-reload server URLs are disabled and checked after native sync.

## Versions

After preflight succeeds, the command increments Android `versionCode`, iOS `CURRENT_PROJECT_VERSION`, and the last numeric segment of each platform's public version. Existing separate Android/iOS version histories are preserved. All iOS app and extension configurations must agree. Both platform versions bump even for a single-platform run, keeping one coordinated release state.

Failed builds retain their bumped versions; use `--no-bump` to retry only if those versions have not already been uploaded. The command does not query store version history. Stage both native version files when committing the release; the existing pre-commit version hook recognizes explicitly staged version changes and avoids an extra bump. The npm package version is not the store version and is unchanged.

## Artifacts and logs

```text
app/releases/<environment>/
  android-<version>-<build>_ios-<version>-<build>/<UTC timestamp>/
    Vybaa-<environment>-v<android version>-build-<code>.aab
    release.json
    ios-archive-path.txt
    web.log
    android-sync.log
    android-build.log
    ios-sync.log
    ios-archive.log
    ios-derived-data/
```

Only selected platforms produce their files. `release.json` records environment, versions, Git commit, dirty-worktree status, completion/failure, artifact paths and the AAB SHA-256 checksum. Each run has its own timestamped folder. Failed-run logs remain available; build output is written to the printed log paths. Release artifacts and local signing settings are ignored by Git. Native sync and version changes remain in your working tree for review.

iOS archives are stored in `~/Library/Developer/Xcode/Archives/<date>/Vybaa-<environment>-v<version>-build-<number>-<timestamp>.xcarchive`, so they appear in **Xcode → Window → Organizer → Archives**. Choose **Distribute App → App Store Connect** to upload for TestFlight/App Store review. This command creates an archive, not an exported IPA. Xcode handles distribution signing during upload; App Store Connect app records, agreements and developer permissions must already be configured.

Upload the `.aab` to the intended Google Play track. Never upload development-environment artifacts to production.

References: [Android command-line bundles](https://developer.android.com/build/building-cmdline), [Apple archive troubleshooting](https://developer.apple.com/documentation/technotes/tn3109-resolving-common-archiving-issues).
