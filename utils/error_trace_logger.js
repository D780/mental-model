'use strict';

const moment = require('moment');
const _ = require('lodash');
const chalk = require('chalk');

const CACHE = Symbol('ErrorTraceLogger#CACHE');
const PUSH = Symbol('ErrorTraceLogger#PUSH');
const BUILD = Symbol('ErrorTraceLogger#BUILD');

class ErrorTraceLogger {
  constructor(logger, options) {
    this.title = 'ErrorTraceLogger';
    this.logger = logger || console;
    this._enable = _.isUndefined(options.enable) ? true : options.enable;
    this.maxLength = options.maxLength || 50;
    this[CACHE] = [];
    this[BUILD]();
  }

  set enable(val) {
    this._enable = Boolean(val);
    if (!this._enable) {
      // 关闭时 清空缓存
      this[CACHE] = [];
    }
  }

  [PUSH](func, contents) {
    this[CACHE].push({ func, contents, time: Date.now() });
    if (this[CACHE].length > this.options.maxLength) {
      this[CACHE].shift();
    }
  }

  [BUILD]() {
    for (const func in this.logger) {
      if (['log', 'info', 'warn', 'error', 'trace', 'debug', 'mark', 'fatal'].indexOf(func) >= 0) {
        this[func] = function(...contents) {
          if (this._enable) {
            this[PUSH](func, contents);
          } else {
            this.logger[func](...contents);
          }
        };
      } else {
        this[func] = this.logger[func];
      }
    }
  }
  output() {
    const len = this[CACHE].length;
    const lenlen = (`${len}`).length;
    const lenlenlen = (`${len}/${this.maxLength}`).length;

    this.logger.warn(chalk.blue(`[${this.title}]`), '============================================================');
    this.logger.warn(chalk.blue(`[${this.title}]`), 'Error Trace Start ==========================================');
    this.logger.warn(chalk.blue(`[${this.title}]`), `total: ${len}/${this.maxLength} ${new Array(53 - lenlenlen).join('=')}`);
    this.logger.warn(chalk.blue(`[${this.title}]`), '============================================================');

    for (let i = 0; i < this[CACHE].length; i++) {
      const logInfo = this[CACHE][i];
      const contents = logInfo.contents;
      const method = logInfo.func.toUpperCase();
      let methodStr = method;
      if (method === 'ERROR') {
        methodStr = chalk.red(method);
      } else if (methodStr === 'WARN') {
        methodStr = chalk.yellow(method);
      }
      let e;
      if (method === 'LOG' && typeof contents[0] !== 'string') {
        e = contents.shift();
      }

      contents.unshift(chalk.blue(`[${this.title}]`),
        chalk.yellow(`(${zeroFix(i + 1, lenlen)}/${len})`),
        methodStr,
        chalk.green(`[${moment(logInfo.time).format('YYYY-MM-DD HH:mm:ss,SSS')}]`, '>>>'));
      if (e) {
        contents.unshift(e);
      }
      this.logger.info(...contents);
    }

    this.logger.warn(chalk.blue(`[${this.title}]`), '============================================================');
    this.logger.warn(chalk.blue(`[${this.title}]`), 'Error Trace End ============================================');
    this.logger.warn(chalk.blue(`[${this.title}]`), '============================================================');

    this[CACHE] = [];
  }
}

function zeroFix(num, len) {
  const olen =  (`${num}`).length;
  if (olen > len) {
    return num;
  }
  return new Array(len - olen + 1).join(0) + num;
}

module.exports = ErrorTraceLogger;
