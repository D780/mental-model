'use strict';

const _ = require('lodash');
// const chalk = require('chalk');

const Egg = require('egg');

/* eslint-disable no-bitwise */
/* eslint-disable max-len */

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
   * @param {Array}    [preset.attributes]        - list[All] show方法 默认返回的参数 默认全部
   * @param {Array}    [preset.includeAttributes] - list[All] show方法 默认的子表返回的参数 默认全部
   * @param {Array}    [preset.include]           - list[All] show 方法 默认联表 默认为空
   * @param {Array}    [preset.sort]          - list[All]方法 默认排序方式
   * @param {boolean}  [preset.fake]          - 可选，是否为假删除方式， 默认 false
   * @param {string}   [preset.createUserIdField]  - 可选，createUserId 字段名，默认 createUserId，在 add 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.createTimeField]    - 可选，createTime 字段名，默认 createTime，在 add 接口会自动追加上相应的数据
   * @param {string}   [preset.updateUserIdField]  - 可选，updateUserId 字段名，默认 updateUserId，在 edit 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.updateTimeField]    - 可选，updateTime 字段名，默认 updateTime，在 edit 接口会自动追加上相应的数据
   * @param {string}   [preset.deleteUserIdField]  - 可选，fake 为 true 时有效，deleteUserId 字段名，默认 deleteUserId，在 remove 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.deleteTimeField]    - 可选，fake 为 true 时有效，deleteTime 字段名，默认 deleteTime，在 remove 接口会自动追加上相应的数据
   * @param {Function} [preset.response]    - 使用自定义的返回值处理方法（传入参数为 1 结果 2 状态码）
   * @param {Array}    [preset.limitAttributes]   - 限制参数，限制返回的参数可选值
   * @param {Object}   [preset.limitIncludeAttributes] - 限制参数，限制子表返回的参数可选值 { [ 子表名 ]: [ ...limitAttributes ] }
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
      param            : preset.param || 'id',
      size             : preset.size || 20,
      rules            : preset.rules || {},
      attributes       : preset.attributes || preset.attrs || null,
      include          : preset.include || null,
      sort             : preset.sort || null,
      fake             : preset.fake || false,
      createUserIdField: preset.createUserIdField || 'createUserId',
      createTimeField  : preset.createTimeField || 'createTime',
      updateUserIdField: preset.updateUserIdField || 'updateUserId',
      updateTimeField  : preset.updateTimeField || 'updateTime',
      deleteUserIdField: preset.deleteUserIdField || 'deleteUserId',
      deleteTimeField  : preset.deleteTimeField || 'deleteTime',
      fieldMap         : preset.fieldMap || {},
    });
    this.limit = {};
    _.assign(this.limit, {
      attributes       : preset.limitAttributes || null,
      includeAttributes: preset.limitIncludeAttributes || {},
      searchFields     : preset.limitSearchFields || null,
      include          : preset.limitInclude || null,
      maxPage          : preset.limitMaxPage || null,
      maxSize          : preset.limitMaxSize || null,
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
   * ### 获取 资源 列表
   *
   * ```js
   * // example: { count, rows: [ ...instances ] } | [ ...instances ]
   * 返回结果
   * ```
   *
   * @apiname /resources
   * @method GET
   * @login true
   * @whocanuse
   *
   * @param {Object}  query                     请求参数
   * @param {number}  [query.page]              页码
   * @param {number}  [query.size]              页面大小
   * @param {number}  [query.offset]            偏移量
   * @param {string}  [query.searchKey]         通用模糊搜索关键字 - 如 key 搜索相应字段值是否含有值 key; 与 searchFields 参数搭配使用，否则无效
   * @param {string}  [query.searchRangeKey]    通用区间搜索关键字 - 如 1,6 搜索相应字段值在该范围内; 与 searchFields 参数搭配使用，否则无效
   * @param {string}  [query.searchFields]      通用搜索字段 - 与 search[Range]Key 参数搭配使用，否则无效
   * @param {string}  [query.attrs]             返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string}  [query.attributes]        返回字段列表 - 同 attrs
   * @param {boolean} [query.count]             是否返回数据总数
   * @param {string}  [query.include]           联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}    [query.includeAttrs]      子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}    [query.includeAttributes] 子表返回字段列表 - 同 includeAttrs
   * @param {string}  [query.sort]              排序方式 - 如: -type,+createTime
   *
   * @param {Object} resp 返回值说明
   * @param {number} resp.count 数据总数
   * @param {Object[]} resp.rows 列表
   *
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
    this.handleQueryFields();
    const params = ctx.params;
    const query = ctx.request.query;
    const pagination = this.handlePagination();
    const attributes = this.handleAttributes();
    const include = this.handleInclude();
    const opt = this.handleListOptions();
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
   * ### 获取 资源 列表(不分页))
   *
   * ```js
   * // example: [ ...instances ]
   * 返回结果
   * ```
   *
   * @apiname /resources/all
   * @method GET
   * @login true
   * @whocanuse
   *
   * @param {Object} query                     请求参数
   * @param {string} [query.searchKey]         通用模糊搜索关键字 - 如 key 搜索相应字段值是否含有值 key; 与 searchFields 参数搭配使用，否则无效
   * @param {string} [query.searchRangeKey]    通用区间搜索关键字 - 如 1,6 搜索相应字段值在该范围内; 与 searchFields 参数搭配使用，否则无效
   * @param {string} [query.searchFields]      通用搜索字段 - 与 search[Range]Key 参数搭配使用，否则无效
   * @param {string} [query.attrs]             返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attributes]        返回字段列表 - 同 attrs
   * @param {string} [query.include]           联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}   [query.includeAttrs]      子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}   [query.includeAttributes] 子表返回字段列表 - 同 includeAttrs
   * @param {string} [query.sort]              排序方式 - 如: -type,+createTime
   *
   * @param {Object[]} resp 返回值说明
   *
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
    this.handleQueryFields();
    const params = ctx.params;
    // const query = ctx.request.query;
    const pagination = { page: 1, size: 0, offset: 0 };
    const attributes = this.handleAttributes();
    const include = this.handleInclude();
    const opt = this.handleListOptions();
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
   * ### 获取 资源 详情
   *
   * ```js
   * // example: instance
   * 返回结果
   * ```
   *
   * @apiname /resources/:id
   * @method GET
   * @login true
   * @whocanuse
   *
   * @param {Object} params    路由参数
   * @param {number} params.id 主键
   * @param {Object} query                     请求参数
   * @param {string} [query.attrs]             返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attributes]        返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.include]           联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}   [query.includeAttrs]      子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}   [query.includeAttributes] 子表返回字段列表 - 同 includeAttrs
   *
   * @param {Object} resp 返回值说明
   *
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
    const include = this.handleInclude();
    const attributes = this.handleAttributes();
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
   * ### 创建新的 资源
   *
   * ```js
   * // example: instance
   * 返回结果
   * ```
   *
   * @apiname /resources
   * @method POST
   * @login true
   * @whocanuse
   *
   * @param {Object} body 请求参数
   *
   * @param {Object} resp 返回值说明
   *
   * @returns
   * @memberof BaseController
   */
  async add() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.add) {
      ctx.validate(this.rules.add);
    }
    const params = ctx.params;
    const body = ctx.request.body;
    const modelAttrs = this.Service.model.rawAttributes;
    if (modelAttrs[this.createUserIdField]) {
      body[this.createUserIdField] = OpUser.id;
    }
    if (modelAttrs[this.createTimeField]) {
      body[this.createTimeField] = Date.now();
    }
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
   * ### 编辑 资源
   *
   * ```js
   * // example: [ 1 ]
   * 返回结果
   * ```
   *
   * @apiname /resources/:id
   * @method PUT
   * @login true
   * @whocanuse
   *
   * @param {Object} params    路由参数
   * @param {number} params.id 主键
   * @param {Object} body 请求参数
   *
   * @param {number[]} resp 返回值说明 - 值为变动的记录数量 ([ 1 ])
   *
   * @returns
   * @memberof BaseController
   */
  async edit() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.edit) {
      ctx.validate(this.rules.edit);
    }
    // const id = ctx.params[this.param];
    const params = ctx.params;
    const body = ctx.request.body;
    const opt = { plain: true };
    const modelAttrs = this.Service.model.rawAttributes;
    if (modelAttrs[this.updateUserIdField]) {
      body[this.updateUserIdField] = OpUser.id;
    }
    if (modelAttrs[this.updateTimeField]) {
      body[this.updateTimeField] = Date.now();
    }
    // update
    // const ret = await this.Service.editById(id, body, opt);
    const ret = await this.Service.edit({ params, body }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * ### 编辑 资源 (批量)
   *
   * ```js
   * // example: [ affectCount ]
   * 返回结果
   * ```
   *
   * @apiname /resources
   * @method PUT
   * @login true
   * @whocanuse
   *
   * @param {Object} body 请求参数
   *
   * @param {number[]} resp 返回值说明 - 值为变动的记录数量
   *
   * @returns
   * @memberof BaseController
   */
  async editAll() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
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
    const body = ctx.request.body;
    const opt = { plain: true };
    const modelAttrs = this.Service.model.rawAttributes;
    if (modelAttrs[this.updateUserIdField]) {
      body[this.updateUserIdField] = OpUser.id;
    }
    if (modelAttrs[this.updateTimeField]) {
      body[this.updateTimeField] = Date.now();
    }

    // update
    const ret = await this.Service.edit({ params: _.concat({}, params, query), body }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * ### 删除 资源
   *
   * ```js
   * // example: 1
   * 返回结果
   * ```
   *
   * @apiname /resources/:id
   * @method DELETE
   * @login true
   * @whocanuse
   *
   * @param {Object} params    路由参数
   * @param {number} params.id 主键
   *
   * @param {number} resp 返回值说明 - 值为删除的记录数量 (1)
   *
   * @returns
   * @memberof BaseController
   */
  async remove() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.remove) {
      ctx.validate(this.rules.remove);
    }
    // const id = ctx.params[this.param];
    const params = ctx.params;
    const { fake, deleteUserIdField, deleteTimeField } = this;
    const modelAttrs = this.Service.model.rawAttributes;
    const fakeBody = {};
    if (fake) {
      if (modelAttrs[deleteUserIdField]) {
        fakeBody[deleteUserIdField] = OpUser.id;
      }
      if (modelAttrs[deleteTimeField]) {
        fakeBody[deleteTimeField] = Date.now();
      }
    }
    // destroy
    // const ret = await this.Service.removeById(id, { plain: true, fake, fakeBody });
    const ret = await this.Service.remove({ params }, { plain: true, fake, fakeBody });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret, 204);
  }

  /**
   * ### 删除 资源 (批量)
   *
   * ```js
   * // example: deleteCount
   * 返回结果
   * ```
   *
   * @apiname /resources
   * @method DELETE
   * @login true
   * @whocanuse
   *
   * @param {number} resp 返回值说明 - 值为删除的记录数量
   *
   * @returns
   * @memberof BaseController
   */
  async removeAll() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
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
    const { fake, deleteUserIdField, deleteTimeField } = this;
    const modelAttrs = this.Service.model.rawAttributes;
    const fakeBody = {};
    if (fake) {
      if (modelAttrs[deleteUserIdField]) {
        fakeBody[deleteUserIdField] = OpUser.id;
      }
      if (modelAttrs[deleteTimeField]) {
        fakeBody[deleteTimeField] = Date.now();
      }
    }
    // destroy
    const ret = await this.Service.remove({ params: _.concat({}, params, query) }, { plain: true, fake, fakeBody });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret, 204);
  }

  /**
   * 处理列表查询参数
   * 包括 搜索 筛选 及排序
   *
   * @returns {Object} { sort, search, filter }
   * @memberof BaseController
   */
  handleListOptions() {
    const { ctx } = this;
    const query = ctx.request.query;
    const opt = {/* count: true*/};
    const otherParams = _.omit(query, ['page', 'size', 'offset', 'attrs', 'attributes', 'sort', 'include']);
    opt.search = [];
    opt.filter = {};
    const rawAttributes = _.keys(this.Service.model.rawAttributes);
    _.map(otherParams, (val, key) => {
      if (key.slice(-3) === 'Key') {
        let type = 'fuzzy';
        let tmp = {
          key   : val,
          fields: [],
        };
        if (key.slice(-8) === 'RangeKey') {
          type = 'range';
          tmp = {
            key   : val.split(','),
            fields: [],
          };
        }
        let fields;
        if (type === 'fuzzy') {
          fields = _.filter((otherParams[`${key.slice(0, -3)}Fields`] || '').split(',')) || [];
        } else { //  === 'range'
          fields = _.filter((otherParams[`${key.slice(0, -8)}Fields`] || '').split(',')) || [];
        }
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
      const modelAttrs = this.Service.model.rawAttributes;
      const { deleteUserIdField, deleteTimeField } = this;
      if (modelAttrs[deleteUserIdField]) {
        opt.filter[deleteUserIdField] = null;
      }
      if (modelAttrs[deleteTimeField]) {
        opt.filter[deleteTimeField] = null;
      }
    }
    return opt;
  }

  /**
   * 处理返回字段信息
   * 数据来源于 query.attrs|query.attributes
   * 如果没有传入上面参数，则默认取值 this.attributes
   * 受限于 limitAttributes
   *
   * @returns
   * @memberof BaseController
   */
  handleAttributes() {
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

  /**
   * 处理分页信息
   * 数据来源于 query.page query.size query.offset
   * 如果没有传入上面参数，则默认取值 page 取 1，size 取 this.size，offset 取 0
   * 受限于 limitMaxPage limitMaxSize
   *
   * @returns
   * @memberof BaseController
   */
  handlePagination() {
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

  /**
   * 处理联表信息
   * 数据来源于 query.include query.includeAttrs|query.includeAttributes
   * 如果没有传入上面参数，则默认取值 this.include 及 this.includeAttributes
   * 受限于 limitInclude limit
   *
   * @returns
   * @memberof BaseController
   */
  handleInclude() {
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
          let attributes = query.includeAttributes || query.includeAttrs || this.includeAttributes;
          attributes = attributes ? attributes[item] : undefined;
          if (attributes && typeof attributes === 'string') {
            attributes = attributes.split(',');
          }
          if (this.limit.includeAttributes[item]) {
            if (attributes) {
              _.remove(attributes, attr => this.limit.includeAttributes[item].indexOf(attr) === -1);
            } else {
              attributes = this.limit.includeAttributes[item];
            }
          }
          includeList.push({ preset: item, attributes });
        }
      });
    }
    return includeList;
  }

  /**
   * 处理 query 参数，应用字段映射表转换相应字段数据
   * - 使用 fieldMap 进行转换
   */
  handleQueryFields() {
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
                  valueFields[idx] = p + this.fieldMap[field.slice(1)];
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

