const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const twilioIntegration = require('./twilioIntegration');

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.post('/debug', (req, res) => {
  console.log(req.body);
  res.status(200).send('');
});

app.all('/status', (req, res) => {
  res.status(200).send('');
});

app.post('/send-reminders', (req, res) => {
  twilioIntegration.sendReminders();
  res.status(204).send('');
});

app.post('/send-follow-ups', (req, res) => {
  twilioIntegration.sendFollowUps();
  res.status(204).send('');
});

app.post('/send-welcome', (req, res) => {
  const body = req.body;

  twilioIntegration.sendWelcome(
    body['your first name'][0],
    body['your phone number (no spaces)'][0]
  );

  res.status(204).send('');
});

app.post('/send-as-dunbar', (req, res) => {
  const body = req.body;

  twilioIntegration.sendMessage(body.message, twilioPhoneNumber, body.number);

  res.status(204).send('');
});

app.post('/send-as-dunbar-slack', (req, res) => {
  const args = req.body.text;

  const splitArgs = _.split(args, ' ');
  const number = splitArgs[0];

  const message = _.join(_.slice(splitArgs, 1), ' ');

  twilioIntegration.sendMessage(message, twilioPhoneNumber, number);

  res.status(200).send(`Sent "${message}" to ${number}`);
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
