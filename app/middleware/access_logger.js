/**
 * access_logger (base from log4js-node/connect-logger)
 */

'use strict';

const DEFAULT_FORMAT = ':remote-addr - -'
  + ' ":method :url HTTP/:http-version"'
  + ' :status :content-length ":referrer"'
  + ' ":user-agent"';

/**
   * Log requests with the given `options` or a `format` string.
   *
   * Options:
   *
   *   - `format`        Format string, see below for tokens
   *   - `level`         A log4js levels instance. Supports also 'auto'
   *   - `nolog`         A string or RegExp to exclude target logs
   *   - `statusRules`   A array of rules for setting specific logging levels base on status codes
   *
   * Tokens:
   *
   *   - `:req[header]` ex: `:req[Accept]`
   *   - `:res[header]` ex: `:res[Content-Length]`
   *   - `:http-version`
   *   - `:response-time`
   *   - `:remote-addr`
   *   - `:date`
   *   - `:method`
   *   - `:url`
   *   - `:referrer`
   *   - `:user-agent`
   *   - `:status`
   *
   * @returns {Function}
   * @param {Object} options -
   * @param {string} options.level AUTO|INFO|WARN|ERROR
   * @param {string|Function} options.format -
   * @param {string} options.nolog -
   * @api public
   */
module.exports = function(options) {
  /* eslint no-underscore-dangle:0 */
  if (typeof options === 'string' || typeof options === 'function') {
    options = { format: options };
  } else {
    options = options || {};
  }

  options.level = (options.level || 'info').toLowerCase();
  const fmt = options.format || DEFAULT_FORMAT;
  const nolog = options.nolog ? createNoLogCondition(options.nolog) : null;

  return async (ctx, next) => {
    const thisLogger = ctx.logger;
    const errorTraceLogger = ctx.app.errorTraceLogger;
    const objectStringify = ctx.app.objectStringify;
    // mount safety
    if (ctx.request._logging) return next();
    // nologs
    if (nolog && nolog.test(ctx.request.originalUrl)) {
      return await next();
    }

    const start = new Date();
    // flag as logging
    ctx.request._logging = true;

    try {
    // ensure next gets always called
      await next();
    } catch (err) {
      let status = err.status || 500;
      if (status < 200) {
        status = 500;
      }
      ctx.status = status;
      throw err;
    } finally {
      ctx.response.responseTime = new Date() - start;
      let level = options.level;
      if (ctx.status && level === 'auto') {
        if (ctx.status >= 400) {
          level = 'error';
        } else if (ctx.status >= 300) {
          level = 'warn';
        } else {
          level = 'info';
        }
      }

      const combinedTokens = assembleTokens(ctx, options.tokens || []);
      const parameter = { params: ctx.params || {}, query: ctx.request.query || {}, body: ctx.request.body || {} };

      if (typeof fmt === 'function') {
        const line = fmt(ctx, str => format(str, combinedTokens));
        if (line) {
          thisLogger[level](`[egg-access-logger]${line}`);
          errorTraceLogger[level](`[egg-access-logger]${line}`, objectStringify(parameter));
        }
      } else {
        thisLogger[level](`[egg-access-logger]${format(fmt, combinedTokens)}`);
        errorTraceLogger[level](`[egg-access-logger]${format(fmt, combinedTokens)}`, objectStringify(parameter));
      }
    }
  };
};

/**
 * Return request url path,
 * adding this function prevents the Cyclomatic Complexity,
 * for the assemble_tokens function at low, to pass the tests.
 *
 * @param  {context} ctx -
 * @returns {string}
 * @api private
 */
function getUrl(ctx) {
  return ctx.originalUrl || ctx.url;
}


/**
 * Adds custom {token, replacement} objects to defaults,
 * overwriting the defaults if any tokens clash
 *
 * @param  {Context} ctx -
 * @param  {Array} customTokens
 *    [{ token: string-or-regexp, replacement: string-or-replace-function }]
 * @returns {Array}
 */
function assembleTokens(ctx, customTokens) {
  const arrayUniqueTokens = array => {
    const a = array.concat();
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        // not === because token can be regexp object
        /* eslint eqeqeq:0 */
        if (a[i].token == a[j].token) {
          a.splice(j--, 1);
        }
      }
    }
    return a;
  };

  const defaultTokens = [];
  defaultTokens.push({ token: ':url', replacement: getUrl(ctx) });
  defaultTokens.push({ token: ':protocol', replacement: ctx.protocol });
  defaultTokens.push({ token: ':hostname', replacement: ctx.hostname });
  defaultTokens.push({ token: ':method', replacement: ctx.method });
  defaultTokens.push({ token: ':status', replacement: ctx.response.statusCode });
  defaultTokens.push({ token: ':response-time', replacement: ctx.response.responseTime });
  defaultTokens.push({ token: ':date', replacement: new Date().toUTCString() });
  defaultTokens.push({
    token      : ':referrer',
    replacement: ctx.headers.referer || ctx.headers.referrer || '',
  });
  defaultTokens.push({
    token      : ':http-version',
    replacement: `${ctx.httpVersionMajor}.${ctx.httpVersionMinor}`,
  });
  defaultTokens.push({
    token      : ':remote-addr',
    replacement: ctx.headers['x-forwarded-for']
      || ctx.ip
      || ctx._remoteAddress
      || (ctx.socket
        && (ctx.socket.remoteAddress
          || (ctx.socket.socket && ctx.socket.socket.remoteAddress)
        )
      ),
  });
  defaultTokens.push({ token: ':user-agent', replacement: ctx.headers['user-agent'] });
  defaultTokens.push({
    token      : ':content-length',
    replacement: ctx.response.headers && ctx.response.headers['Content-Length'] || '-',
  });
  defaultTokens.push({
    token: /:req\[([^\]]+)]/g,
    replacement(_, field) {
      return ctx.headers[field.toLowerCase()];
    },
  });
  defaultTokens.push({
    token: /:res\[([^\]]+)]/g,
    replacement(_, field) {
      return ctx.response.headers && ctx.response.headers[field];
    },
  });

  return arrayUniqueTokens(customTokens.concat(defaultTokens));
}

/**
   * Return formatted log line.
   *
   * @param  {string} str -
   * @param {Array} tokens -
   * @returns {string}
   * @api private
   */
function format(str, tokens) {
  for (let i = 0; i < tokens.length; i++) {
    str = str.replace(tokens[i].token, tokens[i].replacement);
  }
  return str;
}

/**
   * Return RegExp Object about nolog
   *
   * @param  {string|Array} nolog -
   * @returns {RegExp}
   * @api private
   *
   * syntax
   *  1. String
   *   1.1 "\\.gif"
   *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.gif?fuga
   *         LOGGING http://example.com/hoge.agif
   *   1.2 in "\\.gif|\\.jpg$"
   *         NOT LOGGING http://example.com/hoge.gif and
   *           http://example.com/hoge.gif?fuga and http://example.com/hoge.jpg?fuga
   *         LOGGING http://example.com/hoge.agif,
   *           http://example.com/hoge.ajpg and http://example.com/hoge.jpg?hoge
   *   1.3 in "\\.(gif|jpe?g|png)$"
   *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.jpeg
   *         LOGGING http://example.com/hoge.gif?uid=2 and http://example.com/hoge.jpg?pid=3
   *  2. RegExp
   *   2.1 in /\.(gif|jpe?g|png)$/
   *         SAME AS 1.3
   *  3. Array
   *   3.1 ["\\.jpg$", "\\.png", "\\.gif"]
   *         SAME AS "\\.jpg|\\.png|\\.gif"
   */
function createNoLogCondition(nolog) {
  let regexp = null;

  if (nolog instanceof RegExp) {
    regexp = nolog;
  }

  if (typeof nolog === 'string') {
    regexp = new RegExp(nolog);
  }

  if (Array.isArray(nolog)) {
    // convert to strings
    const regexpsAsStrings = nolog.map(reg => (reg.source ? reg.source : reg));
    regexp = new RegExp(regexpsAsStrings.join('|'));
  }

  return regexp;
}
