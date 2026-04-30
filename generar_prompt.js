const fs = require('fs');
const path = require('path');

const outputFile = 'prompt_precargado.txt';
const baseDir = process.cwd();

// extensiones que queremos incluir (podés ajustar)
const EXTENSIONES_VALIDAS = [
  '.js', '.ts', '.php', '.html', '.css', '.json',
  '.md', '.txt', '.blade.php'
];

// ignorar carpetas pesadas/innecesarias
const IGNORAR = ['node_modules', '.git', 'vendor', 'dist', 'build'];

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

// 1. obtener archivos
const archivos = recorrerDir(baseDir);

// 2. armar contenido
let contenido = '';

contenido += 'Tengo un proyecto con los siguientes archivos:\n\n';

// listado simple
archivos.forEach(a => {
  contenido += a + '\n';
});

contenido += '\nQuiero que haga esto:\n\n';

contenido += 'A continuación te paso el código de cada uno de los archivos involucrados del proyecto:\n\n';

// código de cada archivo
archivos.forEach(a => {
  const ruta = path.join(baseDir, a);

  contenido += `\n===== ARCHIVO: ${a} =====\n\n`;

  try {
    const code = fs.readFileSync(ruta, 'utf8');
    contenido += code + '\n';
  } catch (err) {
    contenido += '[ERROR AL LEER ARCHIVO]\n';
  }
});

// 3. escribir archivo
fs.writeFileSync(outputFile, contenido, 'utf8');

console.log(`✅ Archivo generado: ${outputFile}`);