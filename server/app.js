const express = require('express');

const app = express();

// Il webhook A-Cube deve ricevere il body grezzo per verificare la firma HMAC,
// quindi va montato prima di express.json()
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(express.json());

app.use('/api/fatture', require('./routes/fatture'));
app.use('/api/fatture-attive', require('./routes/fatture-attive'));
app.use('/api/corrispettivi', require('./routes/corrispettivi'));
app.use('/api/corrispettivi-attivi', require('./routes/corrispettivi-attivi'));
app.use('/api/notifiche', require('./routes/notifiche'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/cert', require('./routes/cert'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

module.exports = app;
