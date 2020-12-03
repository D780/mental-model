/**
 * cache 事务处理类
 */
'use strict';
/* eslint-disable max-depth */

const IORedis = require('ioredis');

const funcMap = require('./cache-func');
const utils = require('./utils');

const CLIENT = Symbol('CACHE#Client');
const QUEUE = Symbol('CACHE#Queue');
const BUILD = Symbol('CACHE#Build');

class CacheMulti {
  constructor(client) {
    if (!(client instanceof IORedis)) {
      client = new IORedis(...arguments);
    }
    this[CLIENT] = client.multi();
    this[QUEUE] = [];

    this[BUILD]();
  }

  /**
   * 以 funcMap 定义的方法为准，构造相应的操作方法
   * @memberof CacheMulti
   */
  [BUILD]() {
    const client = this[CLIENT];
    const queue = this[QUEUE];
    for (const key in this[CLIENT]) {
      if (funcMap[key]) {
        this[key] = function() {
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
          client[key](...args);
          queue.push([key, args]);
          return this;
        };
      // } else if (typeof this[CLIENT][key] === 'function') {
      //   // this[key] = this[CLIENT][key].bind(this[CLIENT]);
      // } else {
      //   this[key] = this[CLIENT][key];
      }
    }
  }

  /**
   * 事务执行
   *
   * @returns
   * @memberof CacheMulti
   */
  async exec() {
    const execRet = await this[CLIENT].exec();
    const ret = [];
    const errors = { errorList: [], count: 0 };
    for (let i = 0; i < this[QUEUE].length; i++) {
      const [action, args] = this[QUEUE][i];
      let reti = execRet.shift();
      if (!reti[0] && funcMap[action].parse) {
        let values = reti[1];
        if (funcMap[action].parse === 'value') {
          if (utils.isJSON(values)) {
            values = JSON.parse(values);
          }
        } else if (funcMap[action].parse === 'list') {
          let offset = funcMap[action].defaultParseOffset || 0;
          let step  = funcMap[action].defaultParseStep || 1;
          if (Array.prototype.indexOf.call(args, funcMap[action].parseCheck) >= 0) {
            offset = funcMap[action].parseOffset;
            step = funcMap[action].parseStep;
          }
          for (let k = offset; k < values.length; k += step) {
            if (utils.isJSON(values[k])) {
              values[k] = JSON.parse(values[k]);
            }
          }
        } else if (funcMap[action].parse === 'object') {
          // hgetset
          for (const k in values) {
            if (utils.isJSON(values[k])) {
              values[k] = JSON.parse(values[k]);
            }
          }
        }
        reti[1] = values;
      }
      if (reti[0]) {
        errors.errorList.push(reti[0]);
        errors.count++;
      }
      reti = reti[0] || reti[1];
      ret.push(reti);
    }
    return [errors.count ? errors : null, ret];
  }
}

module.exports = CacheMulti;
