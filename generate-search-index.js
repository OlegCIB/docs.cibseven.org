const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Function to read files recursively, excluding certain folders
function readFilesRecursively(dir, excludedFolders = [], fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);

    // Skip excluded folders
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludedFolders.includes(file)) {
        readFilesRecursively(filePath, excludedFolders, fileList); // Recursive call
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Main script
const inputDir = './docs'; // Change to your directory containing HTML files
const outputFile = './docs/search.json'; // Output file path
const excludedFolders = ['javadoc', 'rest']; // Folders to exclude

try {
  const filePaths = readFilesRecursively(inputDir, excludedFolders);
  const pages = filePaths.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(content);

    // Try to extract content from <div class="content-text">
    let contentText = $('.content-text').text().replace(/\s+/g, ' ').trim();

    // Fallback to using the entire <body> content if .content-text is not present or empty
    if (!contentText) {
      contentText = $('body').text().replace(/\s+/g, ' ').trim();
    }

    return {
      id: path.relative(inputDir, filePath).replace(/\\/g, '/'), // Relative path as ID
      title: $('title').text() || 'Untitled',
      content: contentText || 'No content available', // Use extracted content or fallback
      url: '/' + path.relative(inputDir, filePath).replace(/\\/g, '/')
    };
  });

  fs.writeFileSync(outputFile, JSON.stringify(pages, null, 2));
  console.log(`Search index generated successfully at: ${outputFile}`);
} catch (error) {
  console.error('Error generating search index:', error);
}
