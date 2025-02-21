const _ = require('lodash');
const Handlebars = require('handlebars');
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

async function sendMessageAsDunbar(body, to) {
  sendMessage(body, twilioPhoneNumber, to);
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
    `Hi ${truncatedName}! 👋 Welcome to Oslo––where we make it easy to stay in touch with the people who matter!`,
    'Add us to your contacts and we will take care of the rest.',
  ];

  sendMessages(messages, twilioPhoneNumber, phoneNumber);
};

const templateBody = (template, placeholders) => {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(placeholders);
};

const sendReminder = (reminder, number, templateParams, cb = () => {}) => {
  const body = templateBody(reminder, templateParams);
  twilioClient.messages
    .create({
      body,
      from: twilioPhoneNumber,
      to: number,
    })
    .then(message => {
      console.log(`success sending reminder to ${number} (${message.sid})`);
      cb();
    })
    .catch(error => {
      console.error(`error sending message to ${number}`);
      console.error(error);
    });
};

const sendReminders = () => {
  googleSpreadsheetIntegration
    .getThisWeeksRemindersWrapper()
    .then(reminders => {
      _.forEach(reminders, reminder => {
        const body = templateBody(reminder.messageTemplate, reminder);
        twilioClient.messages
          .create({
            body,
            from: twilioPhoneNumber,
            to: reminder.number,
          })
          .then(message => {
            console.log(message.sid);
          });
      });
    });
};

const sendFollowUps = () => {
  googleSpreadsheetIntegration
    .getThisWeeksFollowUpsWrapper()
    .then(followUps => {
      _.forEach(followUps, followUp => {
        const bodies = _.map(followUp.messageTemplates, messageTemplate =>
          templateBody(messageTemplate, followUp)
        );

        sendMessages(bodies, twilioPhoneNumber, followUp.number);
      });
    });
};

module.exports = {
  sendFollowUps,
  sendMessage,
  sendReminders,
  sendWelcome,
  templateBody,
  sendReminder,
  templateBody,
  sendMessageAsDunbar,
};
