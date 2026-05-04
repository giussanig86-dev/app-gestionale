/**
 * Recupera le notifiche SDI (consegna, scarto, accettazione, rifiuto, ecc.)
 *
 * @param {object} http
 * @param {string} cf         - codice fiscale delegante
 * @param {string} dataInizio - formato YYYY-MM-DD
 * @param {string} dataFine   - formato YYYY-MM-DD
 * @param {number} [pagina=1]
 */
async function elencaNotifiche(http, cf, dataInizio, dataFine, pagina = 1) {
  const res = await http.get('/ricezione/notifiche', {
    params: {
      codice_fiscale: cf,
      data_notifica_da: dataInizio,
      data_notifica_a: dataFine,
      pagina,
      dimensione_pagina: 50,
    },
  });
  return res.data;
}

/**
 * Scarica il dettaglio di una singola notifica.
 *
 * @param {object} http
 * @param {string} idNotifica
 */
async function scaricaNotifica(http, idNotifica) {
  const res = await http.get(`/ricezione/notifiche/${idNotifica}`, {
    headers: { Accept: 'application/xml' },
    responseType: 'text',
  });
  return res.data;
}

/**
 * Filtra le notifiche per tipo.
 * Tipi SDI: RC (ricevuta consegna), NS (notifica scarto), MC (mancata consegna),
 *           NE (notifica esito), AT (attestazione trasmissione)
 *
 * @param {object} http
 * @param {string} cf
 * @param {string} dataInizio
 * @param {string} dataFine
 * @param {string} tipo - es. 'NS' per scarti
 * @returns {Array}
 */
async function notifichePerTipo(http, cf, dataInizio, dataFine, tipo) {
  let pagina = 1;
  let risultati = [];

  while (true) {
    const risposta = await elencaNotifiche(http, cf, dataInizio, dataFine, pagina);
    const items = (risposta.notifiche || risposta.risultati || []).filter(
      (n) => n.tipo_notifica === tipo || n.tipo === tipo
    );
    risultati = risultati.concat(items);

    const totale = risposta.totale_pagine || risposta.numero_pagine || 1;
    if (pagina >= totale) break;
    pagina++;
  }

  return risultati;
}

module.exports = {
  elencaNotifiche,
  scaricaNotifica,
  notifichePerTipo,
};
