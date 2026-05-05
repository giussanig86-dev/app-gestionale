require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET', 'FATTURE_CERT_PATH', 'FATTURE_CERT_PASSWORD'];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Variabile d'ambiente mancante: ${key}`);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: parseInt(process.env.PORT || '3001', 10),

  USERS_COLLECTION: process.env.MONGO_USERS_COLLECTION || 'users',

  FATTURE_CERT_PATH: process.env.FATTURE_CERT_PATH,
  FATTURE_CERT_PASSWORD: process.env.FATTURE_CERT_PASSWORD,

  SYNC_CRON: process.env.SYNC_CRON || '0 * * * *',

  // A-Cube API (invio fatture attive e corrispettivi verso SDI)
  ACUBE_BASE_URL: process.env.ACUBE_BASE_URL,
  ACUBE_EMAIL: process.env.ACUBE_EMAIL,
  ACUBE_PASSWORD: process.env.ACUBE_PASSWORD,
  ACUBE_WEBHOOK_SECRET: process.env.ACUBE_WEBHOOK_SECRET,
};
