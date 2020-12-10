'use strict';

const moment = require('moment');
const excel = require('../../utils/excel');

// 格式化时间
exports.formatTime = time => moment(time).format('YYYY-MM-DD hh:mm:ss');

module.exports = {
  excel,
  moment,
  formatTime(time) {
    return moment(time).format('YYYY-MM-DD hh:mm:ss');
  },

  get jsZip() {
    return new this.app.JSZip();
  },

  /**
   * ### 等待毫秒时间（sleep）
   *
   * @name delay
   * @mtehod Helper#delay
   *
   * @param {number} [ms=0] 延迟毫秒数
   *
   * @returns {Promise<1>}
   *
   * @test { argument: [ 100 ], respText: 'done' }
   */
  async delay(ms) {
    ms = ms || 0;
    return await new Promise(resolve => {
      setTimeout(() => {
        resolve(1);
      }, ms);
    });
  },
};
