'use strict';

const chalk = require('chalk');

/**
 * agent entry
 * @param {EGG.Agent} agent
 */
module.exports = async agent => {
  agent.model.log = function() {
    if (this.options.logging === false) { return; }
    const args = Array.prototype.slice.call(arguments);
    const sql  = args[0].replace(/Executed \((.+?)\):\s{0,1}/, ($, $1) => {
      if ($1 === 'default') {
        return '';
      }
      // 将 sql 语句中标识事务的 uuid 转成一个(伪)唯一短串，方便日志显示
      // 这里我们并不需要弄成全局唯一，只要短时间内不重复即可，
      // 目前处理方式：按4位分段截取每项的第三位
      // c6d6 5e89-4da2-4783-b977-efa2 996f f459
      // 4d12 d152-045f-40b5-af9d-d501 7dd0 5025
      // 544c 2b18-6a88-4958-ae9f-cc03 55ba c9fe
      $1 = $1.replace(/-/g, '');
      $1 = $1.replace(/(\w{4})/g, (s$, s$1) => {
        return s$1[2];
      });
      return `(${$1}) : `;
    });
    agent.logger.info('[Agent]', '[model]', chalk.magenta(sql), `(${args[1]}ms)`);
  };
  agent.beforeStart(async () => {
    await agent.model.sync({ force: agent.config.env === 'unittest' });
  });
};
