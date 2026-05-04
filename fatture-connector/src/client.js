const https = require('https');
const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'https://ivaservizi.agenziaentrate.gov.it/ser/v1';

/**
 * Crea un'istanza axios configurata con mutual TLS.
 * Il certificato .p12 viene caricato da disco o passato come Buffer.
 */
function createHttpClient(config) {
  const { certPath, certPassword, certBuffer } = config;

  const pfx = certBuffer || fs.readFileSync(certPath);

  const httpsAgent = new https.Agent({
    pfx,
    passphrase: certPassword,
    rejectUnauthorized: true,
  });

  return axios.create({
    baseURL: BASE_URL,
    httpsAgent,
    timeout: 30000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

module.exports = { createHttpClient };
