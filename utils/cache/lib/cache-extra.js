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
};
