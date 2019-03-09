const bodyParser = require('body-parser');
const express = require('express');
const twilioIntegration = require('./twilioIntegration');

const app = express();

app.use(bodyParser.json());

app.get('/status', (req, res) => {
  res.status(204).send('');
});

app.post('/send-reminders', (req, res) => {
  twilioIntegration.sendReminders();
  res.status(204).send('');
});

app.post('/send-welcome', (req, res) => {
  const body = req.body;

  twilioIntegration.sendWelcome(
    body['your full name'][0],
    body['your phone number (no spaces)'][0]
  );

  res.status(204).send('');
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
