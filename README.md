# Better Daze V6 — Fresh Build

A new standalone, mobile-first web app. It does **not** migrate existing V4/V5 data automatically.

## Features
- Five sections: Today, Sleep, Move, Work, Review
- Editable daily checklists and per-section daily notes
- Daily completion indicator and streak
- 15/25/45 minute focus timer
- Original synthesized short section-entry cue, with fade-out, opt-in and master mute
- Reduced motion support via operating system, and user setting (animations are already OS-reduced-motion aware)
- JSON backup and restore; local-only browser storage
- Installable PWA with offline caching on HTTPS

## Deployment
Upload all files to the **root** of a GitHub repository/branch. Vercel can deploy this as a static site with `index.html` at the root. Test on a preview branch/deployment before updating production.

## Caveats
- New storage key `better-daze-v6`; old versions are untouched, but old data is not imported.
- Section audio is a **new original synthesized cue**, not a classical composition or licensed recording.
- Browser storage can be lost if site data is cleared; export backups regularly.
- Timer runs while page is open; background operating-system restrictions may delay the completion notification.
