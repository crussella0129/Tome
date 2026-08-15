// Tome desktop shell (Electron). Renders the built static site (`dist/`) fully
// offline in a secure window: a custom `app://tome/` protocol maps root-absolute
// URLs onto `dist/` via the shared `resolveDistPath`, so routes, `/_astro/…`
// assets, `/fonts/…`, and `/search-index.json` all load with no dev server and no
// network. Internal navigation stays in-app; external http(s) links open in the
// OS browser. CommonJS main; the ESM resolver is loaded via dynamic import.
const { app, BrowserWindow, protocol, shell } = require('electron');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'tome';
const ORIGIN = `${SCHEME}://${HOST}`;
const DIST_ROOT = path.join(__dirname, '..', 'dist');
// Windows takes the .ico; Linux takes the .png. macOS uses the app bundle icon.
const ICON = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

// Must run before `app.ready`. `standard` gives the scheme an origin/host so URL
// parsing and same-origin fetch work; `secure` marks it a secure context;
// `supportFetchAPI` lets the page `fetch('/search-index.json')` against it.
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

/** True only for http/https — the sole schemes we hand to the OS browser. */
function isExternalHttp(url) {
  try {
    const { protocol: p } = new URL(url);
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
}

/** Route an off-origin target: external http(s) -> OS browser; anything else dropped. */
function handleExternal(url) {
  if (isExternalHttp(url)) shell.openExternal(url);
}

function createWindow(resolveDistPath, contentTypeFor) {
  // Serve `dist/` for every app:// request; a path escaping dist -> 404.
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const file = resolveDistPath(pathname, DIST_ROOT);
    if (file === null) {
      return new Response('Not found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
    try {
      const body = await readFile(file);
      return new Response(body, { headers: { 'content-type': contentTypeFor(file) } });
    } catch {
      return new Response('Not found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  });

  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 480,
    backgroundColor: '#f4ecd8', // parchment — avoids a white flash before paint
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // New windows / window.open: never open in-app; external http(s) -> OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    handleExternal(url);
    return { action: 'deny' };
  });

  // In-window navigation: allow the app origin; send anything else out and stop it.
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(ORIGIN)) return;
    event.preventDefault();
    handleExternal(url);
  });

  win.loadURL(`${ORIGIN}/`);
  return win;
}

app.whenReady().then(async () => {
  // Group the window under Tome's own taskbar identity (and icon) on Windows.
  if (process.platform === 'win32') app.setAppUserModelId('com.tome.desktop');

  const mod = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'dist-resolve.mjs')).href);
  const { resolveDistPath, contentTypeFor } = mod;

  createWindow(resolveDistPath, contentTypeFor);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(resolveDistPath, contentTypeFor);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
