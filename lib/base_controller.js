'use strict';

const _ = require('lodash');
// const chalk = require('chalk');

const Egg = require('egg');

/* eslint-disable no-bitwise */

const HANDLEPAGINATION = Symbol('BaseController#handlePagination');
const HANDLELISTOPTIONS = Symbol('BaseController#handleListOptions');
const HANDLEINCLUDE = Symbol('BaseController#handleInclude');
const HANDLEATTRIBUTES = Symbol('BaseController#handleAttributes');
const HANDLEQUERYFIELDS = Symbol('BaseController#handleQueryFields');

/**
 * BaseController
 */
class BaseController extends Egg.Controller {
  /**
   * Creates an instance of BaseController.
   *
   * @param {Egg.Context}     ctx
   * @param {Egg.BaseService} service
   * @param {Object}   [preset={}]
   * @param {boolean|Object}   [preset.logging=false] - 日志输出
   * @param {string}   [preset.param='id']    - param 参数名（对应主键）
   * @param {number}   [preset.size=20]       - 默认页面大小
   * @param {Object}   [preset.rules={}]      - 指定各个方法的参数
   * @param {Array}    [preset.attributes]    - list[All]方法 默认返回的参数 默认全部
   * @param {Array}    [preset.include]       - list[All] show 方法 默认联表 默认为空
   * @param {Array}    [preset.sort]          - list[All]方法 默认排序方式
   * @param {boolean}  [preset.fake]          -  可选，是否为假删除方式， 默认 false
   * @param {string}   [preset.fakeField]     -  可选，fake 为 true 时有效，假删除标记用的·字段·（默认为 deleteTime），字段类型为时间
   * @param {Function} [preset.response]    - 使用自定义的返回值处理方法（传入参数为 1 结果 2 状态码）
   * @param {Array}    [preset.limitAttributes]   - 限制参数，限制返回的参数可选值
   * @param {Array|string} [preset.limitSearchFields] - 限制参数，限制可搜索字段
   * @param {number}   [preset.limitMaxPage]      - 限制参数，限制最大页码 （设置了这个，list 类方法的 offset 参数则不会生效）
   * @param {number}   [preset.limitMaxSize]      - 限制参数，限制最大页面大小
   * @param {Array|string} [preset.limitInclude]      - 限制参数，限制可联的表
   * @param {Array|string} [preset.fieldMap]      - 字段映射表（设置相应值可以对外屏蔽真实数据库字段，而直接使用这个映射表的 key 作为参数传入）
   * @param {Function} [preset.addLogCallback]    -  记录日志方法，无参数，联动 baseService 的操作日志功能，从 ctx.opetatorLogs 中取数据库日志信息。
   * @memberof BaseController
   */
  constructor(ctx, service, preset = {}) {
    super(ctx);
    // model
    this.Service = service;
    // 兼容非 eggjs 框架
    if (preset.logging) {
      this.logging = typeof preset.logging === 'function' ? preset.logging : (ctx ? ctx.app.logger : console);
    } else {
      this.logging = {
        log  : () => {},
        info : () => {},
        error: () => {},
        warn : () => {},
      };
    }
    // findOpts
    _.assign(this, {
      param     : preset.param || 'id',
      size      : preset.size || 20,
      rules     : preset.rules || {},
      attributes: preset.attributes || preset.attrs || null,
      include   : preset.include || null,
      sort      : preset.sort || null,
      fake      : preset.fake || false,
      fakeField : preset.fakeField || 'deleteTime',
      fieldMap  : preset.fieldMap || {},
    });
    this.limit = {};
    _.assign(this.limit, {
      attributes  : preset.limitAttributes || null,
      searchFields: preset.limitSearchFields || null,
      include     : preset.limitInclude || null,
      maxPage     : preset.limitMaxPage || null,
      maxSize     : preset.limitMaxSize || null,
    });
    if (this.limit.searchFields) {
      if (typeof this.limit.searchFields === 'string') {
        this.limit.searchFields = [this.limit.searchFields];
      }
      this.limit.searchFieldsMap = {};
      _.map(this.limit.searchFields, sf => {
        this.limit.searchFieldsMap[sf] = true;
      });
    }
    if (this.limit.include) {
      if (typeof this.limit.include === 'string') {
        this.limit.include = [this.limit.include];
      }
    }
    this.response = preset.response || BaseController.ResponseJSON;
    this.addLogCallback = preset.addLogCallback || undefined;
    // this.response = this.Response.bind(this);
  }

  /**
   * [GET] ping
   *
   * @returns
   * @memberof BaseController
   */
  async ping() {
    return await this.response('ping');
  }

  /**
   * [GET] list all queried instances with count
   * （参数说明中的 xxx 为通配符的意思，=== \w+）
   *
   * @param {Object} params 路由参数
   * @param {Object} [query]
   * @param {number} [query.page]   页码
   * @param {number} [query.size]   页面大小
   * @param {number} [query.offset] 位移
   * @param {string} [query.attributes] 返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attrs]      返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.count]  是否数据总数
   * @param {string} [query.sort]   排序 如: -type,+createTime
   * @param {string} [query.xxxKey]     模糊搜索 Key, xxx 值需要有对应的 xxxFields 字段，否则无效
   * @param {string} [query.xxxTimeKey] 区间搜索 TimeKey, xxx 值需要有对应的 xxxFields 字段，否则无效
   * @param {Array}  [query.xxxFields]  搜索字段（可以走直接使用联表字段）
   * @param {string} [query.xxx]        筛选条件 键值对筛选数据
   * @param {string} [query.include]    使用联表，逗号分隔的字符串，填入在 service 里预置的 include 关系
   * @returns
   * @memberof BaseController
   */
  async list() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.list) {
      ctx.validate(this.rules.list);
    }
    this[HANDLEQUERYFIELDS]();
    const params = ctx.params;
    const query = ctx.request.query;
    const pagination = this[HANDLEPAGINATION]();
    const attributes = this[HANDLEATTRIBUTES]();
    const include = this[HANDLEINCLUDE]();
    const opt = this[HANDLELISTOPTIONS]();
    opt.count = query.count;
    opt.attributes = attributes;
    opt.include = include;
    // find all
    const ret = await this.Service.list({ params, query: pagination }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * [GET] list all queried instances
   * （参数说明中的 xxx 为通配符的意思，=== \w+）
   *
   * @param {Object} params 路由参数
   * @param {Object} [query]
   * @param {string} [query.attributes] 返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attrs]      返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.sort]   排序 如: -type,+createTime
   * @param {Object} [query.xxxKey]     模糊搜索 Key, xxx 值需要有对应的 xxxFields 字段，否则无效
   * @param {Object} [query.xxxTimeKey] 区间搜索 TimeKey, xxx 值需要有对应的 xxxFields 字段，否则无效
   * @param {Object} [query.xxxFields]  搜索字段（可以走直接使用联表字段）
   * @param {Object} [query.xxx]        筛选条件 键值对筛选数据
   * @param {string} [query.include]    使用联表，逗号分隔的字符串，填入在 service 里预置的 include 关系
   * @returns
   * @memberof BaseController
   */
  async listAll() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.listAll) {
      ctx.validate(this.rules.listAll);
    } else if (this.rules.list) {
      ctx.validate(_.omit(this.rules.list, ['page', 'size', 'offset']));
    }
    this[HANDLEQUERYFIELDS]();
    const params = ctx.params;
    // const query = ctx.request.query;
    const pagination = { page: 1, size: 0, offset: 0 };
    const attributes = this[HANDLEATTRIBUTES]();
    const include = this[HANDLEINCLUDE]();
    const opt = this[HANDLELISTOPTIONS]();
    opt.count = false;
    opt.attributes = attributes;
    opt.include = include;
    // find all
    const ret = await this.Service.list({ params, query: pagination }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * [GET] show instance
   *
   * @param {Object} params 路由参数
   * @param {number} params.id 主键
   * @param {Object} [query]
   * @param {string} [query.include]    使用联表，逗号分隔的字符串，填入在 service 里预置的 include 关系
   * @param {string} [query.attributes] 返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attrs]      返回参数控制, 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @returns
   * @memberof BaseController
   */
  async show() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.show) {
      ctx.validate(this.rules.show);
    }
    const params = ctx.params;
    // const query = ctx.request.query;
    const include = this[HANDLEINCLUDE]();
    const attributes = this[HANDLEATTRIBUTES]();
    const opt = {};
    opt.attributes = attributes;
    opt.include = include;
    // find by id
    // const ret = await this.Service.infoById(ctx.params[this.param], opt);
    const ret = await this.Service.info({ params }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * [POST] create an instance
   *
   * @param {Object} body 实例参数
   * @returns
   * @memberof BaseController
   */
  async add() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.add) {
      ctx.validate(this.rules.add);
    }
    const params = ctx.params;
    const body = ctx.request.body;
    // create
    const ret = await this.Service.add({ params, body });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret, 201);
  }

  /**
   * [PUT] update instance
   *
   * @param {Object} params 路由参数
   * @param {number} params.id 主键
   * @param {Object} body 修改内容
   * @returns
   * @memberof BaseController
   */
  async edit() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.edit) {
      ctx.validate(this.rules.edit);
    }
    // const id = ctx.params[this.param];
    const params = ctx.params;
    const values = ctx.request.body;
    const opt = { plain: true };
    // update
    // const ret = await this.Service.editById(id, values, opt);
    const ret = await this.Service.edit({ params }, values, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * [PUT] update all instance
   *
   * @param {Object} [query] 筛选参数，如无则更新所有实例
   * @param {Object} body  修改内容
   * @returns
   * @memberof BaseController
   */
  async editAll() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.editAll) {
      ctx.validate(this.rules.editAll);
    } else if (this.rules.edit) {
      const primaryKey = this.Service.model.primaryKeyAttribute;
      ctx.validate(_.omit(this.rules.edit, primaryKey));
    }
    const params = ctx.params;
    const query = ctx.request.query;
    const values = ctx.request.body;
    const opt = { plain: true };

    // update
    const ret = await this.Service.edit({ params: _.concat({}, params, query) }, values, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * [delete] delete instance
   *
   * @param {Object} params 路由参数
   * @param {number} params.id 主键
   * @returns
   * @memberof BaseController
   */
  async remove() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.remove) {
      ctx.validate(this.rules.remove);
    }
    // const id = ctx.params[this.param];
    const params = ctx.params;
    const { fake, fakeField } = this;
    // destroy
    // const ret = await this.Service.removeById(id, { plain: true, fake, fakeField });
    const ret = await this.Service.remove({ params }, { plain: true, fake, fakeField });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret, 204);
  }

  /**
   * [delete] delete all instance
   *
   * @param {Object} [query] 筛选参数，如无则删除所有实例
   * @returns
   * @memberof BaseController
   */
  async removeAll() {
    const { ctx } = this;
    if (!this.Service) {
      return null;
    }
    if (this.rules.removeAll) {
      ctx.validate(this.rules.removeAll);
    } else if (this.rules.remove) {
      const primaryKey = this.Service.model.primaryKeyAttribute;
      ctx.validate(_.omit(this.rules.remove, primaryKey));
    }
    const params = ctx.params;
    const query = ctx.request.query;
    const { fake, fakeField } = this;
    // destroy
    const ret = await this.Service.remove({ params: _.concat({}, params, query) }, { plain: true, fake, fakeField });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret, 204);
  }

  /**
   * handle query options from url
   *
   * @returns {Object} {attributes,search,filter}
   * @memberof BaseController
   */
  [HANDLELISTOPTIONS]() {
    const { ctx } = this;
    const query = ctx.request.query;
    const opt = {/* count: true*/};
    const otherParams = _.omit(query, ['page', 'size', 'offset', 'attrs', 'attributes', 'sort', 'include']);
    opt.search = [];
    opt.filter = {};
    const rawAttributes = _.keys(this.Service.model.rawAttributes);
    _.map(otherParams, (val, key) => {
      if (key.slice(-3) === 'Key') {
        let tmp = {
          key   : val,
          fields: [],
        };
        if (key.slice(-7) === 'TimeKey') {
          tmp = {
            key   : val.split(','),
            fields: [],
          };
        }
        const fields = _.filter((otherParams[`${key.slice(0, -3)}Fields`] || '').split(',')) || [];
        if (this.limit.searchFields) {
          _.remove(fields, field => !this.limit.searchFieldsMap[field]);
        }
        if (fields.length > 0) {
          tmp.fields = fields;
          opt.search.push(tmp);
        }
      } else if (rawAttributes.indexOf(key) >= 0 || (key[0] === '$' && key[0] === key[key.length - 1])) {
        opt.filter[key] = val;
      }
    });
    if (query.sort) {
      opt.sort = query.sort || this.sort;
      if (opt.sort) {
        opt.sort = _.map(opt.sort.split(','), _.trim);
      }
    }
    if (this.fake) {
      opt.filter[this.fakeField] = null;
    }
    return opt;
  }

  [HANDLEATTRIBUTES]() {
    const { ctx } = this;
    const query = ctx.request.query;
    let attributes = query.attributes || query.attrs || this.attributes;
    if (attributes && typeof attributes === 'string') {
      attributes = attributes.split(',');
    }
    if (this.limit.attributes) {
      if (attributes) {
        _.remove(attributes, item => this.limit.attributes.indexOf(item) === -1);
      } else {
        attributes = this.limit.attributes;
      }
    }
    return attributes;
  }

  [HANDLEPAGINATION]() {
    const { ctx } = this;
    const query = ctx.request.query;
    let page = ~~query.page || 1;
    let size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    let offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    // 如果设置了最大页码，offset 将不可用
    if (this.limit.maxPage) {
      offset = 0;
    }
    if (this.limit.maxPage && page > this.limit.maxPage) {
      page = this.limit.maxPage;
    }
    if (this.limit.maxSize && (size > this.limit.maxSize || size === 0)) {
      size = this.limit.maxSize;
    }
    return { page, size, offset };
  }

  [HANDLEINCLUDE]() {
    const includeList = [];
    const { ctx } = this;
    const query = ctx.request.query;
    const preset = this.Service.include;
    let include = query.include || this.include;
    if (include) {
      if (typeof include === 'string') {
        include = include.split(',');
      }
      _.map(include, item => {
        if ((!this.limit.include || (this.limit.include.indexOf(item) >= 0))
            && preset[item]) {
          includeList.push({ preset: item });
        }
      });
    }
    return includeList;
  }

  /**
   * 处理 query 参数，应用字段映射表转换相应字段数据
   */
  [HANDLEQUERYFIELDS]() {
    if (this.fieldMap && _.keys(this.fieldMap).length) {
      const { ctx } = this;
      const { query } = ctx.request;
      _.map(_.sortBy(_.keys(query)), key => {
        const value = query[key];
        if (['page', 'size', 'offset', 'attrs', 'attributes', 'sort', 'include'].indexOf(key) >= 0 || key.slice(-3) === 'Key' || key.slice(-6) === 'Fields') {
          if (['attrs', 'attributes', 'sort', 'include'].indexOf(key) >= 0 || key.slice(-6) === 'Fields') {
            const valueFields = value.split(',');
            _.map(valueFields, (field, idx) => {
              const p = (field[0] === '+' || field[0] === '-') ? field[0] : undefined;
              if (p) {
                if (this.fieldMap[field.slice(1)]) {
                  valueFields[idx] = p + this.fieldMap[field];
                }
              } else if (this.fieldMap[field]) {
                valueFields[idx] = this.fieldMap[field];
              }
            });
            query[key] = _.uniq(valueFields).join(',');
          }
          return;
        }
        if (this.fieldMap[key]) {
          if (this.fieldMap[key].indexOf('.') >= 0 && this.fieldMap[key][0] !== '$' && this.fieldMap[key][this.fieldMap[key].length - 1] !== '$') {
            query[`$${this.fieldMap[key]}$`] = value;
          } else {
            query[this.fieldMap[key]] = value;
          }
        }
        delete query[key];
      });
    }
  }

  /**
   * response json data to client
   *
   * usage: ResponseJSON.call(this, ...)
   *
   * @static
   * @param {any} promise
   * @param {number} [successCode=200]
   * @memberof BaseController
   */
  static async ResponseJSON(promise, successCode = 200) {
    const { ctx } = this;
    ctx.type = 'json';
    try {
      const data = await promise;
      ctx.apiResult = { code: successCode || 200, data, ext: { query: ctx.query } };
    } catch (err) {
      ctx.apiResult = { code: 500, msg: err.message };
    }
  }

  /**
   * convert instance to plain object
   *
   * @static
   * @param {Array<Sequelize#Model>|Object} data
   * @param {*} [plain]
   * @returns
   * @memberof BaseService
   */
  static toJSON(data, plain) {
    if (!data || !plain) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(item => item.toJSON());
    }
    return data.toJSON();
  }
}

module.exports = BaseController;

