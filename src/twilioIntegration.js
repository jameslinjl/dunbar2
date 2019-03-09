const _ = require('lodash');

const sendWelcome = (name, phoneNumber) => {
  const messages = [
    `Hi ${name}! This is Dash from Dunbar, an intelligent assistant that helps you stay in touch with friends you care about (https://hellodunbar.com).`,
    'Thanks for signing up to see what parts of this project works for you and how we can make it better.',
    "Here's how it works: every Sunday, Dunbar sends you a friend and their contact info. Later in the week, we will reach out to see if you were able to connect.",
    'Over time, we will offer a few more surprises, but for now … that’s it!',
  ];

  console.log(`send messages to ${phoneNumber}`);
  _.map(messages, message => {
    console.log(message);
  });
};

export { sendWelcome };
