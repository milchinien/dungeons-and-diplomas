/**
 * Placeholder Icon Generator
 *
 * Erstellt einfache Placeholder-Icons für die Common Items.
 * Diese sollen später durch echte Pixel-Art Assets ersetzt werden.
 *
 * Ausführen: node generate-placeholders.js
 */

const fs = require('fs');
const path = require('path');

// PNG Header für 32x32 Bild erstellen (sehr einfaches Format)
// Da wir kein Canvas haben, erstellen wir Base64-encoded Mini-PNGs

const items = [
  { id: 'equipment_helm_topf', color: [139, 119, 101], label: 'HELM' },
  { id: 'equipment_brustplatte_geflickt', color: [160, 120, 80], label: 'BRUST' },
  { id: 'equipment_schwert_rostig', color: [169, 169, 169], label: 'SCHWERT' },
  { id: 'equipment_schild_brett', color: [205, 170, 125], label: 'SCHILD' },
  { id: 'equipment_hose_ausgebeult', color: [139, 90, 43], label: 'HOSE' },
  { id: 'equipment_schuhe_abgelaufen', color: [101, 67, 33], label: 'SCHUHE' },
];

// Einfache 1x1 PNG erstellen (wird auf 32x32 skaliert im Browser)
function createSimplePNG(r, g, b) {
  // Minimale PNG Struktur für ein 1x1 Pixel
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // 8-bit RGB
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, // zlib header + deflate
    (r * 2) & 0xFF, (g * 2) & 0xFF, (b * 2) & 0xFF, // pixel data (approximation)
    0x00, 0x00, 0x00, 0x00, // padding
    0x00, 0x01, // checksum part
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return png;
}

// Ausgabe-Ordner
const outputDir = path.join(__dirname, '..', 'next-app', 'public', 'Assets', 'Items', 'Icons');
const spriteDir = path.join(__dirname, '..', 'next-app', 'public', 'Assets', 'Items', 'Sprites');

// Ordner erstellen falls nicht vorhanden
[outputDir, spriteDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Erstellt: ${dir}`);
  }
});

console.log('\\n=== Placeholder Icons Generator ===\\n');
console.log('HINWEIS: Diese Placeholder-Icons sollen durch echte Pixel-Art ersetzt werden!');
console.log('Download echte Assets von:');
console.log('- https://clockworkraven.itch.io/free-rpg-icon-pack-100-accessories-and-armor-clockwork-raven-studios');
console.log('- https://willibab.itch.io/willibabs-simple-weapon-icons');
console.log('');

items.forEach(item => {
  const iconPath = path.join(outputDir, `${item.id}.png`);
  const spritePath = path.join(spriteDir, `${item.id}.png`);

  // Für jetzt: Erstelle eine einfache Textdatei als Marker
  // (Echte PNGs müssen manuell hinzugefügt werden)

  const placeholder = `PLACEHOLDER - ${item.label}
Color: RGB(${item.color.join(', ')})
Size: 32x32 (Icon) / 16x16 (Sprite)

Ersetze diese Datei durch ein echtes PNG!
`;

  fs.writeFileSync(iconPath + '.txt', placeholder);
  fs.writeFileSync(spritePath + '.txt', placeholder);

  console.log(`[${item.label}] Placeholder erstellt: ${item.id}`);
});

console.log('\\n=== Fertig ===');
console.log(`Icons: ${outputDir}`);
console.log(`Sprites: ${spriteDir}`);
console.log('\\nERSETZE die .txt Dateien durch echte .png Dateien!');
