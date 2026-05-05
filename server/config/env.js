require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET', 'FATTURE_CERT_PATH', 'FATTURE_CERT_PASSWORD'];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Variabile d'ambiente mancante: ${key}`);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: parseInt(process.env.PORT || '3001', 10),

  // nomi collection condivise con la taxi app (override se diversi)
  USERS_COLLECTION: process.env.MONGO_USERS_COLLECTION || 'users',
  CLIENTI_COLLECTION: process.env.MONGO_CLIENTI_COLLECTION || 'clienti',

  FATTURE_CERT_PATH: process.env.FATTURE_CERT_PATH,
  FATTURE_CERT_PASSWORD: process.env.FATTURE_CERT_PASSWORD,

  // es. '0 * * * *' = ogni ora
  SYNC_CRON: process.env.SYNC_CRON || '0 * * * *',
};
