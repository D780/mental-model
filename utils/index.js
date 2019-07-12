/**
 * @author 780
 *
 * @Date 2017/3/8
 */

'use strict';

const _       = require('lodash');
const crypto  = require('crypto');
const md5salt = require('apache-md5');
const moment  = require('moment');
const uuid    = require('uuid');
const ipaddr  = require('ipaddr.js');
const os      = require('os');
const pinyin  = require('pinyin');

module.exports = {
  objectStringify,
  getObjectSymbolKey,
  getObjectSymbolKeys,
  getObjectSymbol,
  getObjectSymbols,
  md5,
  moment,
  md5salt,
  uuid,
  base64Encode,
  base64Decode,
  bkdrHash,
  toJSON,
  ip624,
  getReqIp,
  getIp,
  getPinyin,
};

// 对象字符串化
// indent 最大值为10（JSON.stringify限制）
function objectStringify(obj, indent) {
  if (indent >= 1) {
    return JSON.stringify(obj, null, indent).replace(/"(\w+)"(\s*:\s*)/g, '$1$2').replace(/"/g, '\'');
  }

  return JSON.stringify(obj).replace(/"(\w+)"(\s*:\s*)/g, '$1$2 ').replace(/,/g, ', ')
    .replace(/"/g, '\'');
}


/**
 * 获取对象 symbol key
 * @param {Object} obj 对象
 * @param {String} key symbol.toString()的值
 * @returns {*}
 */
function getObjectSymbolKey(obj, key) {
  const keys = Object.getOwnPropertySymbols(obj);
  let ret;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() === key) {
      ret = keys[i];
      break;
    }
  }
  return ret;
}

/**
 * 获取对象 symbol key列表
 * @param {Object} obj 对象
 * @returns {*}
 */
function getObjectSymbolKeys(obj) {
  return Object.getOwnPropertySymbols(obj);
}

/**
 * 获取对象 symbol 值
 * @param {Object} obj 对象
 * @param {String} key symbol.toString()的值
 * @returns {*}
 */
function getObjectSymbol(obj, key) {
  const keys = Object.getOwnPropertySymbols(obj);
  let ret;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() === key) {
      ret = keys[i];
      break;
    }
  }
  return obj[ret];
}

/**
 * 获取对象 symbol 值列表
 * @param {Object} obj 对象
 * @returns {*}
 */
function getObjectSymbols(obj) {
  const keys = Object.getOwnPropertySymbols(obj);
  return _.map(keys, key => obj[key]);
}

/**
 * 计算字符串md5值
 * @param {String} str
 * @returns {*}
 */
function md5(str) {
  const buf = new Buffer(str);
  str = buf.toString('binary');
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(str);
  const hash = md5Hash.digest('hex');
  return hash;
}

/**
 * base64编码
 * @param {String} data
 * @returns {string}
 */
function base64Encode(data) {
  return new Buffer(data).toString('base64');
}

/**
 * base64解码
 * @param {String} data
 * @returns {*}
 */
function base64Decode(data) {
  let ret;
  const str = new Buffer(data, 'base64').toString();
  try {
    ret = JSON.parse(str);
  } catch (e) {
    ret = str;
  }
  return ret;
}


/**
 * 用于将邮箱转换为imid
 * @param {String} str
 * @returns {*}
 */
function bkdrHash(str) {
  str = str.toString();
  if (str) {
    const seed = 131;
    let hash   = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * seed) + str.charCodeAt(i);
      /* eslint-disable no-bitwise */
      hash &= 0x7FFFFFFF;
      /* eslint-enable no-bitwise */
    }
    return hash;
  }
}

/**
 * 获取数据实例的纯对象
 * @param {*}       data
 * @param {Boolean} plain
 * @returns {Function}
 */
function toJSON(data, plain) {
  if (!(data && plain)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(obj => obj.toJSON());
  }
  if (Array.isArray(data.rows)) {
    data.rows = data.rows.map(obj => obj.toJSON());
    return data;
  }
  return data.toJSON();
}


/**
 * 转换ip
 * @param {String} ip
 * @returns {*}
 */
function ip624(ip) {
  if (ipaddr.IPv6.isValid(ip)) {
    const addr = ipaddr.parse(ip);
    if (addr.isIPv4MappedAddress()) {
      return addr.toIPv4Address().octets.join('.');
    }
  }
  return ip;
}

/**
 * 返回req的ip
 * @param {Request} req
 * @returns {*}
 */
function getReqIp(req) {
  return ip624(
    req.headers['x-real-ip']
    || (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(/,\s?/)[0])
    || (req.connection.remoteAddress
    || req.socket.remoteAddress
    || (req.connection.socket && req.connection.socket.remoteAddress))
  );
}

/**
 * 获取本机ip
 * @returns {*}
 */
function getIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    if (interfaces.hasOwnProperty(devName)) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
}

function getPinyin(name) {
  let full  = [];
  let first = [];
  const ret = pinyin(name, { heteronym: true, style: pinyin.STYLE_NORMAL });
  if (ret.length) {
    full = ret[0];
    first = _.map(ret[0], '0');
    for (let i = 1; i < ret.length; i++) {
      const candidate = ret[i];
      const fulltemp  = [];
      const firsttemp = [];
      for (let j = 0; j < full.length; j++) {
        for (let k = 0; k < candidate.length; k++) {
          fulltemp.push(full[j] + candidate[k]);
          firsttemp.push(first[j] + candidate[k][0]);
        }
      }
      full = fulltemp;
      first = firsttemp;
    }
  }
  return { full, first };
}
