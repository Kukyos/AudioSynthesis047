# Aapka clip recorder

A static page for recording the answer-clip corpus: 270 lines per language, English and
Hindi. Click a line, hit record, say it, hit stop. Takes are kept in the browser until you
download them as a ZIP.

Nothing is uploaded anywhere. No build step, no framework, no dependencies.

## Run it

Needs to be served over `http://localhost` or `https` — browsers refuse microphone access
on a `file://` path.

```
python -m http.server 8777
# then open http://127.0.0.1:8777
```

Deployed: push this folder, point Vercel at it as a static project (no framework, no build
command, output directory `.`).

## How to record

1. Type your name in the box. It goes into every filename, so two people's ZIPs merge
   without overwriting each other.
2. Pick English or हिंदी.
3. Click a line — the question it answers is shown above it, so you know the context.
4. <kbd>space</kbd> to start, <kbd>space</kbd> to stop. It auto-advances to the next line.
5. Every take is listed under the line with its own player. Record a line twice and you
   get two takes; delete the bad one.
6. **Download ZIP before you close the tab for good.** Takes live in this browser profile
   only — a different machine, a different browser, or cleared site data means they are gone.

Keys: <kbd>space</kbd> record/stop · <kbd>enter</kbd> or <kbd>→</kbd> next ·
<kbd>←</kbd> previous · <kbd>p</kbd> play the last take.

The green bar next to the record button is a level meter. If it barely moves, the mic is
not picking you up — a take whose peak never rises is flagged amber in the list rather than
counting as done.

## What comes out

```
en/001_arman.webm        first take
en/001_arman-2.webm      second take by the same person
hi/001_priya.webm
manifest.csv             index, language, speaker, duration, peak, the text said
```

WebM/Opus mono, 64 kbps, 48 kHz — the same container a browser sends to the ASR endpoint,
so the test corpus matches the production path. Echo cancellation, noise suppression and
auto gain are all **off on purpose**: this corpus is what we measure ASR against, and
hospital noise gets mixed in later at a known SNR rather than being recorded in.

Check what is still missing (folder or ZIP, several ZIPs at once is fine one at a time):

```
cd server && python -m eval.clip_index --check path/to/clips.zip
```

## The clip list

`clips.js` is generated — do not edit it. It comes from the question ontology:

```
cd server && python -m eval.clip_index
```

Regenerate after any change to `ontology/questions/*.yaml`, and copy `clips.js` across if
this folder is deployed from a separate repo.
