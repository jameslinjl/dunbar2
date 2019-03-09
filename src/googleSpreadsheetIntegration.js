const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');

const googleSheetBaseUrl =
  'https://sheets.googleapis.com/v4/spreadsheets/1wLmGJI3-yDhFzaTpmTJuPMBrYShYEb9IdAVJVOYmY-U/values/Form%20Responses%201!A1:Z100?key=';
const googleSheetApiKey = process.env.GOOGLE_SHEET_API_KEY;

// this maps the mod-3 result to the index of the column in the google sheet
const mod3SheetColumnIndexMapping = {
  0: {
    name: 3,
    number: 4,
  },
  1: {
    name: 5,
    number: 6,
  },
  2: {
    name: 7,
    number: 8,
  },
};

async function get100Users() {
  const response = await axios.get(googleSheetBaseUrl + googleSheetApiKey);
  const keys = _.head(response.data.values);
  const arrOfValues = _.slice(response.data.values, 1);

  return _.map(arrOfValues, values => {
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = values[i];
    }
    return obj;
  });
}

async function getThisWeeksReminders() {
  const weekMod3 = moment().week() % 3;
  const users = await get100Users();

  const keys = _.keys(users[0]);
  const nameKeyIndex = mod3SheetColumnIndexMapping[weekMod3]['name'];
  const nameKey = keys[nameKeyIndex];
  const numberKeyIndex = mod3SheetColumnIndexMapping[weekMod3]['number'];
  const numberKey = keys[numberKeyIndex];

  return _.map(users, user => {
    return {
      name: user['your full name'],
      number: user['your phone number (no spaces)'],
      friendName: user[nameKey],
      friendNumber: user[numberKey],
    };
  });
}

const getThisWeeksRemindersWrapper = () => {
  return getThisWeeksReminders();
};

module.exports = {
  getThisWeeksRemindersWrapper,
};
