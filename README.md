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
- Opt-in real classical recordings, short introductions, fade to silence, no overlaps, once per section per page session, master mute and visible playback status. Full performer/source/licence credits are in Settings. Food is quiet. Recordings stream from Wikimedia Commons and require internet.
- JSON backup/restore, validation before replacement and a local pre-restore safety copy. Migration supports the uploaded V6 prototype and original V3/V4 data shape, including counts, priorities, notes and reflections.
- PWA manifest, original panda icon and offline caching of the app shell on HTTPS.

## Data continuity

Existing V6 prototype data is upgraded under the same `better-daze-v6` key, with an untouched pre-upgrade copy. Legacy `better-daze-v3` data on the **same origin** is copied when V6 is first opened without existing V6 data. Settings also offers a missing-day import when legacy data exists. Older local storage keys are never deleted. Invalid saved JSON is preserved and automatic writes are blocked until a valid restore.

Different deployments/domains do not share browser storage. Use a JSON export/restore to transfer data; GitHub does not contain your personal app entries. Clearing browser data removes local entries and local safety copies, so keep an exported backup.

## Run

Serve the repository root with any static HTTP server. There is no build or dependency installation. Deploy with `index.html` at the root; Vercel framework preset **Other**, no build command and root output work for this layout.

Run state regression checks with:

```sh
node --test tests/state.test.cjs
```

Verified: legacy and prototype migration, backup round trip, malformed-input rejection, corrupt-storage protection, overnight sleep arithmetic and exactly-once timer completion. Browser smoke checks cover routine progress, overnight sleep logging, charts, priorities, timer reload, appearance and reduced-motion settings. No real iPhone hardware test has been performed. Offline installation requires HTTPS and a successful initial visit; streaming music and daylight lookup are online features. Browser background alerts/cloud sync are not implemented.
