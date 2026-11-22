# For Saudah · 19th Birthday Website

Static site (HTML + CSS + vanilla JS). No server, database or build step.

## Upload to GitHub Pages (about 3 minutes)
1. On github.com click **New repository**. Name it `saudah-birthday`, set it to **Public**, and create it.
2. Click **uploading an existing file**. Drag in everything from inside this folder (`index.html`, `css`, `js`, `assets`, `video`, `audio`). `index.html` must sit at the top level of the repo. Click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. Wait 1–2 minutes. Your link will be `https://<your-username>.github.io/saudah-birthday/`.
5. Open it on your own phone first, tap the button, and check that the song plays. Then send the link on WhatsApp.

## Edit the words
- Love letter: `index.html`, search for `EDIT THE LETTER HERE`.
- Star messages: the `data-msg` attributes in the `sky` section of `index.html`.
- Photo captions: the `<span class="cap">` lines (and the `photos` list near the top of the gallery section in `js/main.js`).

## Notes
- The video is muted in three ways (no audio track, `muted` attribute, and a script that re-mutes it). The song is a separate audio element.
- If the song is blocked by a browser, a "Tap to play" prompt appears; the page never claims music is playing unless the browser confirms it.
- The music file is Christina Perri's recording. Fine for a private gift link; do not publish the site widely.
- Fonts load from Google Fonts when online and fall back to system serif fonts offline.
