'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const utils = require('../../utils');
const JSZip = require('../../utils/jszip-extra');
const Cache = require('../../utils/cache');

module.exports = {
  _,
  fs,
  path,
  moment,
  formatTime(time) {
    return moment(time).format('YYYY-MM-DD hh:mm:ss');
  },
  JSZip,
  Cache,
  objectCodify         : utils.objectCodify,
  objectStringify      : utils.objectStringify,
  stringObjectify      : utils.stringObjectify,
  JSONReplacer         : utils.JSONReplacer,
  JSONReviver          : utils.JSONReviver,
  symbolObjectStringify: utils.symbolObjectStringify,
  symbolStringObjectify: utils.symbolStringObjectify,
  getObjectSymbolKey   : utils.getObjectSymbolKey,
  getObjectSymbolKeys  : utils.getObjectSymbolKeys,
  getObjectSymbol      : utils.getObjectSymbol,
  getObjectSymbols     : utils.getObjectSymbols,
  md5                  : utils.md5,
  md5File              : utils.md5File,
  md5Directory         : utils.md5Directory,
  md5salt              : utils.md5salt,
  uuid                 : utils.uuid,
  base64Encode         : utils.base64Encode,
  base64Decode         : utils.base64Decode,
  htmlEncode           : utils.htmlEncode,
  htmlDecode           : utils.htmlDecode,
  bkdrHash             : utils.bkdrHash,
  toJSON               : utils.toJSON,
  ip624                : utils.ip624,
  getReqIp             : utils.getReqIp,
  getIp                : utils.getIp,
  getPinyin            : utils.getPinyin,

  /**
   * 前置补零
   * @param {number} num 源值
   * @param {number} len 目标长度
   * @returns {string} 补 0 后字符串
   */
  zeroFix(num, len) {
    num = `${num}`;
    const olen = num.length;
    if (olen >= len) {
      return num;
    }
    return new Array(len - olen + 1).join('0') + num;
  },

  /**
   * ### 等待毫秒时间（sleep）
   *
   * @name delay
   * @mtehod Helper#delay
   *
   * @param {number} [ms=0] 延迟毫秒数
   *
   * @returns {Promise<1>}
   *
   * @test { argument: [ 100 ], respText: 'done' }
   */
  async delay(ms) {
    ms = ms || 0;
    return await new Promise(resolve => {
      setTimeout(() => {
        resolve(1);
      }, ms);
    });
  },
};
