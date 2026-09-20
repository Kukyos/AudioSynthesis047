# Aapka clip recorder

A page for recording the answer-clip corpus: 270 lines per language, English and Hindi.
Click a line, hit record, say it, hit stop. Every take is playable straight away, and with a
team key it uploads to a shared store so everyone sees the same progress.

Plain HTML and JavaScript — no framework, no build step, two tiny API routes.

## Deploy

1. Import this repo on Vercel. Framework preset **Other**, no build command, output
   directory **`.`** (the repo root).
2. Storage → **Create Blob Store**, name it `aapka-clips`, region Mumbai (`bom1`), access
   **Public**. Connect it to the project — that sets `BLOB_READ_WRITE_TOKEN` for you.
   Public means a clip's URL plays without a token, which is how the page previews takes;
   the URLs hold nothing but people reading scripted lines.
3. Settings → Environment Variables → add **`UPLOAD_KEY`**, any shared passphrase. Both
   API routes refuse everything without it, so nobody can dump files into the store.
4. Redeploy. Give teammates the URL and the key.

Locally, the page alone works over any static server; the upload and list routes only
exist on Vercel.

```
python -m http.server 8777     # then http://127.0.0.1:8777
```

A `file://` path will not work — browsers refuse microphone access there.

## Where the audio lives

Two places, on purpose.

- **This browser (IndexedDB).** Every take is saved here first, before any network call.
  Recording keeps working with no key, bad wifi, or the store down.
- **The shared Blob store**, if a team key is entered. Each take uploads right after it is
  recorded, as `en/017_arman_1758380000000.webm`. Everyone with the key sees everyone's
  takes and can play them.

A take that failed to upload is labelled `not synced`; **Sync** retries all of them. Nothing
is ever dropped because an upload failed.

Without a key, nothing leaves the browser — that is fine, but then **Download ZIP** is the
only copy, and clearing site data loses the rest.

## How to record

1. Type your name. It goes into every filename, so two people never overwrite each other.
2. Pick English or हिंदी.
3. Click a line. The question it answers is shown above it. Hindi lines carry a romanised
   reading underneath (`pet mein dard`) for anyone who does not read Devanagari.
4. <kbd>space</kbd> start, <kbd>space</kbd> stop. It advances to the next line by itself.
5. Take a line twice and you get two takes; delete the bad one.

Keys: <kbd>space</kbd> record/stop · <kbd>enter</kbd> or <kbd>→</kbd> next ·
<kbd>←</kbd> back · <kbd>p</kbd> play the last take.

The green bar is a level meter — halfway is right, pinned to the end is clipping. A take
that never rises above silence is flagged amber instead of counting as done.

## What comes out

**Download ZIP** packs this browser's takes *and* everything in the team store:

```
en/001_arman_1758380000000.webm
hi/001_priya_1758380912345.webm
manifest.csv          index, language, speaker, duration, peak, the text said
```

WebM/Opus mono, 64 kbps, 48 kHz — the same container the kiosk sends to the ASR endpoint,
so the test corpus matches the production path. Echo cancellation, noise suppression and
auto gain are **off on purpose**: this corpus is what we measure ASR against, and hospital
noise is mixed in later at a known SNR rather than recorded in.

Check what is still missing, against a folder or a ZIP:

```
cd server && python -m eval.clip_index --check path/to/clips.zip
```

## The clip list

`clips.js` is generated — never edit it by hand. It comes from the question ontology:

```
cd server && python -m eval.clip_index
```

Re-run it after any change to `ontology/questions/*.yaml` or `ontology/hinglish.json`, and
copy `clips.js` over here if this folder is deployed from its own repo.
