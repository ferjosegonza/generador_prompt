#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputFile = 'prompt_precargado.txt';
const baseDir = process.cwd();

// extensiones que queremos incluir (podés ajustar)
const EXTENSIONES_VALIDAS = [
  '.js', '.ts', '.php', '.html', '.css', '.json',
  '.md', '.txt', '.blade.php'
];

// carpetas a ignorar
const IGNORAR = ['node_modules', '.git', 'vendor', 'dist', 'build', 'logs', 'tmp'];

// mapear extensión → lenguaje markdown
function obtenerLenguaje(file) {
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

function esValido(file) {
  return EXTENSIONES_VALIDAS.some(ext => file.endsWith(ext));
}

function recorrerDir(dir) {
  let resultados = [];

  const archivos = fs.readdirSync(dir);

  archivos.forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(baseDir, fullPath);

    if (IGNORAR.some(ign => relativePath.includes(ign))) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      resultados = resultados.concat(recorrerDir(fullPath));
    } else if (esValido(file)) {
      resultados.push(relativePath || file);
    }
  });

  return resultados;
}

//////////////////////////////////////////////////////////
// 🔥 LIMPIEZA DE CÓDIGO
//////////////////////////////////////////////////////////

function limpiarComentarios(codigo, lenguaje, filePath = '') {
  try {
    // 🔥 detectar blade aunque lo mapees como php
    const esBlade = filePath.endsWith('.blade.php');

    if (esBlade) {
      return codigo
        .replace(/{{--[\s\S]*?--}}/g, '')       // Blade comments
        .replace(/\/\/.*$/gm, '')              // comentarios //
        .replace(/\/\*[\s\S]*?\*\//g, '');     // comentarios /* */
    }

    switch (lenguaje) {
      case 'javascript':
      case 'typescript':
      case 'php':
      case 'css':
        return codigo
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');

      case 'html':
        return codigo.replace(/<!--[\s\S]*?-->/g, '');

      case 'python':
        return codigo.replace(/#.*$/gm, '');

      default:
        return codigo;
    }
  } catch {
    return codigo;
  }
}

function limpiarEspacios(codigo) {
  return codigo
    .replace(/[ \t]+$/gm, '')   // quitar espacios al final de línea
    .replace(/\n{3,}/g, '\n\n') // evitar saltos excesivos
    .trim();
}

//////////////////////////////////////////////////////////
// 🚀 EJECUCIÓN
//////////////////////////////////////////////////////////

const archivos = recorrerDir(baseDir);

// 2. armar contenido
let contenido = '';

contenido += `# 📦 Contexto del proyecto\n\n`;

contenido += `## 📁 Archivos incluidos\n\n`;
archivos.forEach(a => {
  contenido += `- ${a}\n`;
});

contenido += `\n---\n`;
contenido += `## 🎯 Objetivo\n`;
contenido += `...\n\n`;

contenido += `---\n`;
contenido += `## 🧠 Código fuente de los archivos mencionados\n\n`;

// código de cada archivo
archivos.forEach(a => {
  const ruta = path.join(baseDir, a);
  const lenguaje = obtenerLenguaje(a);

  contenido += `### 📄 ${a}\n\n`;

  try {
    let code = fs.readFileSync(ruta, 'utf8');

    code = limpiarComentarios(code, lenguaje, a);
    code = limpiarEspacios(code);

    contenido += `\`\`\`${lenguaje}\n${code}\n\`\`\`\n\n`;
  } catch (err) {
    contenido += `[ERROR AL LEER ARCHIVO]\n\n`;
  }
});

// escribir archivo
fs.writeFileSync(outputFile, contenido, 'utf8');

console.log(`✅ Prompt generado: ${outputFile}`);