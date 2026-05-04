/**
 * Esempio completo: scarica tutte le fatture di un delegante
 * e salva i file XML in una cartella locale.
 *
 * Uso:
 *   node examples/download-fatture.js
 */

const FattureConnector = require('../src/index');
const path = require('path');

async function main() {
  const connector = new FattureConnector({
    certPath: path.resolve(__dirname, '../certs/certificato.p12'),
    certPassword: 'la-tua-password',
  });

  const CF_DELEGANTE = '12345678901';    // CF del tuo cliente delegante
  const DATA_INIZIO = '2024-01-01';
  const DATA_FINE = '2024-12-31';
  const OUTPUT_DIR = path.resolve(__dirname, '../output/fatture');

  console.log(`Recupero fatture per ${CF_DELEGANTE}...`);

  // 1. Elenco metadati di tutte le fatture del periodo
  const elenco = await connector.scaricaTutteLeFatture(CF_DELEGANTE, DATA_INIZIO, DATA_FINE);
  console.log(`Trovate ${elenco.length} fatture`);

  // 2. Per ogni fattura scarica e salva l'XML
  for (const doc of elenco) {
    const id = doc.identificativo || doc.id_sdi || doc.id;
    const filePath = await connector.salvaFatturaXML(id, OUTPUT_DIR);
    console.log(`  Salvata: ${filePath}`);
  }

  // 3. Recupera anche le notifiche di scarto (se ci sono)
  const scarti = await connector.notifichePerTipo(CF_DELEGANTE, DATA_INIZIO, DATA_FINE, 'NS');
  if (scarti.length > 0) {
    console.log(`\nATTENZIONE: ${scarti.length} fatture scartate dal SDI`);
    scarti.forEach((n) => console.log(`  ID: ${n.id || n.identificativo}`));
  }

  // 4. Recupera i corrispettivi
  const corrispettivi = await connector.scaricaTuttiCorrispettivi(
    CF_DELEGANTE,
    DATA_INIZIO,
    DATA_FINE
  );
  console.log(`\nCorrispettivi trovati: ${corrispettivi.length}`);
}

main().catch(console.error);
