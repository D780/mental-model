'use strict';

const path  = require('path');

const SequelizeCache = require('./utils/sequelize-cache');
const SequelizeLogger = require('./utils/sequelize-logger');
const ErrorTraceLogger = require('./utils/error_trace_logger');

class AppBootHook {
  /**
   * @param {Egg.Application} app - application
   */
  constructor(app) {
    this.app = app;
  }

  configWillLoad() {
    const { app } = this;
    app.config.coreMiddleware.unshift('accessLogger');
    app.config.coreMiddleware.push('responseWrapper');
    app.config.coreMiddleware.unshift('gzip');

    if (app.config.sequelize) {
      if (app.config.sequelize.logging || app.config.sequelize.logging === undefined) {
        app.config.sequelize.logging = SequelizeLogger(app);
      }
    }
  }

  async didReady() {
    const { app } = this;
    app.cache = new app.Cache(app.redis.get('cache'));
    app.session = new app.Cache(app.redis.get('session'));
    app.errorTraceLogger = new ErrorTraceLogger(app.logger, { maxLength: 200 });
    SequelizeCache(app.Sequelize, app.cache);

    app.logger.info(`[${app.config.web.name}] is running!`);

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

    app.on('error', async (err, ctx) => {
      app.errorTraceLogger.output();
    });
  }
}

module.exports = AppBootHook;
