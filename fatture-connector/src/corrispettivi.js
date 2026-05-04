/**
 * Recupera i corrispettivi giornalieri per un delegante.
 *
 * @param {object} http
 * @param {string} cf         - codice fiscale delegante
 * @param {string} dataInizio - formato YYYY-MM-DD
 * @param {string} dataFine   - formato YYYY-MM-DD
 * @param {number} [pagina=1]
 */
async function elencaCorrispettivi(http, cf, dataInizio, dataFine, pagina = 1) {
  const res = await http.get('/corrispettivi/documenti', {
    params: {
      codice_fiscale: cf,
      data_trasmissione_da: dataInizio,
      data_trasmissione_a: dataFine,
      pagina,
      dimensione_pagina: 50,
    },
  });
  return res.data;
}

/**
 * Scarica il dettaglio di un singolo documento corrispettivo.
 *
 * @param {object} http
 * @param {string} idDocumento
 */
async function scaricaCorrispettivo(http, idDocumento) {
  const res = await http.get(`/corrispettivi/documenti/${idDocumento}`, {
    headers: { Accept: 'application/xml' },
    responseType: 'text',
  });
  return res.data;
}

/**
 * Scarica tutti i corrispettivi del periodo iterando le pagine.
 *
 * @param {object} http
 * @param {string} cf
 * @param {string} dataInizio
 * @param {string} dataFine
 * @returns {Array}
 */
async function scaricaTuttiCorrispettivi(http, cf, dataInizio, dataFine) {
  let pagina = 1;
  let documenti = [];

  while (true) {
    const risposta = await elencaCorrispettivi(http, cf, dataInizio, dataFine, pagina);
    const items = risposta.documenti || risposta.risultati || [];
    documenti = documenti.concat(items);

    const totale = risposta.totale_pagine || risposta.numero_pagine || 1;
    if (pagina >= totale) break;
    pagina++;
  }

  return documenti;
}

module.exports = {
  elencaCorrispettivi,
  scaricaCorrispettivo,
  scaricaTuttiCorrispettivi,
};
