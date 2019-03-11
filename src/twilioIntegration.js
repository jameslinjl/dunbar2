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
    `Hi ${truncatedName}! This is Dunbar, an intelligent assistant that helps you stay in touch with friends you care about (https://hellodunbar.com).`,
    'Thanks for signing up to see what parts of this project works for you and how we can make it better.',
    "Here's how it works: every Sunday, Dunbar sends you a friend and their contact info. Later in the week, we will reach out to see if you were able to connect.",
    'Over time, we will offer a few more surprises, but for now … that’s it!',
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
