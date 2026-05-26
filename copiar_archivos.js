#!/usr/bin/env node

/**
 * Script para copiar una lista de archivos especificada en un archivo de texto
 * Uso: node copiar_archivos.js [--config ruta_config]
 * 
 * Ejemplo: node copiar_archivos.js
 * Ejemplo: node copiar_archivos.js --config mis_archivos.txt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CONFIGURACIÓN (MODIFICAR SEGÚN NECESIDAD)
// ============================================

// Ruta por defecto al archivo de lista de archivos
const DEFAULT_CONFIG_FILE = path.join(__dirname, 'lista_archivos.txt');

// Directorio de destino por defecto (MODIFICAR SEGÚN NECESIDAD)
const DEFAULT_DEST_DIR = 'C:\\Users\\desarrollo\\consumos\\asdf';

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtener la ruta del archivo de configuración desde argumentos
 */
function getConfigFilePath() {
    const args = process.argv.slice(2);
    const configIndex = args.indexOf('--config');
    
    if (configIndex !== -1 && args[configIndex + 1]) {
        return path.resolve(args[configIndex + 1]);
    }
    
    return DEFAULT_CONFIG_FILE;
}

/**
 * Obtener el directorio de destino desde argumentos o usar el default
 */
function getDestinationDir() {
    const args = process.argv.slice(2);
    const destIndex = args.indexOf('--dest');
    
    if (destIndex !== -1 && args[destIndex + 1]) {
        return path.resolve(args[destIndex + 1]);
    }
    
    return DEFAULT_DEST_DIR;
}

/**
 * Leer y parsear el archivo de lista de archivos
 * Formato: cada línea es una ruta de archivo (las líneas que empiezan con # son comentarios)
 */
function readFileList(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: No se encuentra el archivo de configuración: ${filePath}`);
        console.log(`\n📝 Crea el archivo con el formato:`);
        console.log(`   # Comentarios con #`);
        console.log(`   C:\\ruta\\completa\\archivo1.ext`);
        console.log(`   C:\\ruta\\completa\\archivo2.ext`);
        process.exit(1);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const files = [];
    
    for (let line of lines) {
        line = line.trim();
        // Ignorar líneas vacías y comentarios
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        files.push(path.resolve(line));
    }
    
    return files;
}

/**
 * Verificar que los archivos origen existen
 */
function validateSourceFiles(files) {
    const missingFiles = [];
    const existingFiles = [];
    
    for (const file of files) {
        if (!fs.existsSync(file)) {
            missingFiles.push(file);
        } else {
            existingFiles.push(file);
        }
    }
    
    return { existingFiles, missingFiles };
}

/**
 * Crear directorio de destino si no existe
 */
function ensureDestDirectory(destDir) {
    if (!fs.existsSync(destDir)) {
        console.log(`📁 Creando directorio: ${destDir}`);
        fs.mkdirSync(destDir, { recursive: true });
    }
    return destDir;
}

/**
 * Copiar un archivo
 */
function copyFile(source, destination) {
    return new Promise((resolve, reject) => {
        const destPath = path.join(destination, path.basename(source));
        
        // Verificar si el archivo ya existe
        if (fs.existsSync(destPath)) {
            console.log(`⚠️  Ya existe: ${path.basename(source)} - Sobrescribiendo...`);
        }
        
        const readStream = fs.createReadStream(source);
        const writeStream = fs.createWriteStream(destPath);
        
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', () => resolve(destPath));
        
        readStream.pipe(writeStream);
    });
}

/**
 * Copiar archivos con barra de progreso simple
 */
async function copyFiles(files, destDir) {
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    console.log(`\n📋 Copiando ${files.length} archivos a: ${destDir}\n`);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = path.basename(file);
        const progress = `[${i + 1}/${files.length}]`;
        
        try {
            const destPath = await copyFile(file, destDir);
            console.log(`✅ ${progress} ${fileName} -> ${path.basename(destPath)}`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${progress} Error copiando ${fileName}: ${error.message}`);
            failCount++;
            errors.push({ file, error: error.message });
        }
    }
    
    return { successCount, failCount, errors };
}

/**
 * Mostrar resumen final
 */
function showSummary(successCount, failCount, errors, destDir) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE COPIA');
    console.log('='.repeat(60));
    console.log(`✅ Archivos copiados exitosamente: ${successCount}`);
    console.log(`❌ Archivos con error: ${failCount}`);
    console.log(`📁 Destino: ${destDir}`);
    
    if (errors.length > 0) {
        console.log('\n⚠️  Archivos con error:');
        errors.forEach(err => {
            console.log(`   - ${path.basename(err.file)}: ${err.error}`);
        });
    }
    
    console.log('\n✨ Proceso completado.');
}

/**
 * Mostrar ayuda
 */
function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              COPIADOR DE ARCHIVOS - GUÍA DE USO              ║
╚══════════════════════════════════════════════════════════════╝

📝 USO:
   node copiar_archivos.js [opciones]

🔄 OPCIONES:
   --config <ruta>    Ruta al archivo con la lista de archivos
   --dest <ruta>      Directorio de destino
   --help             Muestra esta ayuda

📁 EJEMPLOS:
   node copiar_archivos.js
   node copiar_archivos.js --config mis_archivos.txt
   node copiar_archivos.js --dest D:\\backup
   node copiar_archivos.js --config lista.txt --dest D:\\backup

📄 FORMATO DEL ARCHIVO DE LISTA (lista_archivos.txt):
   # Esto es un comentario
   C:\\Users\\desarrollo\\archivo1.pdf
   D:\\documentos\\archivo2.docx
   E:\\fotos\\imagen.jpg

⚙️  CONFIGURACIÓN POR DEFECTO (editar en el script):
   - Archivo de lista: ${DEFAULT_CONFIG_FILE}
   - Directorio destino: ${DEFAULT_DEST_DIR}
`);
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

async function main() {
    // Verificar ayuda
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    
    console.log('\n🚀 Iniciando copiador de archivos...\n');
    
    // Obtener configuración
    const configFile = getConfigFilePath();
    const destDir = getDestinationDir();
    
    console.log(`📄 Archivo de lista: ${configFile}`);
    console.log(`📁 Directorio destino: ${destDir}`);
    
    // Leer lista de archivos
    const files = readFileList(configFile);
    console.log(`📋 Archivos encontrados en lista: ${files.length}`);
    
    if (files.length === 0) {
        console.log('⚠️  No hay archivos para copiar.');
        process.exit(0);
    }
    
    // Validar archivos origen
    const { existingFiles, missingFiles } = validateSourceFiles(files);
    
    if (missingFiles.length > 0) {
        console.log('\n⚠️  Archivos no encontrados:');
        missingFiles.forEach(file => console.log(`   - ${file}`));
        console.log(`\n❌ Se omitirán ${missingFiles.length} archivo(s) no encontrado(s).`);
    }
    
    if (existingFiles.length === 0) {
        console.log('❌ No hay archivos válidos para copiar.');
        process.exit(1);
    }
    
    // Crear directorio destino
    ensureDestDirectory(destDir);
    
    // Copiar archivos
    const { successCount, failCount, errors } = await copyFiles(existingFiles, destDir);
    
    // Mostrar resumen
    showSummary(successCount, failCount, errors, destDir);
    
    // Código de salida
    process.exit(failCount > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
});