# Builds the release app and Windows installers (NSIS + MSI) via Tauri.
# Installers are written to src-tauri/target/release/bundle.
$ErrorActionPreference = 'Stop'

$nodeDir = Join-Path $PSScriptRoot '.tools\node'
$cargoDir = Join-Path $env:USERPROFILE '.cargo\bin'
$env:Path = $nodeDir + ';' + $cargoDir + ';' + $env:Path

Push-Location $PSScriptRoot
try {
  npm run tauri build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  # Keep the copy used by the desktop shortcut in sync.
  $installed = Join-Path $env:LOCALAPPDATA 'Programs\PromptPad\Prompt Pad.exe'
  if (Test-Path $installed) {
    try {
      Copy-Item -Path (Join-Path $PSScriptRoot 'src-tauri\target\release\prompt-pad.exe') -Destination $installed -Force
      Write-Host ('Updated installed copy: ' + $installed)
    } catch {
      Write-Warning 'Could not update the installed copy - close Prompt Pad and run this script again.'
    }
  }
} finally {
  Pop-Location
}
