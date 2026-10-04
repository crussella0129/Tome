# Take It to the Table

Once your books are in the library (see *Find Your Books*), there are four
ways to read them, from a single laptop to a tablet passed around the table.

## On this computer

- **In a browser, live:** `npm run dev`, then open <http://localhost:4321>.
- **In a browser, as built:** `npm run build`, then `npm run preview`.
- **As a desktop app, fully offline:** `npm run electron` opens the built
  library in its own window. For a Windows laptop or 2-in-1, `npm run tauri:build`
  produces a small installer (see the README). Nothing needs to stay running,
  and no network is required.

## On a tablet, over your Wi-Fi

The laptop serves, and the tablet (an iPad, an Android tablet, or a phone) reads
in its browser.

1. Build the library: `npm run build`.
2. Serve it to the network: `npm run preview -- --host`. Astro prints every
   address it is listening on (`Network: http://192.168.…:4321`).
3. Find the laptop's address on your Wi-Fi:
   - Windows: `ipconfig`, then **Wireless LAN adapter Wi-Fi → IPv4 Address**.
   - macOS: `ipconfig getifaddr en0`.
   - Linux: `hostname -I`.
4. On the tablet, open `http://<that address>:4321` in Safari or Chrome.
5. For an app-like reader, use Safari's **Share → Add to Home Screen**. It opens
   full screen, and browsers that support it tint their toolbar to the current
   theme.

> [!TIP]
> If Windows asks whether Node.js may use the network, allow **Private**
> networks only. Stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd>, or with
> `npx astro preview stop` if it started in the background.

> [!WARNING]
> The tablet reads from the laptop. Both must be on the same network, and the
> laptop must stay awake. There is no offline cache yet.

## Live edits during a session

To change pages while players read, serve a single book in development mode:

```bash
TOME_BOOK=~/dnd/tablets npm run dev -- --host
```

```powershell
$env:TOME_BOOK = "C:\Users\you\dnd\tablets"; npm run dev -- --host
# afterwards: Remove-Item Env:TOME_BOOK
```

Edits to a chapter, or to `SUMMARY.md`, reach the tablet in about a second
with no restart. In testing, linking a previously unlinked chapter made it
readable in under a second. `TOME_BOOK` shows that one book only, overriding
your manifest, and only `TOME_BOOK` gets live reload.

## Without the laptop: static hosting

`npm run build` writes plain static files to `dist/`. Any static host can serve
them, **as long as it serves them at the root of a domain**:

- Netlify (drag `dist/` onto Netlify Drop), Cloudflare Pages, or your own domain
  all work.
- A GitHub Pages *user* site (`you.github.io`) works. A *project* site
  (`you.github.io/repo/`) does not: Tome's links start at the site root, so
  pages under a sub-path break. This is a known limitation.

> [!CAUTION]
> Uploading publishes. Unless your host offers password protection or access
> control and you turn it on, anyone with the link can read every page,
> including tablets your players haven't found yet. For secret handouts, prefer
> the Wi-Fi setup above.

Pages need a connection the first time they are opened, and there is no offline
mode yet. If a build runs without internet, the Mekzantine font is skipped and
text falls back to the system monospace font.
