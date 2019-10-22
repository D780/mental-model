/**
 * @author 780
 *
 * @Date 2017/3/8
 */

'use strict';

/* eslint-disable no-shadow */
const fs      = require('fs-extra');
const path    = require('path');
const _       = require('lodash');
const crypto  = require('crypto');
const md5salt = require('apache-md5');
const moment  = require('moment');
const uuid    = require('uuid');
const ipaddr  = require('ipaddr.js');
const os      = require('os');
const pinyin  = require('pinyin');
/* eslint-enable no-shadow */

module.exports = {
  objectStringify,
  stringObjectify,
  JSONReplacer,
  JSONReviver,
  symbolObjectStringify,
  symbolStringObjectify,
  getObjectSymbolKey,
  getObjectSymbolKeys,
  getObjectSymbol,
  getObjectSymbols,
  md5,
  md5File,
  moment,
  md5salt,
  uuid,
  base64Encode,
  base64Decode,
  htmlEncode,
  htmlDecode,
  bkdrHash,
  toJSON,
  ip624,
  getReqIp,
  getIp,
  getPinyin,
};

/**
 * 对象字符串化
 *
 * @param {Object} obj    输入对象
 * @param {Function} [replacer] replacer
 * @param {Number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {Number} [prefixIndent]   缩进修正值 默认0（即整体左测修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {String}
 */
function objectStringify(obj, replacer, indent, prefixIndent) {
  if (!obj) {
    return obj;
  }

  let ret;
  if (indent >= 1) {
    ret = JSON.stringify(obj, replacer, indent)
      .replace(/"([^"]+)"(\s*:\s*)/g, '$1$2')
      .replace(/"/g, '\'');
  } else {
    ret = JSON.stringify(obj, replacer)
      .replace(/"([^"]+)"(\s*:\s*)/g, '$1$2 ')
      .replace(/,/g, ', ')
      .replace(/:\{/g, ': {')
      .replace(/\{/g, '{ ')
      .replace(/\}/g, ' }')
      .replace(/\{\s\s\}/g, '{}')
      .replace(/"/g, '\'');
  }
  if (prefixIndent >= 1) {
    const spaces = new Array(prefixIndent + 1).join(' ');
    ret = spaces + ret.replace(/\n/g, `\n${spaces}`);
  }
  return ret;
}

/**
 * 字符串对象化 (对类 JSON 格式字符串 转换成相应对象)
 *
 * @param {String} str    输入字符攒
 * @param {Function} [reviver] reviver
 * @returns {Object}
 */
function stringObjectify(str, reviver) {
  if (!str) {
    return str;
  }

  const json = str.replace(/'/g, '"')
    .replace(/(\w[^\s:"]+)(\s*:\s*)/g, '"$1"$2')
    .replace(/,\s*"\w[^"]+"\s*:\s*undefined/g, '')
    .replace(/"\w[^"]+"\s*:\s*undefined\s*,/g, '');
  let ret = {};
  try {
    ret = JSON.parse(json, reviver);
  } catch (e) {
    // eslint-keep
  }
  return ret;
}

/**
 * JSON 的 replacer 插件
 * 增加对 function regexp 的支持
 *
 * @param {*} key   键
 * @param {*} value 值
 * @returns {*}
 */
function JSONReplacer(key, value) {
  if (value instanceof RegExp) {
    return `[REGEXP]${value.toString()}`;
  }
  if (value instanceof Function) {
    return `[FUNCTION]${value.toString()}`;
  }
  if (value instanceof Date) {
    return `[DATE]${value.toString()}`;
  }
  return value;
}

/**
 * JSON 的 reviver 插件
 * 增加对 function regexp 的支持
 *
 * @param {*} key   键
 * @param {*} value 值
 * @returns {*}
 */
function JSONReviver(key, value) {
  if (typeof value === 'string' && value.indexOf('[REGEXP]') === 0) {
    const [, regexp, option] = value.replace('[REGEXP]', '').split('/');
    return new RegExp(regexp, option);
  }
  if (typeof value === 'string' && value.indexOf('[FUNCTION]') === 0) {
    const functionBody = value.replace('[FUNCTION]', '');
    /* eslint-disable no-new-func */
    return new Function(`return (${functionBody})(...arguments)`);
    /* eslint-enable no-new-func */
  }
  if (typeof value === 'string' && value.indexOf('[DATE]') === 0) {
    const dateString = value.replace('[DATE]', '');
    return new Date(dateString);
  }
  return value;
}

/**
 * 对象字符串化(支持 symbol)
 * objectStringify extra
 *
 * @param {Object} obj    输入对象
 * @param {Function} [replacer] replacer
 * @param {Number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {Number} [prefixIndent]   缩进修正值 默认0（即整体左测修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {String}
 */
function symbolObjectStringify(obj, replacer, indent, prefixIndent) {
  if (!obj) {
    return obj;
  }

  function mapKeysDeep(o) {
    if (Array.isArray(o)) {
      const ret = [];
      _.map(o, i => {
        ret.push(mapKeysDeep(i));
      });
      return ret;
    }
    if (typeof o === 'object') {
      const keys = Reflect.ownKeys(o);
      const ret = {};
      _.map(keys, key => {
        ret[key.toString()] = mapKeysDeep(o[key]);
      });
      return ret;
    }
    return typeof o === 'symbol' ? o.toString() : o;
  }

  return objectStringify(mapKeysDeep(obj), replacer, indent, prefixIndent);
}

/**
 * 字符串对象化(支持 symbol) (对类 JSON 格式字符串 转换成相应对象)
 * stringObjectify extra
 *
 * @param {String} str    输入字符攒
 * @param {Function} [reviver] reviver
 * @returns {Object}
 */
function symbolStringObjectify(str, reviver) {
  if (!str) {
    return str;
  }

  function mapKeysDeep(o) {
    if (Array.isArray(o)) {
      const ret = [];
      _.map(o, i => {
        ret.push(mapKeysDeep(i));
      });
      return ret;
    }
    if (typeof o === 'object') {
      const keys = Reflect.ownKeys(o);
      const ret = {};
      _.map(keys, key => {
        const m = key.match(/^Symbol\(([^)]+)\)$/);
        if (m && m[1]) {
          ret[Symbol(m[1])] = mapKeysDeep(o[key]);
        } else {
          ret[key] = mapKeysDeep(o[key]);
        }
      });
      return ret;
    }
    if (typeof o === 'string') {
      const m = o.match(/^Symbol\(([^)]+)\)$/);
      if (m && m[1]) {
        return Symbol(m[1]);
      }
    }
    return o;
  }

  const obj = stringObjectify(str, reviver);
  return mapKeysDeep(obj);
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
 * 计算字符串 md5 值
 * @param {String} content
 * @returns {*}
 */
function md5(content) {
  const buf = Buffer.from(content);
  const str = buf.toString('binary');
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(str);
  const hash = md5Hash.digest('hex');
  return hash;
}

/**
 * 计算文件 md5 值(支持文件夹)
 * @param {String} filePath 文件路径
 * @param {Number} type   返回格式，可选 [1,2,3]
 *                        1 返回为一个 MD5 (文件夹 MD5 由文件夹 下所有文件 MD5 使用下划线连接再进行一次 MD5 得到)
 *                        2 返回为一个文件 MD5值 映射表，每个文件按平级列出
 *                        3 返回为一个文件 MD5值 映射表，文件按原有的树级结构列出
 * @returns {*}
 */
function md5File(filePath, type) {
  type = Number(type) || 1;
  if (type > 3 || type < 1) {
    type = 1;
  }
  const stat = fs.statSync(filePath);
  let str;
  let ret = {};
  if (stat.isDirectory()) {
    // 文件夹
    let fileList = fs.readdirSync(filePath);
    fileList = _.sortBy(fileList);
    if (type === 1) {
      const strList = [];
      _.map(fileList, item => {
        strList.push(md5File(path.join(filePath, item), 1));
      });
      str = strList.join('_');
      str = md5(str);
    } else if (type === 2) {
      _.map(fileList, item => {
        ret = { ...ret, ... md5File(path.join(filePath, item), 2) };
      });
    } else {
      ret[path.basename(filePath)] = {};
      _.map(fileList, item => {
        ret[path.basename(filePath)] = { ...ret[path.basename(filePath)], ...md5File(path.join(filePath, item), 3) };
      });
    }
  } else {
    // 普通文件
    /* eslint-disable-next-line no-lonely-if */
    if (type === 1) {
      str = md5(fs.readFileSync(filePath));
    } else if (type === 2) {
      ret[filePath] = md5(fs.readFileSync(filePath));
    } else {
      ret[path.basename(filePath)] = md5(fs.readFileSync(filePath));
    }
  }
  if (type === 1) {
    return str;
  } if (type === 2) {
    return ret;
  }
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
 * html 编码
 * @param {String} str
 * @returns {*}
 */
function htmlEncode(str) {
  return str.replace(/[<>&"]/g, function(c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
}

/**
 * html 解码
 * @param {String} str
 * @returns {*}
 */
function htmlDecode(str) {
  const arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
  return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) { return arrEntities[t]; });
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
