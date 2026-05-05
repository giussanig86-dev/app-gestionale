require('./config/env');          // valida variabili d'ambiente prima di tutto
const connectDB = require('./config/db');
const app = require('./app');
const { avviaScheduler } = require('./scheduler/syncJob');
const { PORT } = require('./config/env');

async function main() {
  await connectDB();
  avviaScheduler();
  app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`));
}

main().catch((err) => {
  console.error('Avvio fallito:', err.message);
  process.exit(1);
});
