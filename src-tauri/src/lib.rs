// Tome desktop shell — Tauri v2 (production port, INT-0017).
//
// Loads the built static site (`../dist`, embedded via `frontendDist`) in a native
// WebView2 window, offline. Internal navigation stays in-app; external http(s)
// links open in the OS browser. Reaches Electron parity: a theme-aware window icon
// (the "T" mark, dark on dark / ink on parchment) and zoom hardening (user zoom is
// disabled so an accidental pinch / Ctrl-wheel can't collapse the layout). Isolated
// from the Electron shell (electron/).
use tauri::image::Image;
use tauri::{Theme, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_opener::OpenerExt;

// The Tome "T" window icon in both palettes — cream-on-near-black for OS dark mode,
// ink-on-parchment for light. Mirrors electron/assets/icon-{dark,light}.png and the
// dark/light decision in electron/icon-variant.cjs (`resolveIconVariant`).
const ICON_DARK: &[u8] = include_bytes!("../icons/window-dark.png");
const ICON_LIGHT: &[u8] = include_bytes!("../icons/window-light.png");

/// The icon variant for a window theme. Unknown theme falls back to light, matching
/// the Electron shell (`systemPrefersDark ? 'dark' : 'light'`, default light).
fn icon_for(theme: Option<Theme>) -> Image<'static> {
    let bytes = if matches!(theme, Some(Theme::Dark)) {
        ICON_DARK
    } else {
        ICON_LIGHT
    };
    Image::from_bytes(bytes).expect("embedded window icon should decode")
}

/// Set the window icon to match the current OS theme.
fn apply_theme_icon(window: &WebviewWindow) {
    let _ = window.set_icon(icon_for(window.theme().ok()));
}

/// Windows: disable WebView2 user zoom (pinch + Ctrl+wheel) so an accidental gesture
/// can't shrink the viewport below the responsive breakpoint and collapse the reader.
/// Keyboard zoom (Ctrl +/-) is disabled separately via `zoom_hotkeys_enabled(false)`.
#[cfg(target_os = "windows")]
fn disable_webview_zoom(window: &WebviewWindow) {
    let _ = window.with_webview(|webview| unsafe {
        if let Ok(core) = webview.controller().CoreWebView2() {
            if let Ok(settings) = core.Settings() {
                let _ = settings.SetIsZoomControlEnabled(false);
            }
        }
    });
}

#[cfg(not(target_os = "windows"))]
fn disable_webview_zoom(_window: &WebviewWindow) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();
            let window =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                    .title("Tome")
                    .inner_size(1100.0, 820.0)
                    .min_inner_size(480.0, 360.0)
                    // Disable keyboard zoom (Ctrl +/- / Ctrl+0). Pinch/Ctrl-wheel is
                    // handled by the WebView2 hook below (the INT-0013 zoom parity).
                    .zoom_hotkeys_enabled(false)
                    // Keep app-origin navigation in-app; send external http(s) to the OS
                    // browser (the Electron setWindowOpenHandler / will-navigate parity).
                    .on_navigation(move |url| {
                        let host = url.host_str().unwrap_or_default();
                        let internal = url.scheme() == "tauri"
                            || host == "tauri.localhost"
                            || host == "localhost";
                        if internal {
                            return true;
                        }
                        if url.scheme() == "http" || url.scheme() == "https" {
                            let _ = handle.opener().open_url(url.as_str(), None::<&str>);
                            return false; // don't navigate the app window to it
                        }
                        false // deny any other scheme
                    })
                    .build()
                    .expect("failed to build the main window");

            // Theme-aware icon at startup, and disable pinch/Ctrl-wheel zoom.
            apply_theme_icon(&window);
            disable_webview_zoom(&window);

            // Swap the icon when the OS theme changes (Electron `nativeTheme` parity).
            let themed = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::ThemeChanged(theme) = event {
                    let _ = themed.set_icon(icon_for(Some(*theme)));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Tome desktop app");
}
