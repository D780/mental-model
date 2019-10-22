'use strict';

const path  = require('path');
const chalk = require('chalk');

const utils = require('./utils');
const excel = require('./utils/excel');
const JSZip = require('./utils/jszip-extra');
const Cache = require('./utils/cache');
const SequelizeCache = require('./utils/sequelize-cache');
const ErrorTraceLogger = require('./utils/error_trace_logger');

/**
 * app entry
 * @param {Egg.Application} app
 */
module.exports = async app => {
  app.config.coreMiddleware.unshift('accessLogger');
  app.config.coreMiddleware.push('responseWrapper');
  app.config.coreMiddleware.unshift('gzip');

  app.utils = utils;
  app.excel = excel;
  app.JSZip = JSZip;
  app.cache = new Cache(app.redis.get('cache'));
  app.session = new Cache(app.redis.get('session'));
  app.errorTraceLogger = new ErrorTraceLogger(app.logger, { maxLength: 200 });
  SequelizeCache(app.Sequelize, app.cache);

  app.model.log = function() {
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
    if (app.config.env === 'prod') {
      app.logger.info('[model]', chalk.magenta(sql), `(${args[1]}ms)`);
    }
    app.errorTraceLogger.info('[model]', chalk.magenta(sql), `(${args[1]}ms)`);
  };
  app.JSZip.push('ddd');

  // 调整 router 加载顺序，先 app/router.js, 再是 app/route/**.js
  app.loader.loadRouter = function() {
    this.timing.start('Load Router');
    this.loadFile(this.resolveModule(path.join(app.baseDir, 'app/router.js')));
    new app.loader.FileLoader({
      directory: path.join(app.baseDir, 'app/router'),
      target   : {},
      inject   : app,
      call     : true,
    }).load();
    this.timing.end('Load Router');
  };

  app.ready(() => {
    app.logger.info(`[${app.config.web.name}] is running!`);
    // app.errorTraceLogger.output();
  });

  app.on('error', async (err, ctx) => {
    app.errorTraceLogger.output();
  });
};
