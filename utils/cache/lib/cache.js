
/**
 * 一个 Redis 方法的封装
 * 与原生 Redis 主要的不同是 所有数据在进出相应数据结构时分别会进行 JSON.stringify 和 JSON.parse 处理
 */
/* eslint-disable max-depth */
'use strict';

const CacheMulti = require('./cache-multi');
const funcMap = require('./cache-func');
const utils = require('./utils');

// eslint-disable-next-line no-shadow
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const IORedis = require('ioredis');

const CLIENT = Symbol('CACHE#Client');
const TRANSATION = Symbol('CACHE#Transation');
const BUILD = Symbol('CACHE#Build');

class Cache {
  constructor(client) {
    if (!(client instanceof IORedis)) {
      client = new IORedis(...arguments);
    }
    this[CLIENT] = client;
    this[TRANSATION] = {};

    this[BUILD]();
  }

  /**
   * 以 funcMap 定义的方法为准，构造相应的操作方法
   * @memberof CacheMulti
   */
  [BUILD]() {
    const client = this[CLIENT];
    for (const key in this[CLIENT]) {
      if (funcMap[key]) {
        this[key] = async function() {
          let args = arguments;
          if (funcMap[key].convertMap) {
            const convertIdx = funcMap[key].convertMap - 1;
            if (typeof Map !== 'undefined' && args[convertIdx] instanceof Map) {
              if (convertIdx === 0) {
                args = utils.convertMapToArray(args[convertIdx]);
              } else {
                args = Array.prototype.slice.call(args, 0, convertIdx)
                  .concat(utils.convertMapToArray(args[convertIdx]));
              }
            }
          }
          if (funcMap[key].convertObject) {
            const convertIdx = funcMap[key].convertObject - 1;
            if (typeof args[convertIdx] === 'object' && args[convertIdx] !== null) {
              if (convertIdx === 0) {
                args = utils.convertObjectToArray(args[convertIdx]);
              } else {
                args = Array.prototype.slice.call(args, 0, convertIdx)
                  .concat(utils.convertObjectToArray(args[convertIdx]));
              }
            }
          }
          if (funcMap[key].stringify) {
            let stringifyList = funcMap[key].stringify;
            if (!Array.isArray(stringifyList)) {
              stringifyList = [stringifyList];
            }
            for (let i = 0; i < stringifyList.length; i += 1) {
              if (typeof args[stringifyList[i] - 1] !== 'string') {
                args[stringifyList[i] - 1] = JSON.stringify(args[stringifyList[i] - 1]);
              }
            }
            if (funcMap[key].multi) {
              const lastDefinedStringify = stringifyList[stringifyList.length - 1];
              const step = funcMap[key].step || 1;
              for (let i = lastDefinedStringify - 1 + step; i < args.length; i += step) {
                if (typeof args[i] !== 'string') {
                  args[i] = JSON.stringify(args[i]);
                }
              }
            }
          }
          let ret = await client[key](...args);
          if (funcMap[key].parse) {
            if (funcMap[key].parse === 'value') {
              if (utils.isJSON(ret) || ret === 'null') {
                ret = JSON.parse(ret);
              }
            } else if (funcMap[key].parse === 'list') {
              let offset = funcMap[key].defaultParseOffset || 0;
              let step  = funcMap[key].defaultParseStep || 1;
              if (Array.prototype.indexOf.call(args, funcMap[key].parseCheck) >= 0) {
                offset = funcMap[key].parseOffset;
                step = funcMap[key].parseStep;
              }
              for (let i = offset; i < ret.length; i += step) {
                if (utils.isJSON(ret[i]) || ret === 'null') {
                  ret[i] = JSON.parse(ret[i]);
                }
              }
            } else if (funcMap[key].parse === 'object') {
              // hgetset
              for (const k in ret) {
                if (utils.isJSON(ret[k])) {
                  ret[k] = JSON.parse(ret[k]);
                }
              }
            }
          }
          return ret;
        };
      // } else if (typeof this[CLIENT][key] === 'function') {
      //   // this[key] = this[CLIENT][key].bind(this[CLIENT]);
      // } else {
      //   this[key] = this[CLIENT][key];
      }
    }
  }

  /**
   * 事务操作
   *
   * @returns
   * @memberof Cache
   */
  multi() {
    const transation = uuid.v4().replace(/-/g, '');
    this[TRANSATION][transation] = new CacheMulti(this[CLIENT]);
    return this[TRANSATION][transation];
  }
}

if (fs.existsSync(path.join(__dirname, './cache-extra.js'))) {
  // eslint-disable-next-line global-require
  require('./cache-extra')(Cache);
}

module.exports = Cache;
