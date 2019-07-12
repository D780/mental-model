/**
 * 一个 Redis 方法的封装
 * 与原生 Redis 主要的不同是 所有数据在进出相应数据结构时分别会进行 JSON.stringify 和 JSON.parse 处理
 */
'use strict';

const CacheMulti = require('./cache-multi');
const funcMap = require('./cache-func');

// eslint-disable-next-line no-shadow
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const CLIENT = Symbol('CACHE#Client');
const TRANSATION = Symbol('CACHE#Transation');
const BUILD = Symbol('CACHE#Build');

class Cache {
  constructor(client) {
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
          if (funcMap[key].stringify) {
            try {
              if (funcMap[key].multi) {
                for (let i = funcMap[key].stringify - 1; i < arguments.length; i++) {
                  arguments[i] = JSON.stringify(arguments[i]);
                }
              } else {
                arguments[funcMap[key].stringify - 1] = JSON.stringify(arguments[funcMap[key].stringify - 1]);
              }
            } catch (err) {
              throw err;
            }
          }
          let ret = await client[key](...arguments);
          if (funcMap[key].parse) {
            try {
              if (funcMap[key].parse === 'value') {
                ret = JSON.parse(ret);
              } else if (funcMap[key].parse === 'list') {
                for (let i = 0; i < ret.length; i++) {
                  ret[i] = JSON.parse(ret[i]);
                }
              }
            } catch (err) {
              throw err;
            }
          }
          return ret;
        };
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
