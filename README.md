[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ktsumei/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ktsumei/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI

A complete, offline trophy guide and tracker for **Grand Theft Auto VI** on PlayStation 5: all **55 trophies** (1 platinum, 2 gold, 6 silver, 46 bronze), each with its official name, description and grade, a guide written in our own words, and the source each guide cites.

## What it does

- **The checklist** — every trophy with its official name, description and grade. Click one to read its full guide beside the list.
- **Cited guides** — each guide says where its facts come from (PowerPyx's GTA 6 Trophy Guide & Roadmap, Output Lag's GTA 6 Trophy List). A source is cited, never copied. The five trophies whose exact method the guides have not confirmed yet are marked as unconfirmed rather than guessed at.
- **Roadmap to the platinum** — three stages: play the story (Chapters 1–5), the 100% completion checklist, then stranger strands and cleanup. About 200 hours, one playthrough.
- **Missable flags** — only one trophy can be missed (Positive Mental Attitude: meditate with Lucia in Chapter 1). It is flagged everywhere, with a Chapter 1 save recommended.
- **Tracker** — tick trophies off and your progress saves in your browser (localStorage), with a progress bar and a per-grade breakdown.
- **Filters** — by grade, by kind (story, missable, character quests, collectibles, activities, robberies, 100% completion, one-offs), by earned/unearned, plus search.
- **Spoiler-safe mode** — hides the names and descriptions of story and hidden trophies until you earn them.
- **Export / import** — save your progress as JSON and bring it back on another device.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: the app is plain static files under `app/` and loads nothing from outside. The trophy data lives in `app/data/trophies.json`.

## Screenshot scenes

`shots.json` records the four reproducible scenes (see `app.js` for the query params): the checklist with a guide open, the roadmap, a full guide with its sources, and the filters with spoiler-safe on.

## Notes

- This is an unofficial fan-made reference. It is not affiliated with Rockstar Games or Sony Interactive Entertainment, and it uses no official artwork, logos or game screenshots.
- Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.
