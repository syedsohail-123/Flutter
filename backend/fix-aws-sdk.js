import fs from 'fs';
import path from 'path';

// Path to the aws-sdk module
const awsSdkPath = path.join('node_modules', 'aws-sdk');
const awsSdkLibPath = path.join(awsSdkPath, 'lib');

// Function to replace util._extend with Object.assign in a file
function replaceUtilExtend(filePath) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Replace util._extend with Object.assign
      content = content.replace(/util\._extend/g, 'Object.assign');
      
      // Only write if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed util._extend in ${filePath}`);
        return true;
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

// Fix the main AWS util file
const utilPath = path.join(awsSdkLibPath, 'util.js');
let fixed = replaceUtilExtend(utilPath);

// Also check other common files that might use util._extend
const commonFiles = [
  'aws.js',
  'config.js',
  'core.js'
];

commonFiles.forEach(file => {
  const filePath = path.join(awsSdkLibPath, file);
  if (replaceUtilExtend(filePath)) {
    fixed = true;
  }
});

// Look for the dist files that were shown in our search
const distFiles = [
  path.join(awsSdkPath, 'dist', 'aws-sdk-core-react-native.js'),
  path.join(awsSdkPath, 'dist', 'aws-sdk-react-native.js'),
  path.join(awsSdkPath, 'dist', 'aws-sdk.js')
];

distFiles.forEach(file => {
  if (replaceUtilExtend(file)) {
    fixed = true;
  }
});

if (fixed) {
  console.log('✅ AWS SDK deprecated util._extend API has been fixed');
} else {
  console.log('ℹ️  No util._extend usage found or already fixed');
}