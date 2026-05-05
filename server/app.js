const express = require('express');

const app = express();
app.use(express.json());

app.use('/api/fatture', require('./routes/fatture'));
app.use('/api/corrispettivi', require('./routes/corrispettivi'));
app.use('/api/notifiche', require('./routes/notifiche'));
app.use('/api/sync', require('./routes/sync'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

module.exports = app;
