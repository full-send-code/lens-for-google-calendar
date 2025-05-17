# Built for Windows

param(
    [switch]$Force,
    [string]$Version
)

function Show-Usage {
    Write-Host "Usage: $(Split-Path -Leaf $MyInvocation.MyCommand.Path) [-Force] [-Version <version>]"
    Write-Host "  -Force: Force overwriting an existing release package"
    Write-Host "  -Version: Defaults to version in manifest.json"
    exit 1
}

# Parse manifest.json to get the version if not provided
if (-not $Version) {
    if (Test-Path "manifest.json") {
        $Manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
        $Version = $Manifest.version
    } else {
        Write-Host "Error: manifest.json not found."
        exit 1
    }
}

$Dist = "dist"
$ReleaseFile = Join-Path $Dist "google-calendar-selector.$Version.zip"

# Create the dist directory if it doesn't exist
if (-not (Test-Path $Dist)) {
    New-Item -ItemType Directory -Path $Dist | Out-Null
}

# Check if the release file already exists
if (Test-Path $ReleaseFile) {
    if (-not $Force) {
        Write-Host "Error: release package already exists: $ReleaseFile"
        exit 1
    } else {
        # Remove the file so zip doesn't keep adding to it
        Remove-Item $ReleaseFile
    }
}

# Create the zip file
Compress-Archive -Path @(
    "index.html",
    "manifest.json",
    "icons",
    "lib",
    "src"
) -DestinationPath $ReleaseFile -Force

Write-Host "Created release: $ReleaseFile"
