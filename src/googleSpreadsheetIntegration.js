const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');

const googleSheetBaseUrl =
  'https://sheets.googleapis.com/v4/spreadsheets/1wLmGJI3-yDhFzaTpmTJuPMBrYShYEb9IdAVJVOYmY-U/values/Form%20Responses%201!A1:Z1000?key=';
const googleSheetApiKey = process.env.GOOGLE_SHEET_API_KEY;

async function get1000Users() {
  const response = await axios.get(googleSheetBaseUrl + googleSheetApiKey);
  const keys = _.head(response.data.values);
  const arrOfValues = _.slice(response.data.values, 1);

  return {
    keys,
    users: _.map(arrOfValues, values => _.zipObject(keys, values)),
  };
}

async function getReminderMessage() {
  const response = await axios.get(
    'https://sheets.googleapis.com/v4/spreadsheets/1wLmGJI3-yDhFzaTpmTJuPMBrYShYEb9IdAVJVOYmY-U/values/text%20scripts%20db!C2:C2?key=' +
      googleSheetApiKey
  );

  return _.get(response, 'data.values[0][0]', undefined);
}

async function getFollowUpMessages() {
  const response = await axios.get(
    'https://sheets.googleapis.com/v4/spreadsheets/1wLmGJI3-yDhFzaTpmTJuPMBrYShYEb9IdAVJVOYmY-U/values/text%20scripts%20db!D2:D3?key=' +
      googleSheetApiKey
  );

  return _.flatten(_.get(response, 'data.values', undefined));
}

const KEY_CONSTANTS = {
  TIMESTAMP: 0,
  YOUR_NAME: 1,
  YOUR_NUMBER: 2,
  FIRST_FRIEND_NAME: 3,
  FIRST_FRIEND_NUMBER: 4,
  SECOND_FRIEND_NAME: 5,
  SECOND_FRIEND_NUMBER: 6,
  THIRD_FRIEND_NAME: 7,
  THIRD_FRIEND_NUMBER: 8,
  ENABLED: 9,
  FOURTH_FRIEND_NAME: 10,
  FOURTH_FRIEND_NUMBER: 11,
};

// this maps the mod-3 result to the index of the column in the google sheet
const mod3SheetColumnIndexMapping = {
  0: {
    name: KEY_CONSTANTS.FIRST_FRIEND_NAME,
    number: KEY_CONSTANTS.FIRST_FRIEND_NUMBER,
  },
  1: {
    name: KEY_CONSTANTS.SECOND_FRIEND_NAME,
    number: KEY_CONSTANTS.SECOND_FRIEND_NUMBER,
  },
  2: {
    name: KEY_CONSTANTS.THIRD_FRIEND_NAME,
    number: KEY_CONSTANTS.THIRD_FRIEND_NUMBER,
  },
};

async function getThisWeeksReminders() {
  const weekMod3 = moment().week() % 3;
  const { keys, users } = await get1000Users();

  const nameKeyIndex = mod3SheetColumnIndexMapping[weekMod3]['name'];
  const nameKey = keys[nameKeyIndex];
  const numberKeyIndex = mod3SheetColumnIndexMapping[weekMod3]['number'];
  const numberKey = keys[numberKeyIndex];

  const messageTemplate = await getReminderMessage();

  const enabledUsers = _.filter(users, 'enabled');

  return _.map(enabledUsers, user => {
    return {
      name: user[keys[KEY_CONSTANTS.YOUR_NAME]],
      number: user[keys[KEY_CONSTANTS.YOUR_NUMBER]],
      friendName: user[nameKey],
      friendNumber: user[numberKey],
      messageTemplate,
    };
  });
}

const getThisWeeksRemindersWrapper = () => {
  return getThisWeeksReminders();
};

async function getThisWeeksFollowUps() {
  const previousWeekMod3 =
    moment()
      .subtract(1, 'weeks')
      .week() % 3;
  const { keys, users } = await get1000Users();

  const nameKeyIndex = mod3SheetColumnIndexMapping[previousWeekMod3]['name'];
  const nameKey = keys[nameKeyIndex];
  const numberKeyIndex =
    mod3SheetColumnIndexMapping[previousWeekMod3]['number'];
  const numberKey = keys[numberKeyIndex];

  const messageTemplates = await getFollowUpMessages();

  const enabledUsers = _.filter(users, 'enabled');

  return _.map(enabledUsers, user => {
    return {
      name: user[keys[KEY_CONSTANTS.YOUR_NAME]],
      number: user[keys[KEY_CONSTANTS.YOUR_NUMBER]],
      friendName: user[nameKey],
      friendNumber: user[numberKey],
      messageTemplates,
    };
  });
}

const getThisWeeksFollowUpsWrapper = () => {
  return getThisWeeksFollowUps();
};

module.exports = {
  getThisWeeksRemindersWrapper,
  getThisWeeksFollowUpsWrapper,
};
