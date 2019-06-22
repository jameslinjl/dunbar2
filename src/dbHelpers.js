const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection: process.env.DATABASE_URL,
});

const TABLE_NAME = 'dunbar_user';

const getDunbarUserByGSheetRowId = gSheetRowId => {
  return knex
    .select()
    .table(TABLE_NAME)
    .where({ g_sheet_row_id: gSheetRowId });
};

const insertDunbarUser = gSheetRowId => {
  return knex(TABLE_NAME).insert({
    g_sheet_row_id: gSheetRowId,
    current_friend_number: 1,
    created_on: knex.fn.now(),
    last_modified: knex.fn.now(),
  });
};

const updateDunbarUserByGSheetRowId = (gSheetRowId, currentFriendNumber) => {
  return knex(TABLE_NAME)
    .where({ g_sheet_row_id: gSheetRowId })
    .update({
      current_friend_number: currentFriendNumber,
      last_modified: knex.fn.now(),
    });
};

module.exports = {
  getDunbarUserByGSheetRowId,
  insertDunbarUser,
  updateDunbarUserByGSheetRowId,
};
