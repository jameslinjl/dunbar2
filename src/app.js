const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const twilioIntegration = require('./twilioIntegration');
const googleSpreadsheetIntegration = require('./googleSpreadsheetIntegration');
const gSheetHelpers = require('./gSheetHelpers');
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

const getEnabledUsers = async () => {
  const users = await gSheetHelpers.getUsers();
  return _.filter(users, user => !_.isEmpty(user.userData.enabled));
};

const handleSendRemindersV2 = async () => {
  const reminderMessage = await googleSpreadsheetIntegration.getReminderMessage();
  const enabledUsers = await getEnabledUsers();

  _.forEach(enabledUsers, async user => {
    const {
      friends,
      userData: { userPhone, userName },
      rowId,
    } = user;
    const dbData = await dbHelpers.getDunbarUserByGSheetRowId(rowId);
    const { current_friend_index } = _.head(dbData);

    if (_.isNil(current_friend_index)) {
      console.error(`${rowId} is NOT in the postgresql db`);
      return;
    }

    const friendCount = _.size(friends);
    if (current_friend_index >= friendCount) {
      dbHelpers.updateDunbarUserByGSheetRowId(rowId, 0);
    } else {
      const friendToMessage = friends[current_friend_index];
      twilioIntegration.sendReminder(
        // TODO: remove this once we go live
        `DSS Test: ${reminderMessage}`,
        userPhone,
        {
          name: userName,
          friendName: friendToMessage.name,
          friendNumber: friendToMessage.phone,
        },
        () => {
          const newFriendIndex =
            current_friend_index + 1 >= friendCount
              ? 0
              : current_friend_index + 1;
          dbHelpers
            .updateDunbarUserByGSheetRowId(rowId, newFriendIndex)
            .then(() =>
              console.log(`update ${rowId} to index ${newFriendIndex}`)
            );
        }
      );
    }
  });
};

app.post('/send-reminders-v2', (req, res) => {
  handleSendRemindersV2().then(() => {
    console.log('successfully sent all reminders!');
  });
  // don't wait for the promise to resolve to send the response so that we don't time out on a long operation
  res.status(204).send('');
});

app.post('/send-follow-ups', (req, res) => {
  twilioIntegration.sendFollowUps();
  res.status(204).send('');
});

const handleSendFollowUpsV2 = async () => {
  const followUpMessages = await googleSpreadsheetIntegration.getFollowUpMessages();
  const enabledUsers = await getEnabledUsers();

  _.forEach(enabledUsers, async user => {
    const {
      friends,
      userData: { userPhone, userName },
      rowId,
    } = user;
    const dbData = await dbHelpers.getDunbarUserByGSheetRowId(rowId);
    const { current_friend_index } = _.head(dbData);

    if (_.isNil(current_friend_index)) {
      console.error(`${rowId} is NOT in the postgresql db`);
      return;
    }

    const followUpFriendIndex =
      current_friend_index === 0
        ? _.size(friends) - 1
        : current_friend_index - 1;
    const friendToFollowUp = friends[followUpFriendIndex];

    _.forEach(followUpMessages, async followUpMessage => {
      const message = twilioIntegration.templateBody(followUpMessage, {
        name: userName,
        friendName: friendToFollowUp.name,
        friendNumber: friendToFollowUp.phone,
      });
      // make this blocking so that we can ensure message order
      await twilioIntegration
        .sendMessageAsDunbar(`DSS Test: ${message}`, userPhone)
        .then(() => console.log(`sent follow-up to ${userPhone}`));
    });
  });
};

app.post('/send-follow-ups-v2', (req, res) => {
  handleSendFollowUpsV2().then(() => {
    console.log('successfully sent all follow ups!');
  });
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
      ? dbHelpers.updateDunbarUserByGSheetRowId(gSheetRowId, 0)
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
