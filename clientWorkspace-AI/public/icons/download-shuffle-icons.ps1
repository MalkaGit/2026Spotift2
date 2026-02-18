# Download shuffle icons into this folder. Run from repo root or from public/icons:
#   cd clientWorkspace-AI\public\icons; .\download-shuffle-icons.ps1

$out = $PSScriptRoot
if (-not $out) { $out = "." }

$off = "https://icons.veryicon.com/png/o/miscellaneous/standard-general-linear-icon/shuffle-9.png"
$on  = "https://cdn-icons-png.flaticon.com/512/8345/8345820.png"

Write-Host "Downloading shuffle-off.png..."
Invoke-WebRequest -Uri $off -OutFile (Join-Path $out "shuffle-off.png") -UseBasicParsing

Write-Host "Downloading shuffle-on.png..."
Invoke-WebRequest -Uri $on -OutFile (Join-Path $out "shuffle-on.png") -UseBasicParsing

Write-Host "Done. shuffle-off.png and shuffle-on.png are in $out"
