'use strict';

module.exports = {
  json: responseJSON,
  responseJSON,
  responsePlist,
};

async function responseJSON(promise, successCode = 0) {
  const ctx = this;
  ctx.type = 'json';
  try {
    const data = await promise;
    ctx.status = successCode;
    ctx.body = { success: true, data, ext: { query: ctx.query } };
  } catch (err) {
    ctx.status = err.code || 1001;
    ctx.body = { success: false, message: err.message };
  }
}

// TODO 增加其他的返回类型
async function responsePlist(promise, successCode = 0) {
  const ctx = this;
  ctx.type = 'plist';
  try {
    const data = await promise;
    ctx.status = successCode;
    ctx.body = { success: true, data, ext: { query: ctx.query } };
  } catch (err) {
    ctx.status = err.code || 1001;
    ctx.body = { success: false, message: err.message };
  }
}
