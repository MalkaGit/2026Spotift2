# Download follow icon into this folder (same approach as shuffle). Run from repo root or from public/icons:
#   cd clientWorkspace-AI\public\icons; .\download-follow-icon.ps1
# Sources: [UXWing Follow Button](https://uxwing.com/follow-button-icon/), [Flaticon](https://www.flaticon.com/free-icon/follow_3893183), [Veryicon follow-42](https://www.veryicon.com/icons/miscellaneous/3vjia-icon-line/follow-42.html)

$out = $PSScriptRoot
if (-not $out) { $out = "." }

# Flaticon "Follow" icon (person + plus) - free for personal/commercial with attribution
$followPng = "https://cdn-icons-png.flaticon.com/512/3893/3893183.png"

Write-Host "Downloading follow.png..."
try {
  Invoke-WebRequest -Uri $followPng -OutFile (Join-Path $out "follow.png") -UseBasicParsing
  Write-Host "Done. follow.png is in $out"
} catch {
  Write-Host "Flaticon CDN failed. Trying Veryicon..."
  $alt = "https://icons.veryicon.com/png/o/miscellaneous/3vjia-icon-line/follow-42.png"
  Invoke-WebRequest -Uri $alt -OutFile (Join-Path $out "follow.png") -UseBasicParsing
  Write-Host "Done. follow.png is in $out (from Veryicon)"
}
