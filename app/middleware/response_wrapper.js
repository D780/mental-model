'use strict';


module.exports = option => {
  const HttpStatusMap = new Map();
  HttpStatusMap.set(0, { code: 200, statusCode: 200, success: true, msg: 'OK', desc: 'OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。' });
  HttpStatusMap.set(200, { code: 200, statusCode: 200, success: true, msg: 'OK', desc: 'OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。' });
  HttpStatusMap.set(201, { code: 201, statusCode: 201, success: true, msg: 'Created', desc: 'Created - [POST/PUT/PATCH]：用户新建或修改数据成功。' });
  HttpStatusMap.set(202, { code: 202, statusCode: 202, success: true, msg: 'Accepted', desc: 'Accepted - [*]：表示一个请求已经进入后台排队（异步任务）' });
  HttpStatusMap.set(204, { code: 204, statusCode: 204, success: true, msg: 'No Content', desc: 'No Content - [DELETE]：用户删除数据成功。' });
  HttpStatusMap.set(400, { code: 400, statusCode: 400, success: true, msg: 'Bad Request', desc: 'Bad Request - [POST/PUT/PATCH]：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。' });
  HttpStatusMap.set(401, { code: 401, statusCode: 401, success: true, msg: 'Unauthorized', desc: 'Unauthorized - [*]：表示用户没有权限（令牌、用户名、密码错误）。' });
  HttpStatusMap.set(403, { code: 403, statusCode: 403, success: true, msg: 'Forbidden', desc: 'Forbidden - [*] 表示用户得到授权（与401错误相对），但是访问是被禁止的。' });
  HttpStatusMap.set(404, { code: 404, statusCode: 404, success: true, msg: 'Not Found', desc: 'Not Found - [*]：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。' });
  HttpStatusMap.set(406, { code: 406, statusCode: 406, success: true, msg: 'Not Acceptable', desc: 'Not Acceptable - [GET]：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。' });
  HttpStatusMap.set(410, { code: 410, statusCode: 410, success: true, msg: 'Gone', desc: 'Gone -[GET]：用户请求的资源被永久删除，且不会再得到的。' });
  HttpStatusMap.set(422, { code: 422, statusCode: 422, success: true, msg: 'Unprocesable entity', desc: 'Unprocesable entity - 发生一个参数验证错误。' });
  HttpStatusMap.set(500, { code: 500, statusCode: 500, success: true, msg: 'Internal Server Error', desc: 'Internal Server Error - [*]：服务器发生错误，用户将无法判断发出的请求是否成功' });

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
          code: 200,
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
