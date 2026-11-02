# Better Daze V6

A calm, mobile-first wellness app built from the original Better Daze V4.5 source and the uploaded V6 prototype. The original `DSUN38a/Better-Daze` repository is unchanged.

## What's included

- Six coordinated sections: Today, Sleep, Move, Work, Food and Review.
- Original panda artwork with gentle breathing motion, page transitions and small completion celebrations. Both system and in-app reduced-motion controls stop animation.
- Editable, reorderable daily routines with stable IDs; completion history, momentum streak and weekly chart.
- Push-up personal best and milestones, weekly gym logging, water logging and seven-day charts.
- Three editable work priorities, copying to ChatGPT, per-section daily notes and weekly reflection.
- Sleep/wake settings, a relative wind-down timeline, 15/30/60-minute wind-down timer, sleep log, restedness rating and seven-night sleep chart.
- 15/25/45/50-minute focus timer with pause/reset, a separate 10-minute break and completed-session history. Deadlines survive reloads and catch up when the app returns.
- Light, Dark, Follow iPhone/system and Auto sunset/sunrise appearance. Daylight lookup requests location only after a tap, sends approximate coordinates to Open-Meteo and does not save coordinates. Refresh daylight each day; Auto follows system appearance when daylight is unavailable.
- Opt-in real classical recordings, short introductions, fade to silence, no overlaps, once per section per page session, master mute and visible playback status. Full performer/source/licence credits are in Settings. Food is quiet. Compact licensed excerpts ship with the app and are precached for offline use. Decoded audio is retained after permission for faster section changes. Each introduction now plays three seconds longer before its three-second fade.
- JSON backup/restore, validation before replacement and a local pre-restore safety copy. Migration supports the uploaded V6 prototype and original V3/V4 data shape, including counts, priorities, notes and reflections.
- PWA manifest, original panda icon and offline caching of the app shell on HTTPS.

## Data continuity

Existing V6 prototype data is upgraded under the same `better-daze-v6` key, with an untouched pre-upgrade copy. Legacy `better-daze-v3` data on the **same origin** is copied when V6 is first opened without existing V6 data. Settings also offers a missing-day import when legacy data exists. Older local storage keys are never deleted. Invalid saved JSON is preserved and automatic writes are blocked until a valid restore.

Different deployments/domains do not share browser storage. Use a JSON export/restore to transfer data; GitHub does not contain your personal app entries. Clearing browser data removes local entries and local safety copies, so keep an exported backup.

## Run

Serve the repository root with any static HTTP server. There is no build or dependency installation. Deploy with `index.html` at the root; Vercel framework preset **Other**, no build command and root output work for this layout.

Run state regression checks with:

```sh
node --test tests/*.test.cjs
```

Verified: legacy and prototype migration, backup round trip, malformed-input rejection, corrupt-storage protection, overnight sleep arithmetic and exactly-once timer completion. Browser smoke checks cover routine progress, overnight sleep logging, charts, priorities, timer reload, appearance and reduced-motion settings. No real iPhone hardware test has been performed. Offline installation requires HTTPS and a successful initial visit; daylight lookup is an online feature. Browser background alerts/cloud sync are not implemented.

## Graphic study update

An editorial design study informed by Peter Saville’s high-level use of typography, colour coding and graphic restraint. Regular sans-serif type, fine rules, small colour registers, numbered section navigation, flat colour fields and clearer phone controls replace the layered legacy styles. The panda remains the app icon. Dashboard tiles open their tracking sections. All six sections were checked at 320px and 390px widths without horizontal overflow; this is browser viewport QA, not a physical iPhone test.

Audio excerpts are 15/18/13/15/15 seconds for Today/Sleep/Move/Work/Review. Fade starts at 12/15/10/12/12 seconds. See audio/LICENSES.md and audio/credits.json for recording provenance and adaptations.

## Approved panda identity and opening

The updated panda icon is used in-app and through versioned Apple touch and web app icon assets. The startup logo sequence lasts up to 3.2 seconds and respects reduced motion. Tap Enter with music during it, or Play opening afterward, to hear Vivaldi’s Autumn, RV 293, I. Allegro (15-second local excerpt, fade from 12 to 15 seconds). Continue quietly mutes audio. Replay opening animation is available in Settings. Existing Home Screen icons may retain artwork cached by the phone; the site now supplies the new versioned assets.
