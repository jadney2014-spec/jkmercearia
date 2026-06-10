/**
 * Script para gerar ícones PWA automaticamente
 * 
 * Requer: imagem base em client/public/img/ICONE-RESGATE.png
 * 
 * Instalar dependência:
 * npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

// Tamanhos de ícones necessários
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
];

const SOURCE_IMAGE = path.join(__dirname, '../public/img/ICONE-RESGATE.png');
const OUTPUT_DIR = path.join(__dirname, '../public/img/icons');

// Verificar se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Erro: sharp não está instalado!');
  console.log('📦 Instale com: npm install --save-dev sharp');
  console.log('\n💡 Alternativa: Use uma ferramenta online como:');
  console.log('   - https://realfavicongenerator.net/');
  console.log('   - https://www.pwabuilder.com/imageGenerator');
  process.exit(1);
}

// Criar diretório de saída se não existir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Verificar se imagem fonte existe
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.error(`❌ Imagem fonte não encontrada: ${SOURCE_IMAGE}`);
  console.log('💡 Certifique-se de que o arquivo existe em: client/public/img/ICONE-RESGATE.png');
  process.exit(1);
}

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...\n');
  console.log(`📁 Origem: ${SOURCE_IMAGE}`);
  console.log(`📁 Destino: ${OUTPUT_DIR}\n`);

  const generatedIcons = [];

  for (const icon of ICON_SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, icon.name);
      
      await sharp(SOURCE_IMAGE)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      generatedIcons.push(icon.name);
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${icon.name}:`, error.message);
    }
  }

  // Gerar favicon.ico (32x32)
  try {
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(SOURCE_IMAGE)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    // Nota: Conversão para .ico requer biblioteca adicional
    // Por enquanto, manter como PNG
    console.log(`✅ favicon.png (32x32)`);
  } catch (error) {
    console.warn(`⚠️  Erro ao gerar favicon:`, error.message);
  }

  console.log(`\n✨ ${generatedIcons.length} ícones gerados com sucesso!`);
  console.log('\n📝 Próximos passos:');
  console.log('   1. Atualizar manifest.json com os novos ícones');
  console.log('   2. Adicionar meta tags iOS no index.html');
  console.log('   3. Testar instalação em dispositivo móvel');
}

generateIcons().catch(error => {
  console.error('❌ Erro ao gerar ícones:', error);
  process.exit(1);
});
