# Flexx motion and partner expressions

The existing feed data, stats, authors, partner reactions, recommendation selection,
questionnaire answers and pagination remain unchanged. This layer is presentation
only and makes no AI or API requests of its own.

## Motion

`src/shared/flexx/flexx-presentation.ts` chooses a stable treatment from the saved
design ID. Some posters drift a headline, breathe a real metric or tilt an icon;
some stay still. Values are never counted up, replaced or fabricated. At most one
text/metric/icon loop and one partner portrait run on a poster.

`useFlexxMotion` observes page visibility once for the whole feed. Only the active
poster plays. Neighbors remain paused, and the existing five-poster render window
is preserved. The header provides Pause/Resume. Both the hook and scoped CSS honor
reduced-motion settings. No per-frame React updates or looping JS timers are used.

Image export resets only cloned animation nodes to their untransformed still
positions through `freezeFlexxForExport`; live playback is unaffected. Existing
private-answer export exclusions remain in place.

## Artwork

Six partners, eight poses each: thinking, typing, cheering, laughing, surprised,
listening, skeptical and calm. Identity references remain the original six files
under `public/assets/rewind/`; avatars elsewhere in the app are not replaced.

Runtime assets: `public/assets/rewind/expressions/v1/<partner>/<expression>.webp`.
Generated source sheets and prompts are archived outside the app bundle at
`../social-media/vybaa/source/rewind-partners/expressions/2026-10-19/v1/`.

Questionnaires get a reserved header slot with the author partner thinking or
listening, changing to calm after saving. The answer sheet uses listening, or
typing when the custom field is selected. These are illustrations, not a claim
that another person is live, online or typing a message.

Only selected roomy stat layouts receive portraits. Dense grids and percentage
rings do not. Missing achievements and zero-day streaks never use cheering art.
Portraits have fixed aspect-ratio space, remain outside readable text and controls,
and degrade to that reserved slot on image failure. Decorative art is hidden from
screen readers; author identities remain accessible in the existing action rail.

## Rebuilding assets

macOS tooling: `sips`, and `cwebp` from libwebp. No application dependency added.

```sh
node scripts/pack-rewind-expressions.mjs ../social-media/vybaa/source/rewind-partners/expressions/2026-10-19/v1 v1
```

The script slices four-column/two-row generated atlases into separate transparent
480px WebP assets. It refuses to overwrite an existing version directory. For a
revised pack, create a new source/version folder and update the versioned registry;
never replace the current original avatars or archived sheets.
