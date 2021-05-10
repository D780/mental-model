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
const md5File = require('md5-file');
const moment  = require('moment');
const uuid    = require('uuid');
const ipaddr  = require('ipaddr.js');
const os      = require('os');
const pinyin  = require('pinyin');
/* eslint-enable no-shadow */

module.exports = {
  objectCodify,
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
  md5File: md5File.sync,
  md5Directory,
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
 * @param {number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {number} [prefixIndent]   缩进修正值 默认0（即整体左侧修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {string}
 */
function objectStringify(obj, replacer, indent, prefixIndent) {
  if (!obj) {
    return obj;
  }

  let ret;
  if (indent >= 1) {
    ret = JSON.stringify(obj, replacer, indent);
  } else {
    ret = JSON.stringify(obj, replacer, 2)
      .replace(/\[ *\n */g, '[')
      .replace(/ *\n *\]/g, ']')
      .replace(/ *\n */g, ' ');
  }
  const map = {};
  // 先匹配出字符串键值对，将字符串替换成随机串标记起来，然后处理其他情况，最后再吧标记的随机串替换回原字符串
  // 因为现实字符串使用单引号，所以原字符串需要进行一层处理 replace(/\'/g, '\\\'').replace(/\\\"/g, '\"')
  ret = ret
    // 匹配值为字符串的键值对 "xxx-:-xxx": "XXXXX"
    .replace(/"((?:(?!(?<!\\)").)+)"( *: *)"((?:(?!(?<!\\)").)*)"( *[,\}\r\n])/g, ($, $1, $2, $3, $4) => {
      $3 = $3 || '';
      const oriStr = $3.replace(/\\\"/g, '\"').replace(/\\\\/g, '\\').replace(/\'/g, '\\\'');
      const sk = randomKeyMap(map, {
        source: $3,
        target: oriStr,
        quotes: ['"', '"'],
      });
      if (!/^\w+$/.test($1)) {
        $1 = `'${$1}'`;
      }
      return `${$1}${$2}'[[[---REPLACE${sk}---]]]'${$4}`;
    })
    // 匹配所有字符串，并取其中的数组中的字符串进行处理
    // eslint-disable-next-line max-params
    .replace(/(?<=[,\[\r\n] *)(?<q>'|")((?:(?!(?<!\\)\k<q>).)*)\k<q> *( *[,\]\r\n])/g, ($, $1, $2, $3, $4, $5, $6) => {
      if ($3 === ':') {
        return $;
      }
      $2 = $2 || '';
      const q = $6.q;
      const m = $.match(new RegExp(`(?<!\\\\)${q}`, 'g'));
      if (!m || m.length !== 2) {
        return $;
      }
      // let oriStr = $2;
      // if (q === '\"') {
      const oriStr = $2.replace(/\\\"/g, '\"').replace(/\\\\/g, '\\').replace(/\'/g, '\\\'');
      // }
      const sk = randomKeyMap(map, {
        source: $2,
        target: oriStr,
        quotes: [q || ''],
      });
      return `'[[[---REPLACE${sk}---]]]'${$3}`;
    })
    // 匹配其余键
    .replace(/"((?:(?!(?<!\\)").)+)"( *: *)(?!'|")/g, ($, $1, $2) => {
      if (/^\w+$/.test($1)) {
        return `${$1}${$2}`;
      }
      return `'${$1}'${$2}`;
    });
  // 解构保护的字符串值
  while (/\[\[\[---REPLACE(\d+)---\]\]\]/.test(ret)) {
    ret = ret.replace(/\[\[\[---REPLACE(\d+)---\]\]\]/g, ($, $1) => map[$1].target);
  }
  if (prefixIndent >= 1) {
    const spaces = new Array(prefixIndent + 1).join(' ');
    ret = spaces + ret.replace(/\n/g, `\n${spaces}`);
  }
  return ret;
}

/**
 * 对象代码字符串化
 *
 * 基于 objectStringify 对特殊对象进行处理
 * 该过程不可逆，不能再正常的通过 stringObjectify 还原回对象，不过 stringObjectify 内置处理可以将大部分此类代码字符串转回对象
 *
 * @param {Object} obj    输入对象
 * @param {number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {number} [prefixIndent]   缩进修正值 默认0（即整体左侧修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {string}
 */
function objectCodify(obj, indent, prefixIndent) {
  const str = objectStringify(obj, JSONReplacer, indent, prefixIndent);
  return str.replace(/'(?<t>\[REGEXP\]|\[FUNCTION\]|\[DATE\])(.*?)\k<t>'/g, ($, $1, $2) => {
    return $2.replace(/\\\'/g, '\'');
  });
}

/**
 * 字符串对象化 (对类 JSON 格式字符串 转换成相应对象)
 *
 * @param {string} str    输入字符串
 * @param {Function} [reviver] reviver
 * @returns {Object}
 */
function stringObjectify(str, reviver) {
  if (!str) {
    return str;
  }
  const map = {};
  let json = str.replace(/ *\n */g, '')
    // 匹配值为字符串的键值对 key: 'value' | "special-:-key": "value" | 'key': "value"
    // eslint-disable-next-line max-params
    .replace(/(?:(\w+)|(?<q>'|")((?:(?!(?<!\\)\k<q>).)+)\k<q>)( *: *)(?<q2>'|")((?:(?!(?<!\\)\k<q2>).)*)\k<q2>/g, ($, $1, $2, $3, $4, $5, $6, $7, $8, $9) => {
      // const oriStr = $6.replace(/\\\'/g, '\'').replace(/\\/g, '\\\\').replace(/\"/g, '\\\"');
      $6 = $6 || '';
      const q2 = $9.q2;
      let oriStr = $6;
      if (q2 === '\'') {
        oriStr = $6.replace(/\\\'/g, '\'').replace(/\\/g, '\\\\').replace(/\"/g, '\\\"');
      }
      const sk = randomKeyMap(map, {
        source: $6,
        target: oriStr,
        quotes: [$9.q || '', $9.q2 || ''],
      });
      const key = $1 || $3;
      return `"${key}"${$4}"[[[---REPLACE${sk}---]]]"`;
    })
    // 匹配所有字符串，并取其中的数组中的字符串进行处理
    // eslint-disable-next-line max-params
    .replace(/(?<=[,\[\r\n] *)(?<q>'|")((?:(?!(?<!\\)\k<q>).)+)\k<q>( *[,\]\r\n])/g, ($, $1, $2, $3, $4, $5, $6) => {
      if ($3 === ':') {
        return $;
      }
      // 如果匹配串中含有 [[[---REPLACE${sk}---]]] 串，则先还原（说明有 对象字符串值 与 数组字符串值 嵌套的情况）
      $2 = $2 || '';
      let $$$ = `"${$2}"`;
      // 断言：出现该情况的条件是字符串中 含有对象的写法，并且键值对中值使用了双引号包裹
      while (/\[\[\[---REPLACE(\d+)---\]\]\]/.test($$$)) {
        $$$ = $$$.replace(/"((?:(?!(?<!\\)").)+)"( *: *)"\[\[\[---REPLACE(\d+)---\]\]\]"/g, ($$, $$1, $$2, $$3) =>
          `${map[$$3].quotes[0]}${$$1}${map[$$3].quotes[0]}${$$2}${map[$$3].quotes[1]}${map[$$3].source}${map[$$3].quotes[1]}`);
      }
      $2 = $$$.slice(1, -1);
      const q = $6.q;
      const m = $.match(new RegExp(`(?<!\\\\)${q}`, 'g'));
      if (!m || m.length !== 2) {
        return $;
      }
      let oriStr = $2;
      if (q === '\'') {
        oriStr = $2.replace(/\\\'/g, '\'').replace(/\\/g, '\\\\').replace(/\"/g, '\\\"');
      }
      const sk = randomKeyMap(map, {
        source: $2,
        target: oriStr,
        quotes: [q || ''],
      });
      return `"[[[---REPLACE${sk}---]]]"${$3}`;
    })
    // 匹配其余键
    .replace(/(?:(\w+)|(?<q>'|")((?:(?!(?<!\\)\k<q>).)+)\k<q>)( *: *)(?!'|")/g, ($, $1, $2, $3, $4) => {
      const key = $1 || $3;
      return `"${key}"${$4}`;
    })
    // 兼容 undefined 的值
    .replace(/, *(\w+) *: *undefined/g, '')
    .replace(/(\w+) *: *undefined *,/g, '');
  // 解构保护的字符串值
  while (/\[\[\[---REPLACE(\d+)---\]\]\]/.test(json)) {
    json = json.replace(/\[\[\[---REPLACE(\d+)---\]\]\]/g, ($, $1) => map[$1].target);
  }
  let ret = {};
  try {
    ret = JSON.parse(json, reviver);
  } catch (e) {
    // 如果 JSON 转换失败，尝试使用 new Function 转换，若依然失败则返回空对象
    try {
      // eslint-disable-next-line no-new-func
      ret = (new Function(`return ${str}`))();
      if (reviver) {
        applyReviver(ret, reviver);
      }
    } catch (e2) {
      /* eslint-keep */
      ret = {};
    }
  }
  return ret;
}

/**
 * 随机映射
 * @param {Object} keymap 映射表
 * @param {*} data 数据
 *
 * @returns {string} 映射表 Key
 */
function randomKeyMap(keymap, data) {
  let sk = _.random(1, 999999999999999);
  let flag = false;
  do {
    if (_.isUndefined(keymap[sk])) {
      keymap[sk] = data;
      flag = true;
    } else {
      sk = _.random(1, 999999999999999);
    }
  }
  while (!flag && _.keys(keymap).length < 100000000000);
  return sk;
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
    return `[REGEXP]${value.toString()}[REGEXP]`;
  }
  if (value instanceof Function) {
    return `[FUNCTION]${value.toString().replace(/function anonymous\(\n\) \{\nreturn \((.*)\)\(...arguments\)\n\}/g, '$1')}[FUNCTION]`;
  }
  if (value instanceof Date) {
    return `[DATE]${value.toString()}[DATE]`;
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
    const [, regexp, option] = value.replace(/\[REGEXP\](.*?)\[REGEXP\]/g, '$1').split(/(?<!\\)\//);
    return new RegExp(regexp, option);
  }
  if (typeof value === 'string' && value.indexOf('[FUNCTION]') === 0) {
    const functionBody = value.replace(/\[FUNCTION\](.*?)\[FUNCTION\]/g, '$1');
    /* eslint-disable no-new-func */
    return new Function(`return (${functionBody})(...arguments)`);
    /* eslint-enable no-new-func */
  }
  if (typeof value === 'string' && value.indexOf('[DATE]') === 0) {
    const dateString = value.replace(/\[DATE\](.*?)\[DATE\]/g, '$1');
    return new Date(dateString);
  }
  return value;
}

/**
 * 普通对象应用 JSON 的 reviver 插件
 *
 * @param {Object} obj 对象
 * @param {reviver} reviver 插件方法
 */
function applyReviver(obj, reviver) {
  _.map(obj, (val, key) => {
    if (typeof val === 'object') {
      obj[key] = applyReviver(val, reviver);
    } else {
      obj[key] = reviver(key, val);
    }
  });
}

/**
 * html 编码
 * @param {string} str 源串
 * @returns {*}
 */
function htmlEncode(str) {
  return str.replace(/[<>&"]/g, function(c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
}

/**
 * html 解码
 * @param {string} str 源串
 * @returns {*}
 */
function htmlDecode(str) {
  const arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
  return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function(all, t) { return arrEntities[t]; });
}

/**
 * 对象字符串化(支持 symbol)
 * objectStringify extra
 *
 * @param {Object} obj    输入对象
 * @param {Function} [replacer] replacer
 * @param {number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {number} [prefixIndent]   缩进修正值 默认0（即整体左侧修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {string}
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
 * @param {string} str    输入字符串
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
 * @param {string} key symbol.toString()的值
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
 * @param {string} key symbol.toString()的值
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
 * @param {string} content -
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
 * @param {string} filePath 文件路径
 * @param {number} type   返回格式，可选 [1,2,3]
 *                        1 返回为一个 MD5 (文件夹 MD5 由文件夹 下所有文件 MD5 使用下划线连接再进行一次 MD5 得到)
 *                        2 返回为一个文件 MD5值 映射表，每个文件按平级列出
 *                        3 返回为一个文件 MD5值 映射表，文件按原有的树级结构列出
 * @returns {*}
 */
function md5Directory(filePath, type) {
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
        strList.push(md5Directory(path.join(filePath, item), 1));
      });
      str = strList.join('_');
      str = md5(str);
    } else if (type === 2) {
      _.map(fileList, item => {
        ret = { ...ret, ... md5Directory(path.join(filePath, item), 2) };
      });
    } else {
      ret[path.basename(filePath)] = {};
      _.map(fileList, item => {
        ret[path.basename(filePath)] = { ...ret[path.basename(filePath)], ...md5Directory(path.join(filePath, item), 3) };
      });
    }
  } else {
    // 普通文件
    /* eslint-disable-next-line no-lonely-if */
    if (type === 1) {
      str = md5File.sync(filePath);
    } else if (type === 2) {
      ret[filePath] = md5File.sync(filePath);
    } else {
      ret[path.basename(filePath)] = md5File.sync(filePath);
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
 * @param {string} data -
 * @returns {string}
 */
function base64Encode(data) {
  return new Buffer(data).toString('base64');
}

/**
 * base64解码
 * @param {string} data -
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
 * @param {string} str -
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
 * @param {*}       data -
 * @param {boolean} plain -
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
 * @param {string} ip -
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
 * @param {Request} req -
 * @returns {*}
 */
function getReqIp(req) {
  return ip624(
    req.headers['x-real-ip']
    || (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(/, ?/)[0])
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
