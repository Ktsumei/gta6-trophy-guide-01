// Leonida Trophy Guide — the entry itself: a complete, offline guide and tracker for
// GTA VI's 55 PS5 trophies. app/ holds the guide (index.html, style.css, app.js and
// data/trophies.json, where every trophy carries its official name, description and
// grade plus a guide in our own words, its sources, and the flags the app needs:
// missable, hidden, kind, chapter and roadmap stage). screenshots/ holds four real
// renders of the app (checklist with a guide open, the roadmap, a full guide with its
// sources, and the filters with spoiler-safe on); shots.json records how each was taken.
//
// The program hands it in: it copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Fail fast if the hand-in is incomplete: the scorer refuses an entry whose
// dossier is missing or whose app has no index, so say so here instead of
// silently producing a broken /output.
const dossierPath = join(out, 'dossier.json');
const indexPath = join(out, 'app', 'index.html');
if (!existsSync(dossierPath) || !existsSync(indexPath)) {
  throw new Error(`incomplete hand-in: ${dossierPath} or ${indexPath} is missing`);
}
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
const trophyCount = JSON.parse(readFileSync(join(out, 'app', 'data', 'trophies.json'), 'utf8')).trophies.length;
if (trophyCount !== 55) {
  throw new Error(`expected 55 trophies in app/data/trophies.json, found ${trophyCount}`);
}
// The gate refuses more than 4 screenshots or any one over 256 KiB, so check
// the caps here too instead of learning about it from the scorer.
const shotFiles = readdirSync(join(out, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}
for (const f of shotFiles) {
  const bytes = statSync(join(out, 'screenshots', f)).size;
  if (bytes > 262144) throw new Error(`screenshot ${f} is ${bytes} bytes, over the 256 KiB cap`);
}
console.log(`hand-in ready: ${dossierPath} (${trophyCount} trophies, ${shotFiles.length} screenshots, dossier ${readFileSync(dossierPath).length} bytes)`);
