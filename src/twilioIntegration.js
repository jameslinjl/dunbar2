const _ = require('lodash');

const accountSid = 'ACb1a14bf1d511f52d6d6383b3ac74f7cd';
const authToken = '095093f7cd526b1d5803e67d6e3d2c8f';
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

  sendMessages(messages, '+16105491632', phoneNumber);
};

module.exports = { sendWelcome };
