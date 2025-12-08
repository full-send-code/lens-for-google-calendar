#!/usr/bin/env pwsh

# PowerShell version of release.sh
# Built for cross-platform PowerShell

param(
    [string]$Version,
    [switch]$Force,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\release.ps1 [-Version <version>] [-Force] [-Help]"
    Write-Host "  -Force    Force overwriting an existing release package"
    Write-Host "  -Version  Version number (defaults to version in manifest.json)"
    Write-Host "  -Help     Show this help message"
    exit 0
}

# Get version from manifest.json if not provided
if (-not $Version) {
    try {
        $manifest = Get-Content "manifest.json" | ConvertFrom-Json
        $ManifestVersion = $manifest.version
        $Version = $ManifestVersion
    } catch {
        Write-Error "Could not read version from manifest.json: $_"
        exit 1
    }
}

$DIST = "dist"
$RELEASE_FILE = Join-Path $DIST "lens-for-google-calendar-v$Version.zip"

# Create dist directory if it doesn't exist
if (-not (Test-Path $DIST)) {
    New-Item -ItemType Directory -Path $DIST | Out-Null
}

# Check if release file already exists
if (Test-Path $RELEASE_FILE) {
    if (-not $Force) {
        Write-Error "Release package already exists: $RELEASE_FILE"
        Write-Host "Use -Force to overwrite"
        exit 1
    } else {
        # Remove the existing file so we don't keep adding to it
        Remove-Item $RELEASE_FILE -Force
    }
}

# Build the project first
Write-Host "Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# Create the zip file from the dist folder
try {
    # PowerShell 5.0+ has Compress-Archive built-in
    # For Chrome Web Store, we need the compiled dist folder, not source files
    if (-not (Test-Path $DIST)) {
        Write-Error "Build output not found: $DIST"
        exit 1
    }
    
    # Compress the dist folder contents
    Compress-Archive -Path "$DIST\*" -DestinationPath $RELEASE_FILE -Force
    Write-Host "Created release: $RELEASE_FILE"
    Write-Host "Release ready for Chrome Web Store submission"
} catch {
    Write-Error "Failed to create zip file: $_"
    exit 1
}
