# JSZip Library Required

## Issue

Due to firewall restrictions, the actual JSZip library file could not be downloaded during the automated process. A placeholder file has been created instead.

## What You Need To Do

Download the JSZip library and replace the placeholder:

1. Download JSZip v3.10.1 from:
   - https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
   - Or from: https://github.com/Stuk/jszip/releases/tag/v3.10.1

2. Replace `lib/jszip/jszip.min.js` with the downloaded file

3. Verify the file:
   - File size should be approximately 97KB
   - First line should start with `/*!`
   - Should contain JSZip v3.10.1 copyright notice

## Alternative

If you have access to the original PR (commit `b3dd8645fc700dd21107b354b69f91cc4e0b0d30`), you can copy the jszip.min.js file from there.

## Why This Is Needed

The JSZip library is required for the log export functionality. Without it:
- The extension will load normally
- But attempting to download logs will show an error: "JSZip library not loaded"

## Verification

After adding the real JSZip file, test by:
1. Loading the extension
2. Opening the extension popup (click the extension icon)
3. Clicking "Download Logs"
4. A ZIP file should download successfully
