const cron = require('node-cron');
const path = require('path');
const dayjs = require('dayjs');
const { SYNC_CRON, FATTURE_CERT_PATH, FATTURE_CERT_PASSWORD } = require('../config/env');
const User = require('../models/shared/User');
const Fattura = require('../models/Fattura');
const Corrispettivo = require('../models/Corrispettivo');
const Notifica = require('../models/Notifica');

const FattureConnector = require(path.resolve(__dirname, '../../fatture-connector/src/index'));

let connector;
function getConnector() {
  if (!connector) {
    connector = new FattureConnector({
      certPath: FATTURE_CERT_PATH,
      certPassword: FATTURE_CERT_PASSWORD,
    });
  }
  return connector;
}

async function syncCliente(cf, clienteUser) {
  const c = getConnector();
  const dataFine = dayjs().format('YYYY-MM-DD');
  const dataInizio = dayjs().subtract(2, 'year').format('YYYY-MM-DD');

  const ids = { clienteId: clienteUser._id, consulenteId: clienteUser.consulenteId };

  // ── Fatture ──────────────────────────────────────────────────────────────
  const elencoFatture = await c.scaricaTutteLeFatture(cf, dataInizio, dataFine);
  for (const doc of elencoFatture) {
    const idSdi = doc.identificativo || doc.id_sdi || doc.id;
    let xmlRaw, datiParsati;
    try {
      const parsed = await c.scaricaFatturaJSON(idSdi);
      xmlRaw = await c.scaricaFattura(idSdi);
      const body =
        parsed?.FatturaElettronica?.FatturaElettronicaBody ||
        parsed?.FatturaElettronica?.FatturaElettronicaBody?.[0] ||
        {};
      const dati = body.DatiGenerali?.DatiGeneraliDocumento || {};
      const cedente =
        parsed?.FatturaElettronica?.FatturaElettronicaHeader?.CedentePrestatore
          ?.DatiAnagrafici || {};

      datiParsati = {
        numero: dati.Numero,
        data: dati.Data ? new Date(dati.Data) : null,
        cedente: {
          nome: cedente.Anagrafica?.Denominazione || cedente.Anagrafica?.Nome,
          piva: cedente.IdFiscaleIVA?.IdCodice,
          codiceFiscale: cedente.CodiceFiscale,
        },
        totale: parseFloat(dati.ImportoTotaleDocumento) || null,
        iva: null,
      };
    } catch {
      // parsing fallito: salviamo comunque i metadati base
    }

    await Fattura.findOneAndUpdate(
      { idSdi },
      { $set: { idSdi, cfDelegante: cf, ...ids, xmlRaw, datiParsati } },
      { upsert: true }
    );
  }

  // ── Corrispettivi ADE ────────────────────────────────────────────────────
  const elencoCorrispettivi = await c.scaricaTuttiCorrispettivi(cf, dataInizio, dataFine);
  for (const doc of elencoCorrispettivi) {
    const idSdi = doc.identificativo || doc.id_sdi || doc.id;
    await Corrispettivo.findOneAndUpdate(
      { idSdi },
      { $set: { idSdi, cfDelegante: cf, ...ids, data: doc.data, importoTotale: doc.importo } },
      { upsert: true }
    );
  }

  // ── Notifiche ─────────────────────────────────────────────────────────────
  for (const tipo of ['RC', 'NS', 'MC', 'NE', 'AT']) {
    const lista = await c.notifichePerTipo(cf, dataInizio, dataFine, tipo);
    for (const n of lista) {
      const idNotifica = n.identificativo || n.id;
      const fatturaDoc = await Fattura.findOne({ cfDelegante: cf, idSdi: n.id_documento }).lean();
      await Notifica.findOneAndUpdate(
        { idNotifica },
        { $set: { idNotifica, fatturaId: fatturaDoc?._id, cfDelegante: cf, tipo } },
        { upsert: true }
      );
    }
  }
}

async function eseguiSync() {
  console.log(`[sync] Avvio ${new Date().toISOString()}`);

  // recupera tutti i consulenti, poi i loro clienti tramite il metodo della taxi app
  const consulenti = await User.find({ ruolo: 'consulente' }).lean();
  console.log(`[sync] Consulenti: ${consulenti.length}`);

  for (const consulente of consulenti) {
    const clienti = await User.trovaClientiConsulente(consulente._id);
    for (const cliente of clienti) {
      const cf = cliente.codiceFiscale;
      if (!cf) continue;
      try {
        await syncCliente(cf, cliente);
        console.log(`[sync] OK ${cf}`);
      } catch (err) {
        console.error(`[sync] ERRORE ${cf}: ${err.message}`);
      }
    }
  }

  console.log(`[sync] Completato ${new Date().toISOString()}`);
}

function avviaScheduler() {
  cron.schedule(SYNC_CRON, eseguiSync);
  console.log(`[sync] Scheduler attivo — cron: ${SYNC_CRON}`);
}

module.exports = { avviaScheduler, eseguiSync };
