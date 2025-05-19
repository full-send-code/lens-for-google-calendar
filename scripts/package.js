const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../build');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, 'lens-for-google-calendar.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`Extension packaged successfully: ${archive.pointer()} total bytes`);
  console.log('The extension package is ready in the build directory.');
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from the dist directory to the archive
archive.directory(path.join(__dirname, '../dist/'), false);

// Finalize the archive (write entries to the archive)
archive.finalize();
