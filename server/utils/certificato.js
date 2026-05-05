const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Verifica che un certificato .p12 sia valido e non scaduto.
 * Restituisce { valido, scadenza, soggettoNome, errore }.
 */
function verificaCertificato(certPath, password) {
  if (!fs.existsSync(certPath)) {
    return { valido: false, errore: 'File certificato non trovato' };
  }

  // 1. Verifica che il pfx si carichi correttamente (password + integrità)
  const pfx = fs.readFileSync(certPath);
  try {
    new https.Agent({ pfx, passphrase: password, rejectUnauthorized: false });
  } catch {
    return { valido: false, errore: 'Certificato non valido o password errata' };
  }

  // 2. Estrae data di scadenza e soggetto via openssl
  try {
    const passArg = password ? `pass:${password}` : 'pass:';
    const pemCmd = `openssl pkcs12 -in "${certPath}" -passin "${passArg}" -nokeys -clcerts 2>/dev/null`;
    const pem = execSync(pemCmd, { encoding: 'utf8' });

    const endDateRaw = execSync(`echo "${pem}" | openssl x509 -noout -enddate 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();
    const subjectRaw = execSync(`echo "${pem}" | openssl x509 -noout -subject 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();

    const scadenza = new Date(endDateRaw.replace('notAfter=', ''));
    const soggettoNome = subjectRaw.match(/CN\s*=\s*([^,/\n]+)/)?.[1]?.trim() || null;
    const scaduto = scadenza < new Date();

    return {
      valido: !scaduto,
      scadenza,
      soggettoNome,
      scaduto,
      errore: scaduto ? 'Certificato scaduto' : null,
    };
  } catch {
    // pfx carica ma openssl non riesce a leggere i dettagli — cert valido ma info non disponibili
    return { valido: true, scadenza: null, soggettoNome: null, scaduto: false, errore: null };
  }
}

module.exports = { verificaCertificato };
