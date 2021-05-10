import 'egg';
// 将该上层框架用到的插件 import 进来
import 'egg-onerror';
import 'egg-session';
import 'egg-i18n';
import 'egg-watcher';
import 'egg-multipart';
import 'egg-security';
import 'egg-development';
import 'egg-logrotator';
import 'egg-schedule';
import 'egg-static';
import 'egg-jsonp';
import 'egg-view';
import 'egg-view-nunjucks';
import 'egg-router-plus';
import 'egg-sequelize';
import 'egg-session-redis';
import 'egg-redis';
import 'egg-cors';
import 'egg-passport';
import 'egg-bcrypt';
import 'egg-valparams';

import './lib/base_class/base_service';
import './lib/base_class/base_controller';
import _NonError from './lib/non-error';

import _UtilsIndex from './utils/index';
import _Excel from './utils/excel';
import _JSZipExtra from './utils/jszip-extra';
import _SequelizeCache from './utils/sequelize-cache';
import _Cache from './utils/cache';

import _AccessLogger  from './app/middleware/access_logger';
import _Gzip from './app/middleware/gzip';
import _ResponseWrapper from './app/middleware/response_wrapper';

import { Sequelize } from 'sequelize/types';
import sequelize from 'sequelize';

declare module 'egg' {
  class _ErrorTraceLogger {
    log(level: LoggerLevel, args: any[], meta: object): void;
    error(msg: any, ...args: any[]): void;
    warn(msg: any, ...args: any[]): void;
    info(msg: any, ...args: any[]): void;
    debug(msg: any, ...args: any[]): void;
    trace(msg: any, ...args: any[]): void;
    mark(msg: any, ...args: any[]): void;
    fatal(msg: any, ...args: any[]): void;

    set enable(enable: boolean): boolean
    /** 输出缓存的日志 */
    output(): void;
  }

  // ======================================================
  // 扩展 app
  interface Application {
    utils: typeof _UtilsIndex;
    errorTraceLogger: _ErrorTraceLogger;
    excel: typeof _Excel;
    JSZip: _JSZipExtra;
    cache: _Cache;
    session: _Cache;
  }
  // 扩展 context
  interface Context {
    operatorLogs: _OperatorLog[];
    
    apiResult?:{
      code: number;
      msg?: string;
      data?: any;
    }
    socketResult?:{
      code: number;
      msg?: string;
      data?: any;
    }
    viewResult?: {
      view: string;
      data: any;
    }
  }

  class EggModel extends sequelize.Model {
    /**
     * 获取 model cache 对象
     * 基于 `./utils/sequelize-cache`，该对象下的常用数据库操作方法均会启用缓存存取
     * {
     *   get     : ['findAll', 'count', 'findAndCountAll', 'findByPk', 'findCreateFind', 'findOne', 'findOrBuild', 'findOrCreate', 'max', 'min', 'sum', 'aggregate'],
     *   save    : ['bulkCreate', 'create', 'decrement', 'destroy', 'drop', 'increment', 'update', 'upsert'],
     *   instance: ['decrement', 'destroy', 'increment', 'reload', 'restore', 'save', 'set', 'setDataValue', 'update'],
     * }
     * 
     * @param {number} [ttl=3600] 缓存生命周期，传 0 或 -1 则表示永久
     * 
     */
    static cache(ttl=3600): sequelize.ModelType;
  }
  type EggModelType = typeof EggModel;
  interface IModel {
    define(): EggModelType;
  }
  interface IMiddleware {
    accessLogger: ReturnType<typeof _AccessLogger>;
    gzip: ReturnType<typeof _Gzip>;
    responseWrapper: ReturnType<typeof _ResponseWrapper>;
  }

  interface EggAppConfig extends ConfigDefault { }

  interface EggPlugin {
    onerror?: EggPluginItem;
    session?: EggPluginItem;
    i18n?: EggPluginItem;
    watcher?: EggPluginItem;
    multipart?: EggPluginItem;
    security?: EggPluginItem;
    development?: EggPluginItem;
    logrotator?: EggPluginItem;
    schedule?: EggPluginItem;
    static?: EggPluginItem;
    jsonp?: EggPluginItem;
    view?: EggPluginItem;
    nunjucks?: EggPluginItem;
    routerPlus?: EggPluginItem;
    sequelize?: EggPluginItem;
    sessionRedis?: EggPluginItem;
    redis?: EggPluginItem;
    cors?: EggPluginItem;
    passport?: EggPluginItem;
    bcrypt?: EggPluginItem;
    valparams?: EggPluginItem;
  }
}

export * from 'egg';
export as namespace Egg;
