const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const twilioIntegration = require('./twilioIntegration');
const googleSpreadsheetIntegration = require('./googleSpreadsheetIntegration');
const dbHelpers = require('./dbHelpers');

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

const handleSendRemindersV2 = async () => {
  const reminderMessage = await googleSpreadsheetIntegration.getReminderMessage();
  console.log(reminderMessage);
  const users = await googleSpreadsheetIntegration.get1000UsersV2();
  console.log(users);
};

app.post('/send-reminders-v2', (req, res) => {
  handleSendRemindersV2().then(() => {
    console.log('success!');
  });
  // don't wait for the promise to resolve to send the response so that we don't time out on a long operation
  res.status(204).send('');
});

// send-reminders-v2
// get users from gsheet
// for each (enabled) user:
//  get user data from pg
//  send reminder to appropriate friend
//  on successful reminder, update which friend to remind (need to compute total friends)

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

const handleGFormWriteToDb = async (gSheetRowId, currentFriendIndex) => {
  const rows = await dbHelpers.getDunbarUserByGSheetRowId(gSheetRowId);
  if (_.isEmpty(rows)) {
    return dbHelpers.insertDunbarUser(gSheetRowId);
  } else {
    return _.isNil(currentFriendIndex)
      ? dbHelpers.updateDunbarUserByGSheetRowId(gSheetRowId, 1)
      : dbHelpers.updateDunbarUserByGSheetRowId(
          gSheetRowId,
          currentFriendIndex
        );
  }
};

app.post('/g-form-write-to-db', (req, res) => {
  const {
    row_id: gSheetRowId,
    current_friend_number: currentFriendIndex,
  } = req.body;

  if (_.isNil(gSheetRowId)) {
    return res.status(400).json({ error: 'row_id is required' });
  }

  handleGFormWriteToDb(gSheetRowId, currentFriendIndex)
    .then(rows_written => {
      res.status(200).json({ rows_written });
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
