# Prompt Pad

A small, fast desktop prompt manager for Windows. Keep your prompts in folders, search
them instantly, copy any prompt to the clipboard in one click, and back everything up
to a plain JSON file.

Built with **Tauri 2**, **React 18**, **TypeScript**, and **Tailwind CSS v4**.
All data stays on your device.

## Screenshots

> Screenshot placeholder — add a file at `docs/screenshot.png` and replace this line with
> `![Prompt Pad](docs/screenshot.png)`.

## System requirements

- Windows 10 or 11 (64-bit)
- Microsoft Edge **WebView2** runtime — preinstalled on Windows 11 and on most updated
  Windows 10 machines. If it is missing, the installer downloads and installs it
  automatically.

## Install

1. Open the [latest release](https://github.com/WAPerera/Prompt-pad/releases/latest).
2. Download either installer (file names include the version, e.g.
   `Prompt.Pad_1.2.0_x64-setup.exe`):
   - the NSIS `.exe` setup file (recommended)
   - or the `.msi` package
3. Run the installer. Administrator rights are not required.

### This build is unsigned

The app is not code-signed, so Windows SmartScreen may show **"Windows protected your PC"**
the first time you run the installer.

Click **More info → Run anyway** to continue.

To stay safe, only download installers from this repository's **Releases** page.

## Privacy

- Prompts and folders are stored locally in the app's WebView2 `localStorage`
  (key `prompt-pad:data:v1`).
- No accounts, no telemetry, no analytics, no tracking.
- The only network requests the app makes on its own are the startup update check and a
  check when you press **Check for updates** in Settings; both query GitHub Releases. The
  **Buy me a coffee** button only opens your browser when clicked.
- Export and import write only to the file you explicitly pick in the file dialog.
- The automatic pre-import backup is written to local storage on your device, never uploaded.

## Features

- Search across quick prompts and folders as you type.
- Create prompts either as quick prompts or inside a folder; create folders inline.
- Move a quick prompt into a folder from its row menu, or star a prompt inside a folder
  to keep it visible under Quick prompts too.
- Edit titles and bodies with changes saved as you type.
- Rename or delete prompts and folders from the row menu (`⋯` or right-click).
  Deleting a folder moves its prompts to Quick prompts so nothing is lost.
- Drag folders by their header to reorder them.
- One-click copy, and delete with the trash icon.
- Export / import backups from **Settings**, with validation and an automatic local
  snapshot before an import replaces your data.
- In-app updates from GitHub Releases, with a small notification bubble when a new
  version is found at startup.
- Frameless, 20px rounded window with a custom title bar holding Settings and the
  minimize / close controls.

## Build from source

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [Rust](https://www.rust-lang.org/tools/install) stable toolchain, `x86_64-pc-windows-msvc`
- Visual Studio Build Tools with the **Desktop development with C++** workload and a
  Windows SDK
- WebView2 runtime (for running the app)

### Commands

```powershell
npm install
npm run tauri dev      # dev window with hot reload
npm run tauri build    # release executable + installers
```

Installers are written to `src-tauri/target/release/bundle/` (`nsis/` and `msi/`).

#### Signing key for local builds

`bundle.createUpdaterArtifacts` is enabled so releases can ship signed update packages.
A full `npm run tauri build` therefore needs an updater signing key. For a local build,
generate a throwaway key pair:

```powershell
npx tauri signer generate -w .\local.key
$env:TAURI_SIGNING_PRIVATE_KEY = ".\local.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<the password you chose>"
npm run tauri build
```

Never commit `local.key` — `.gitignore` ignores `*.key`. Official releases are signed in
CI from repository secrets; see `.github/workflows/release.yml`.

If you only need the executable and not the installers:

```powershell
npm run tauri build -- --no-bundle
```

The frontend can also run in a plain browser with `npm run dev`; Tauri-only features
(file dialogs, updates, window controls) will not work there.

### Testing

Folder reordering has an isolated jsdom sandbox built on Vitest and React Testing
Library, so it runs without Tauri or WebView2:

```powershell
npm test          # single run
npm run test:watch
```

Tests live in `tests/` and cover the `moveFolder` reorder logic plus the drag events
wired up by the sidebar.

> Note: `tauri.conf.json` sets `dragDropEnabled: false` because Tauri's OS file-drop
> handling otherwise blocks HTML5 drag-and-drop inside the WebView2 window.

## Releasing

```powershell
git tag v1.2.0
git push origin v1.2.0
```

The release workflow builds on `windows-latest` and creates a **draft** GitHub Release
containing the NSIS installer, the MSI, the updater signatures, and `latest.json`.
Publish the draft to make it available to the in-app updater.

## License

[MIT](LICENSE)
