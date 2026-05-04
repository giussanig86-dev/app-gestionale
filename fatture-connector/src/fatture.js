const { parseStringPromise } = require('xml2js');
const fs = require('fs');
const path = require('path');

/**
 * Scarica l'elenco delle fatture ricevute (passive) per un delegante.
 *
 * @param {object} http     - istanza axios configurata
 * @param {string} cf       - codice fiscale del delegante
 * @param {string} dataInizio - formato YYYY-MM-DD
 * @param {string} dataFine   - formato YYYY-MM-DD
 * @param {number} [pagina=1]
 */
async function elencaFattureRicevute(http, cf, dataInizio, dataFine, pagina = 1) {
  const res = await http.get('/ricezione/documenti', {
    params: {
      codice_fiscale: cf,
      data_emissione_da: dataInizio,
      data_emissione_a: dataFine,
      pagina,
      dimensione_pagina: 50,
    },
  });
  return res.data;
}

/**
 * Scarica il file XML di una singola fattura dato il suo identificativo.
 *
 * @param {object} http
 * @param {string} idDocumento - identificativo SDI della fattura
 * @returns {string} XML grezzo della fattura
 */
async function scaricaFattura(http, idDocumento) {
  const res = await http.get(`/ricezione/documenti/${idDocumento}`, {
    headers: { Accept: 'application/xml' },
    responseType: 'text',
  });
  return res.data;
}

/**
 * Scarica la fattura e la converte in oggetto JS.
 *
 * @param {object} http
 * @param {string} idDocumento
 * @returns {object} fattura come oggetto JS
 */
async function scaricaFatturaJSON(http, idDocumento) {
  const xml = await scaricaFattura(http, idDocumento);
  return parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
}

/**
 * Salva il file XML della fattura su disco.
 *
 * @param {object} http
 * @param {string} idDocumento
 * @param {string} outputDir - cartella di destinazione
 * @returns {string} percorso del file salvato
 */
async function salvaFatturaXML(http, idDocumento, outputDir) {
  const xml = await scaricaFattura(http, idDocumento);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${idDocumento}.xml`);
  fs.writeFileSync(filePath, xml, 'utf8');
  return filePath;
}

/**
 * Scarica tutte le fatture di un periodo iterando le pagine.
 *
 * @param {object} http
 * @param {string} cf
 * @param {string} dataInizio
 * @param {string} dataFine
 * @returns {Array} array di tutti i documenti
 */
async function scaricaTutteLeFatture(http, cf, dataInizio, dataFine) {
  let pagina = 1;
  let documenti = [];

  while (true) {
    const risposta = await elencaFattureRicevute(http, cf, dataInizio, dataFine, pagina);
    const items = risposta.documenti || risposta.risultati || [];
    documenti = documenti.concat(items);

    const totale = risposta.totale_pagine || risposta.numero_pagine || 1;
    if (pagina >= totale) break;
    pagina++;
  }

  return documenti;
}

module.exports = {
  elencaFattureRicevute,
  scaricaFattura,
  scaricaFatturaJSON,
  salvaFatturaXML,
  scaricaTutteLeFatture,
};
