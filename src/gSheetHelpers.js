const _ = require('lodash');
const axios = require('axios');

// TODO: improve this to grab more than 1000 users
const gSheetBaseUrl =
  'https://sheets.googleapis.com/v4/spreadsheets/1rsd2eqWOQIZArwlywnAotnkbPxK4AYUs9y3Zviud0QQ/values/master%20db!A1:Z1000?key=';

const gSheetApiKey = process.env.GOOGLE_SHEET_API_KEY;

const dataKeys = {
  editResponseLink: 0,
  timeStamp: 1,
  email: 2,
  userName: 3,
  userPhone: 4,
  userZip: 5,
  enabled: 25,
};

const friendNameIndices = [6, 8, 10, 13, 15, 17, 19, 21, 23];
const friendPhoneIndices = [7, 9, 11, 14, 16, 18, 20, 22, 24];

const transformUserData = (userArray, userArrayIndex) => {
  const userData = _.reduce(dataKeys, (result, dataIndex, key) => {
    return {
      ...result,
      [key]: userArray[dataIndex],
    };
  });

  const friendsWithBlanks = _.zipWith(
    friendNameIndices,
    friendPhoneIndices,
    (nameIndex, phoneIndex) => {
      const name = userArray[nameIndex];
      const phone = userArray[phoneIndex];
      return _.isEmpty(name) || _.isEmpty(phone) ? {} : { name, phone };
    }
  );
  const friends = _.filter(friendsWithBlanks, element => !_.isEmpty(element));

  return {
    rowId: userArrayIndex + 2,
    userData,
    friends,
  };
};

async function getUsers() {
  const response = await axios.get(gSheetBaseUrl + gSheetApiKey);
  const userArrays = _.slice(response.data.values, 1);

  return _.map(userArrays, transformUserData);
}

module.exports = {
  getUsers,
};
