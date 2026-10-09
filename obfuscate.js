const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('Починаємо офлайн обфускацію RoboCodo...');

if (!fs.existsSync('index.html')) {
    console.error('Помилка: файл index.html не знайдено!');
    process.exit(1);
}

const html = fs.readFileSync('index.html', 'utf8');

// Знаходимо всі inline <script> теги (включаючи type="module" або без типу, ігноруючи зовнішні CDN src="...")
const scriptRegex = /<script(?:\s+type="module")?\s*>([\s\S]*?)<\/script>/gi;
let obfuscatedHtml = html;

let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    const originalScript = match[1];
    if (!originalScript || originalScript.trim().length < 50) continue; // Пропускаємо порожні або занадто короткі блоки
    
    count++;
    console.log(`Обфускуємо скрипт #${count} (розмір ${originalScript.length} символів)...`);
    
    try {
        const obfuscationResult = JavaScriptObfuscator.obfuscate(originalScript, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.6,
            deadCodeInjection: false,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 0.7,
            disableConsoleOutput: false
        });
        
        const obfuscatedScript = obfuscationResult.getObfuscatedCode();
        // Безпечна заміна для уникнення проблем зі спеціальними символами $ у replace
        const safeReplacement = '\n' + obfuscatedScript.replace(/\$/g, '$$$$') + '\n';
        obfuscatedHtml = obfuscatedHtml.replace(originalScript, safeReplacement);
    } catch (err) {
        console.warn(`Увага: скрипт #${count} не вдалося обфускувати, залишаємо оригінал:`, err.message);
    }
}

fs.writeFileSync('release.html', obfuscatedHtml, 'utf8');
console.log(`Успішно оброблено ${count} блоків коду. Збережено release.html`);
