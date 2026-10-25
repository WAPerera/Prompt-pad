# Runs Prompt Pad in development (Vite dev server + Tauri window).
# Uses the Node.js copy vendored in .tools/node and the user-level Rust toolchain.
$ErrorActionPreference = 'Stop'

$nodeDir = Join-Path $PSScriptRoot '.tools\node'
$cargoDir = Join-Path $env:USERPROFILE '.cargo\bin'
$env:Path = $nodeDir + ';' + $cargoDir + ';' + $env:Path

Push-Location $PSScriptRoot
try {
  npm run tauri dev
} finally {
  Pop-Location
}
