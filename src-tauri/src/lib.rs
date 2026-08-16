// Tome desktop shell — Tauri v2 feasibility spike (INT-0015).
//
// Loads the built static site (`../dist`, embedded via `frontendDist`) in a native
// WebView2 window, offline. Internal navigation stays in-app; external http(s)
// links open in the OS browser. Isolated from the Electron shell (electron/).
use tauri::{WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

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
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Tome (Tauri spike)")
                .inner_size(1100.0, 820.0)
                .min_inner_size(480.0, 360.0)
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Tome Tauri spike");
}
