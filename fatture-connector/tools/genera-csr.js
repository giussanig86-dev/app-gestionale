#!/usr/bin/env node
/**
 * Genera chiave privata RSA 2048 + CSR da caricare su accreditamento.fatturapa.gov.it
 *
 * Uso:
 *   node tools/genera-csr.js --cf IT02969380183 --nome "GIUSSANI GIORGIO" --comune "Milano"
 *
 * Output nella cartella ./certs/:
 *   chiave-privata.pem   ← DA CONSERVARE, non caricare mai sul portale
 *   csr-client.pem       ← da caricare nel campo "Upload CSR per certificato client"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Leggi parametri da CLI ────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
}

const CF   = arg('cf')     || process.env.FATTURE_CF;
const NOME = arg('nome')   || process.env.FATTURE_NOME;
const CITY = arg('comune') || 'Italia';

if (!CF || !NOME) {
  console.error(`
Uso: node tools/genera-csr.js --cf <PIVA_O_CF> --nome "<NOME_COGNOME>" [--comune "<citta>"]

Esempio:
  node tools/genera-csr.js --cf IT02969380183 --nome "GIUSSANI GIORGIO" --comune "Milano"
`);
  process.exit(1);
}

// ── Setup cartella output ─────────────────────────────────────────────────────
const certsDir = path.resolve(__dirname, '../certs');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

const keyPath = path.join(certsDir, 'chiave-privata.pem');
const csrPath = path.join(certsDir, 'csr-client.pem');

// ── Subject del certificato ───────────────────────────────────────────────────
// ADE richiede: CN=PIVA, O=NomeSoggetto, C=IT, ST=provincia, L=comune
const subject = `/C=IT/ST=Italia/L=${CITY}/O=${NOME}/CN=${CF}`;

console.log('\n=== Generazione certificato per SDI Web Service ===\n');
console.log(`Soggetto : ${NOME}`);
console.log(`CF/PIVA  : ${CF}`);
console.log(`Comune   : ${CITY}`);
console.log(`Output   : ${certsDir}\n`);

// ── 1. Genera chiave privata RSA 2048 ────────────────────────────────────────
console.log('1/2  Generazione chiave privata RSA 2048 bit...');
execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'pipe' });
fs.chmodSync(keyPath, 0o600);
console.log(`     → ${keyPath}`);

// ── 2. Genera CSR ────────────────────────────────────────────────────────────
console.log('2/2  Generazione CSR...');
execSync(
  `openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`,
  { stdio: 'pipe' }
);
console.log(`     → ${csrPath}`);

// ── Riepilogo ─────────────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FATTO. Cosa fare ora:

  1. Vai su accreditamento.fatturapa.gov.it
  2. Sezione "Certificati (solo canale WS)"
  3. Carica il file:  certs/csr-client.pem
     nel campo "Upload CSR per certificato client"
  4. Clicca il pulsante di upload (freccia su)
  5. ADE genererà e ti mostrerà il certificato
  6. Scaricalo come .p12 e mettilo in certs/

  ATTENZIONE: certs/chiave-privata.pem è SEGRETA.
  Non caricarla mai, non condividerla.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
