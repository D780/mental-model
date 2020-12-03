'use strict';


module.exports = option => {
  const HttpStatusMap = new Map();
  HttpStatusMap.set(0, { statusCode: 200, succeed: true, code: 0, status: 'success', desc: '成功' });
  HttpStatusMap.set(1001, { statusCode: 200, succeed: false, code: 1001, status: 'error', desc: '内部错误' });
  HttpStatusMap.set(1002, { statusCode: 200, succeed: true, code: 1002, status: 'apiNotExists', desc: '接口不存在' });
  HttpStatusMap.set(1003, { statusCode: 200, succeed: false, code: 1003, status: 'paramError', desc: '参数错误' });
  HttpStatusMap.set(1004, { statusCode: 200, succeed: true, code: 1004, status: 'noPermission', desc: '没有该功能的操作权限' });
  HttpStatusMap.set(1005, { statusCode: 200, succeed: true, code: 1005, status: 'noSensitivePermission', desc: '没有敏感操作的权限' });
  HttpStatusMap.set(-1000, { statusCode: 200, succeed: true, code: -1000, status: 'loginOverdue', desc: '登录已过期，请重新登录！' });

  return async function(ctx, next) {
    await next();
    if (ctx.apiResult) {
      // 如果值为 字符串 或 数字，则认为该值为 code
      // 如果值为 对象 但是并不含有 code，则认为该值为 data 并把 code 设置为 200
      if (typeof ctx.apiResult === 'string' || typeof ctx.apiResult === 'number') {
        ctx.apiResult = {
          code: ctx.apiResult,
        };
      }
      if (typeof ctx.apiResult === 'object' && ctx.apiResult.code === undefined) {
        ctx.apiResult = {
          code: 0,
          data: ctx.apiResult,
        };
      }
      const HttpStatus = HttpStatusMap.get(ctx.apiResult.code);
      ctx.body = {
        code   : HttpStatus.code || 200,
        message: ctx.apiResult.msg ? ctx.apiResult.msg : HttpStatus.msg,
        data   : ctx.apiResult.data ? ctx.apiResult.data : {},
      };
    } else if (ctx.viewResult) {
      ctx.render(ctx.viewResult.view, ctx.viewResult.data);
    }

    // AJAX 的 302 处理
    if (ctx.status === 302 && ctx.isXHR) {
      ctx.status = 403;
      ctx.body = {
        location: ctx.response.get('location'),
        action  : 'redirect',
      };
    }
  };
};
