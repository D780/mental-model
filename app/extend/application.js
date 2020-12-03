'use strict';

module.exports = {
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
};
