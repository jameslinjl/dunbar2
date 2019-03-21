const _ = require('lodash');
const googleSpreadsheetIntegration = require('./googleSpreadsheetIntegration');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = require('twilio')(accountSid, authToken);

async function sendMessage(body, from, to) {
  const message = await twilioClient.messages.create({
    body,
    from,
    to,
  });
  console.log(message.sid);
}

async function sendMessages(messages, from, to) {
  for (const message of messages) {
    await sendMessage(message, from, to);
  }
}

const sendWelcome = (name, phoneNumber) => {
  const truncatedName = _.truncate(name, {
    length: 25,
  });
  const messages = [
    `Hi ${truncatedName}! Dunbar here to help you stay in touch with the people who matter (https://hellodunbar.com).`,
    "Here's how this works: Every week, we will remind you to connect with someone and later on, we will check in to see how it's going (rinse, and repeat).",
    "Over time, we will offer a few more surprises, but for now... that's it. Talk soon!",
  ];

  sendMessages(messages, twilioPhoneNumber, phoneNumber);
};

const sendReminders = () => {
  googleSpreadsheetIntegration
    .getThisWeeksRemindersWrapper()
    .then(reminders => {
      _.forEach(reminders, reminder => {
        twilioClient.messages
          .create({
            body: `Hey ${reminder.name}! Here's your reminder to reach out to ${
              reminder.friendName
            } at ${reminder.friendNumber}`,
            from: twilioPhoneNumber,
            to: reminder.number,
          })
          .then(message => {
            console.log(message.sid);
          });
      });
    });
};

module.exports = { sendReminders, sendWelcome };
