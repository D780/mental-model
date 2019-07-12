/**
 * cache 事务处理类
 */
'use strict';

const funcMap = require('./cache-func');

const CLIENT = Symbol('CACHE#Client');
const QUEUE = Symbol('CACHE#Queue');
const BUILD = Symbol('CACHE#Build');

class CacheMulti {
  constructor(client) {
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
          if (funcMap[key].stringify) {
            try {
              arguments[funcMap[key].stringify - 1] = JSON.stringify(arguments[funcMap[key].stringify - 1]);
            } catch (err) {
              throw err;
            }
          }
          client[key](...arguments);
          queue.push([key]);
          return this;
        };
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
      let reti = [];
      for (let j = 0; j < this[QUEUE][i].length; j++) {
        const action = this[QUEUE][i][j];
        let retij = execRet.shift();
        if (!retij[0] && funcMap[action].parse) {
          let values = retij[1];
          if (funcMap[action].parse === 'value') {
            values = JSON.parse(values);
          } else if (funcMap[action].parse === 'list') {
            // eslint-disable-next-line max-depth
            for (let k = 0; k < values.length; k++) {
              values[k] = JSON.parse(values[k]);
            }
          }
          retij[1] = values;
        }
        if (retij[0]) {
          errors.errorList.push();
          errors.count++;
        }
        retij = retij[0] || retij[1];
        reti.push(retij);
      }
      if (reti.length === 1) {
        reti = reti[0];
      }
      ret.push(reti);
    }
    return [errors.count ? errors : null, ret];
  }
}

module.exports = CacheMulti;
