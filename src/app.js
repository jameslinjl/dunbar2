const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const twilioIntegration = require('./twilioIntegration');
const googleSpreadsheetIntegration = require('./googleSpreadsheetIntegration');

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

  res.status(200).json({
    response_type: 'in_channel',
    text: `Sent "${message}" to ${number}`,
  });
});

app.post('/send-to-all-as-dunbar-slack', (req, res) => {
  const message = req.body.text;

  googleSpreadsheetIntegration.get1000Users().then(result => {
    const nameKey =
      result.keys[googleSpreadsheetIntegration.KEY_CONSTANTS.YOUR_NAME];
    const numberKey =
      result.keys[googleSpreadsheetIntegration.KEY_CONSTANTS.YOUR_NUMBER];
    const users = _.filter(result.users, 'enabled');

    _.forEach(users, user => {
      twilioIntegration
        .sendMessage(
          twilioIntegration.templateBody(message, { name: user[nameKey] }),
          twilioPhoneNumber,
          user[numberKey]
        )
        .then(id => {
          console.log(id);
        });
    });
  });

  res.status(200).json({
    response_type: 'in_channel',
    text: `Sent "${message}" to all enabled users.`,
  });
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
