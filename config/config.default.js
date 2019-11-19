'use strict';

const os = require('os');
const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo
 * @returns Egg.EggAppConfig
 */
module.exports = appInfo => {
  /**
   * egg|插件|框架 配置
   * @type {Egg.EggAppConfig}
   *  */
  const config = {};

  /** 自定义配置 */
  const customConfig = {};

  /** 站点基本信息 */
  customConfig.web = {
    name: 'mental-model',
    url : 'http://www.mental-model.com',
    port: 9000,
  };

  /** 目录信息 */
  customConfig.paths = {
    export: path.join(os.tmpdir(), appInfo.name, 'export'),
    upload: path.join(os.tmpdir(), appInfo.name, 'upload'),
  };

  /** redis 缓存 Key */
  customConfig.redisKey = {
    system  : user => `${user}:system`,
    userSess: user => `${user}:sess`,
  };

  /** 枚举 (string:number) */
  customConfig.enumsInvert = {
    User: {
      status: { '正常': 0, '禁用': 1 },
      type  : { '普通账号': 0, '游客账号': 1, '受限账号': 2, '开发者': 3 },
    },
  };

  /** 枚举 (number:string) */
  customConfig.enums = {
    User: {
      status: _.invert(customConfig.enumsInvert.User.status),
      type  : _.invert(customConfig.enumsInvert.User.type),
    },
  };

  // ==========================================================================

  config.keys = `${appInfo.name}_1562573525227_5145`;

  config.gzip = {
    threshold: 1024,
  };

  // cluster
  config.cluster = {
    listen: {
      port: 9000,
    },
  };

  // security
  config.security = {
    // csrf: {
    //   enable: false,
    // },
    // domainWhiteList: ['*']
  };

  config.multipart = {
    mode          : 'file',
    autoFields    : false,
    defaultCharset: 'utf8',
    fieldNameSize : 100,
    fieldSize     : '100kb',
    fields        : 10,
    fileSize      : '10mb',
    files         : 10,
    fileExtensions: ['.apk', '.ppt', '.pptx', '.xlsx', '.xlx', '.csv', '.docx', '.doc', '.ppt', '.pdf', '.pages', '.wav', '.mov'],
    whitelist     : null,
    tmpdir        : path.join(os.tmpdir(), 'egg-multipart-tmp', appInfo.name),
    cleanSchedule : {
      // run tmpdir clean job on every day 04:30 am
      // cron style see https://github.com/eggjs/egg-schedule#cron-style-scheduling
      cron: '0 30 4 * * *',
    },
  };

  config.bcrypt = {
    saltRounds: 10, // default 10
  };

  // static
  config.static = {
    prefix  : '',
    dir     : [path.join(appInfo.baseDir, 'app/public'), { prefix: '/image', dir: path.join(customConfig.paths.upload, 'image') }],
    dynamic : true,
    preload : false,
    buffer  : false,
    maxFiles: 1000,
    maxAge  : 604800000,
  };

  config.view = {
    root   : path.join(appInfo.baseDir, 'app/view'),
    mapping: {
      '.html': 'nunjucks',
    },
  };

  // sequelize
  config.sequelize = {
    dialect : 'mysql',
    database: '******',
    host    : 'localhost',
    port    : '3306',
    username: '******',
    password: '******',
    logging : true,
  };
  config.redis = {
    clients: {
      session: {
        host    : '******',
        port    : 6379,
        password: '******',
        db      : 1,
      },
      cache: {
        host    : '******',
        port    : 6379,
        password: '******',
        db      : 2,
      },
    },
  };

  config.sessionRedis = {
    // specific instance `session` as the session store
    name: 'session',
  };

  return { ...customConfig, ...config };
};
