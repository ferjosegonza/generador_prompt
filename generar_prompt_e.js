#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputFile = 'preloaded_prompt.txt';
const baseDir = process.cwd();

// extensions we want to include (you can adjust)
const VALID_EXTENSIONS = [
  '.js', '.ts', '.php', '.html', '.css', '.json',
  '.md', '.txt', '.blade.php', '.gs'
];

// folders to ignore
const IGNORE = ['node_modules', '.git', 'vendor', 'dist', 'build', 'logs', 'tmp'];

// map extension → markdown language
function getLanguage(file) {
  if (file.endsWith('.blade.php')) return 'php';
  const ext = path.extname(file);

  const map = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.txt': 'text'
  };

  return map[ext] || '';
}

function isValid(file) {
  return VALID_EXTENSIONS.some(ext => file.endsWith(ext));
}

function traverseDir(dir) {
  let results = [];

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(baseDir, fullPath);

    const pathParts = relativePath.split(path.sep);

    if (pathParts.some(part => IGNORE.includes(part))) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(traverseDir(fullPath));
    } else if (isValid(file)) {
      results.push(relativePath || file);
    }
  });

  return results;
}

//////////////////////////////////////////////////////////
// 🔥 CODE CLEANING
//////////////////////////////////////////////////////////

function cleanComments(code, language, filePath = '') {
  try {
    // 🔥 detect blade even if mapped as php
    const isBlade = filePath.endsWith('.blade.php');

    if (isBlade) {
      return code
        .replace(/{{--[\s\S]*?--}}/g, '')       // Blade comments
        .replace(/\/\/.*$/gm, '')              // // comments
        .replace(/\/\*[\s\S]*?\*\//g, '');     // /* */ comments
    }

    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'php':
      case 'css':
        return code
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');

      case 'html':
        return code.replace(/<!--[\s\S]*?-->/g, '');

      case 'python':
        return code.replace(/#.*$/gm, '');

      default:
        return code;
    }
  } catch {
    return code;
  }
}

function cleanSpaces(code) {
  return code
    .replace(/[ \t]+$/gm, '')   // remove trailing spaces
    .replace(/\n{3,}/g, '\n\n') // avoid excessive line breaks
    .trim();
}

//////////////////////////////////////////////////////////
// 🚀 EXECUTION
//////////////////////////////////////////////////////////

const files = traverseDir(baseDir);

// 2. build content
let content = '';

content += `# 📦 Project Context\n\n`;

content += `## 📁 Included Files\n\n`;
files.forEach(f => {
  content += `- ${f}\n`;
});

content += `\n---\n`;
content += `## 🎯 Objective\n`;
content += `I want you to:\n`
content += `1. Consider all necessary changes across all project files. Don't just give me examples—provide the complete code I need to modify. You don't need to return all complete files, but give me the full code of what is new. Specify exactly which file to copy it to, which part to replace, and what code to delete. Leave no loose ends. Your explanation must be detailed and allow for complete implementation of everything I'm asking for.\n`;
content += `2. \n`;

content += `---\n`;
content += `## 🧠 Source Code of Mentioned Files\n\n`;

// code for each file
files.forEach(f => {
  const filePath = path.join(baseDir, f);
  const language = getLanguage(f);

  content += `### 📄 ${f}\n\n`;

  try {
    let code = fs.readFileSync(filePath, 'utf8');

    code = cleanComments(code, language, f);
    code = cleanSpaces(code);

    content += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  } catch (err) {
    content += `[ERROR READING FILE]\n\n`;
  }
});

// write file
fs.writeFileSync(outputFile, content, 'utf8');

console.log(`✅ Prompt generated: ${outputFile}`);