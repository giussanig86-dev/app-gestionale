require('dotenv').config();
const { createHttpClient } = require('./client');
const fatture = require('./fatture');
const corrispettivi = require('./corrispettivi');
const notifiche = require('./notifiche');

/**
 * FattureConnector — punto di ingresso del modulo.
 *
 * Configurazione minima:
 *   const connector = new FattureConnector({
 *     certPath:     '/path/al/certificato.p12',
 *     certPassword: 'password-certificato',
 *   });
 *
 * Oppure via variabili d'ambiente:
 *   FATTURE_CERT_PATH, FATTURE_CERT_PASSWORD
 */
class FattureConnector {
  constructor(config = {}) {
    const certPath = config.certPath || process.env.FATTURE_CERT_PATH;
    const certPassword = config.certPassword || process.env.FATTURE_CERT_PASSWORD;
    const certBuffer = config.certBuffer || null;

    if (!certBuffer && !certPath) {
      throw new Error(
        'Configurazione mancante: specifica certPath oppure certBuffer (certificato .p12)'
      );
    }
    if (!certPassword) {
      throw new Error('Configurazione mancante: specifica certPassword');
    }

    this.http = createHttpClient({ certPath, certPassword, certBuffer });
  }

  // ── FATTURE ────────────────────────────────────────────────────────────────

  /** Elenco fatture ricevute (paginato) */
  elencaFattureRicevute(cf, dataInizio, dataFine, pagina = 1) {
    return fatture.elencaFattureRicevute(this.http, cf, dataInizio, dataFine, pagina);
  }

  /** Tutte le fatture del periodo (gestisce paginazione automaticamente) */
  scaricaTutteLeFatture(cf, dataInizio, dataFine) {
    return fatture.scaricaTutteLeFatture(this.http, cf, dataInizio, dataFine);
  }

  /** XML grezzo di una fattura */
  scaricaFattura(idDocumento) {
    return fatture.scaricaFattura(this.http, idDocumento);
  }

  /** Fattura convertita in oggetto JS */
  scaricaFatturaJSON(idDocumento) {
    return fatture.scaricaFatturaJSON(this.http, idDocumento);
  }

  /** Salva l'XML della fattura su disco, restituisce il percorso */
  salvaFatturaXML(idDocumento, outputDir) {
    return fatture.salvaFatturaXML(this.http, idDocumento, outputDir);
  }

  // ── CORRISPETTIVI ──────────────────────────────────────────────────────────

  /** Elenco corrispettivi (paginato) */
  elencaCorrispettivi(cf, dataInizio, dataFine, pagina = 1) {
    return corrispettivi.elencaCorrispettivi(this.http, cf, dataInizio, dataFine, pagina);
  }

  /** Tutti i corrispettivi del periodo */
  scaricaTuttiCorrispettivi(cf, dataInizio, dataFine) {
    return corrispettivi.scaricaTuttiCorrispettivi(this.http, cf, dataInizio, dataFine);
  }

  /** XML grezzo di un corrispettivo */
  scaricaCorrispettivo(idDocumento) {
    return corrispettivi.scaricaCorrispettivo(this.http, idDocumento);
  }

  // ── NOTIFICHE ──────────────────────────────────────────────────────────────

  /** Elenco notifiche SDI (paginato) */
  elencaNotifiche(cf, dataInizio, dataFine, pagina = 1) {
    return notifiche.elencaNotifiche(this.http, cf, dataInizio, dataFine, pagina);
  }

  /** Dettaglio XML di una notifica */
  scaricaNotifica(idNotifica) {
    return notifiche.scaricaNotifica(this.http, idNotifica);
  }

  /**
   * Notifiche filtrate per tipo:
   * RC=consegna, NS=scarto, MC=mancata consegna, NE=esito, AT=attestazione
   */
  notifichePerTipo(cf, dataInizio, dataFine, tipo) {
    return notifiche.notifichePerTipo(this.http, cf, dataInizio, dataFine, tipo);
  }
}

module.exports = FattureConnector;
