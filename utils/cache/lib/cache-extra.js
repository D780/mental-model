/* eslint-disable valid-jsdoc */
/**
 * 额外提供的方法（基于 Redis 操作提供的常用方法）
 */
'use strict';

module.exports = Cache => {
  /**
   * 批量删除
   * @param {String} pattern 搜索通配符
   * @returns
   */
  Cache.prototype.mdel = async function mdel(pattern) {
    const keys = await this.keys(pattern);
    if (keys.length) {
      return await this.del(...keys);
    }
    return 0;
  };

  /**
   * hash 版的 GETSET
   *
   * HGETSET hash field value
   * @param {String} hash  哈希键名
   * @param {String} field 键名
   * @param {any}    value 键值
   * @returns {any} 返回给定域的旧值。
   */
  Cache.prototype.hgetset = async function mdel(hash, field, value) {
    this.watch(hash);
    const ret = await this.multi()
      .hget(hash, field)
      .hset(hash, field, value)
      .exec();
    if (ret[0]) {
      throw new Error(ret[0]);
    } else {
      return ret[1][0];
    }
  };
};
