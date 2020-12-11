'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
// const chalk = require('chalk');

const Egg = require('egg');
const moment = require('moment');

/* eslint-disable no-bitwise */
/* eslint-disable max-len */


/**
 * BaseController
 * controller 基类
 *
 * 目前包含 list[All], show, add[Multi], edit[Multi], remove[Multi],
 *
 * @constructor BaseController
 * @extends {Egg.Controller}
 */
class BaseController extends Egg.Controller {
  /**
   * Creates an instance of BaseController.
   *
   * @param {Egg.Context}     ctx     -
   * @param {Egg.BaseService} service -
   * @param {Object}   [preset={}]    -
   * @param {boolean|Object}   [preset.logging=false] - 日志输出
   * @param {string}   [preset.param='id']    - param 参数名（对应主键）
   * @param {number}   [preset.size=20]       - 默认页面大小
   * @param {Object}   [preset.rules={}]      - 指定各个方法的参数
   * @param {Array}    [preset.attributes]        - list[All] show方法 默认返回的参数 默认全部
   * @param {Array}    [preset.includeAttributes] - list[All] show方法 默认的子表返回的参数 默认全部
   * @param {Array}    [preset.include]           - list[All] show 方法 默认联表 默认为空
   * @param {Array}    [preset.sort]          - list[All]方法 默认排序方式
   * @param {Function} [preset.response]    - 使用自定义的返回值处理方法（传入参数为 1 结果 2 状态码）
   * @param {Array}    [preset.limitAttributes]   - 限制参数，限制返回的参数可选值
   * @param {Object}   [preset.limitIncludeAttributes] - 限制参数，限制子表返回的参数可选值 { [ 子表名 ]: [ ...limitAttributes ] }
   * @param {Array|string} [preset.limitSearchFields] - 限制参数，限制可搜索字段
   * @param {number}   [preset.limitMaxPage]      - 限制参数，限制最大页码 （设置了这个，list 类方法的 offset 参数则不会生效）
   * @param {number}   [preset.limitMaxSize]      - 限制参数，限制最大页面大小
   * @param {Array|string} [preset.limitInclude]      - 限制参数，限制可联的表
   * @param {Object} [preset.fieldMap]      - 字段映射表（设置相应值可以对外屏蔽真实数据库字段，而直接使用这个映射表的 key 作为参数传入）
   * @param {Object} [preset.export] - 导出表格配置 详细配置内容参考 utils/excel.js
   * @param {Object} [preset.export.colsStyle]     - 对应列的样式 (主要是设置列宽等通用属性)
   * @param {Object} [preset.export.headRowsStyle] - 头部行的样式（可以设置多行, 用于设置表头的样式）
   *                             如 [[CellStyle],rowStyle,[CellStyle]], 这样就设置了前三行的样式了
   *                             如果项是 CellStyle(数组)则设置每一个单元格的样式, 如果是 rowStyle(对象) 则设置整一行的样式
   * @param {Object} [preset.export.rowsStyle]     - 基本行的样式（用于设置表格内容每一行的样式, 可不设置使用默认样式）
   *                             从 headRowsStyle.length+1 行开始设置后面所有行的样式 ,
   *                             如果是数组则设置每一个单元格的样式, 如果是对象则设置整一行的样式
   * @param {Object} [preset.export.cellStyleMap]  - 单元格样式，针对特定单元格指定样式
   *                             格式如 { 'A3': CellStyle }
   *                             键为单元格坐标，值为单元格样式
   * @param {Function} [preset.addLogCallback]    -  记录日志方法，无参数，联动 baseService 的操作日志功能，从 ctx.opetatorLogs 中取数据库日志信息。
   * @memberof BaseController
   */
  constructor(ctx, service, preset = {}) {
    super(ctx);
    // model
    this.Service = service;
    this.model = this.Service ? this.Service.model : null;
    this.enums = this.Service ? this.Service.enums : null;
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
      param            : preset.param || (this.model && this.model.primaryKeyAttribute) || 'id',
      size             : preset.size || 20,
      rules            : preset.rules || {},
      attributes       : preset.attributes || preset.attrs || null,
      includeAttributes: preset.includeAttributes || preset.includeAttrs || null,
      include          : preset.include || null,
      sort             : preset.sort || null,
      fieldMap         : preset.fieldMap || {},
    });
    // export options
    this.export = preset.export || {};
    // this.export.colsStyle =
    // this.export.headRowsStyle =
    // this.export.rowsStyle =
    // this.export.cellStyleMap =

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
    if (global.NonError) {
      this.returnError = NonError;
    } else {
      this.returnError = Error;
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
   * @param {Object}  query                     - 请求参数
   * @param {number}  [query.page]              - 页码
   * @param {number}  [query.size]              - 页面大小
   * @param {number}  [query.offset]            - 偏移量
   * @param {string}  [query.searchKey]         - 通用模糊搜索关键字 - 如 key 搜索相应字段值是否含有值 key; 与 searchFields 参数搭配使用，否则无效
   * @param {string}  [query.searchRangeKey]    - 通用区间搜索关键字 - 如 1,6 搜索相应字段值在该范围内; 与 searchFields 参数搭配使用，否则无效
   * @param {string}  [query.searchFields]      - 通用搜索字段 - 与 search[Range]Key 参数搭配使用，否则无效
   * @param {string}  [query.attrs]             - 返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string}  [query.attributes]        - 返回字段列表 - 同 attrs
   * @param {boolean} [query.count]             - 是否返回数据总数
   * @param {string}  [query.include]           - 联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}    [query.includeAttrs]      - 子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}    [query.includeAttributes] - 子表返回字段列表 - 同 includeAttrs
   * @param {string}  [query.sort]              排序方式 - 如: -type,+createTime
   *
   * @param {Object} respData - 返回数据
   * @param {number} respData.count 数据总数
   * @param {Object[]} respData.rows 列表
   *
   * @returns
   * @memberof BaseController
   */
  async list() {
    const { ctx, config } = this;
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
    opt.plain = true;
    // find all
    const ret = await this.Service.list({ params, query: pagination }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    if (query.isExport || query.export) {
      const exportName = `${this.model.options.comment || this.model.name}.${moment().format('YYYYMMDD.HHmmss')}`;
      const head = this.handleGetAttributeComment(attributes || _.keys(this.model.rawAttributes));
      const rows = this.handleGetRowsAttributeValue(ret.rows);
      return await this.handleExportExcel(config.paths.export, exportName, head, rows);
    }
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
   * @param {Object} query                     - 请求参数
   * @param {string} [query.searchKey]         - 通用模糊搜索关键字 - 如 key 搜索相应字段值是否含有值 key; 与 searchFields 参数搭配使用，否则无效
   * @param {string} [query.searchRangeKey]    - 通用区间搜索关键字 - 如 1,6 搜索相应字段值在该范围内; 与 searchFields 参数搭配使用，否则无效
   * @param {string} [query.searchFields]      - 通用搜索字段 - 与 search[Range]Key 参数搭配使用，否则无效
   * @param {string} [query.attrs]             - 返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attributes]        - 返回字段列表 - 同 attrs
   * @param {string} [query.include]           - 联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}   [query.includeAttrs]      - 子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}   [query.includeAttributes] - 子表返回字段列表 - 同 includeAttrs
   * @param {string} [query.sort]              排序方式 - 如: -type,+createTime
   *
   * @param {Object[]} respData - 返回数据
   *
   * @returns
   * @memberof BaseController
   */
  async listAll() {
    const { ctx, config } = this;
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
    const query = ctx.request.query;
    const pagination = { page: 1, size: 0, offset: 0 };
    const attributes = this.handleAttributes();
    const include = this.handleInclude();
    const opt = this.handleListOptions();
    opt.count = false;
    opt.attributes = attributes;
    opt.include = include;
    opt.plain = true;
    // find all
    const ret = await this.Service.list({ params, query: pagination }, opt);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    if (query.isExport || query.export) {
      const exportName = `${this.model.options.comment || this.model.name}.${moment().format('YYYYMMDD.HHmmss')}`;
      const head = this.handleGetAttributeComment(attributes || _.keys(this.model.rawAttributes));
      const rows = this.handleGetRowsAttributeValue(ret);
      return await this.handleExportExcel(config.paths.export, exportName, head, rows);
    }
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
   * @param {Object} params    - 路由参数
   * @param {number} params.id - 主键
   * @param {Object} query                     - 请求参数
   * @param {string} [query.attrs]             - 返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.attributes]        - 返回字段列表 - 逗号分隔字符串（优先级 attributes > attrs > 初始化 controller 时的 attributes）
   * @param {string} [query.include]           - 联表 - 如: Button; 值为于 service 中预设的联表映射键
   * @param {json}   [query.includeAttrs]      - 子表返回字段列表 - 如 {"Button":"id,name"} 格式为一个 `子表名` 与 `字段列表` 的键值对 JSON 串
   *                                            `子表名` 与 `include` 参数相对应，`字段列表` 格式与 `attributes` 参数一致
   * @param {json}   [query.includeAttributes] - 子表返回字段列表 - 同 includeAttrs
   *
   * @param {Object} respData - 返回数据
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
   * @param {Object} body - 请求参数
   *
   * @param {Object} respData - 返回数据
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
    const { createUserIdField, createTimeField } = this.Service;
    if (createUserIdField && OpUser) {
      body[createUserIdField] = OpUser.id;
    }
    if (createTimeField) {
      body[createTimeField] = Date.now();
    }
    await this.handleUniqueCheck('add');
    // create
    const ret = await this.Service.add({ params, body });
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
  }

  /**
   * ### 创建新的 资源 (批量)
   *
   * ```js
   * // example: instance
   * 返回结果
   * ```
   *
   * @apiname /resources/multi
   * @method POST
   * @login true
   * @whocanuse
   *
   * @param {Object} body         - 请求参数
   * @param {Array}  body.records - 批量添加的数据记录
   *
   * @param {Object} respData - 返回数据
   *
   * @returns
   * @memberof BaseController
   */
  async addMulti() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.addMulti) {
      ctx.validate(this.rules.addMulti);
    }
    const params = ctx.params;
    const body = ctx.request.body;
    const records = body.records;
    const extData = { ...params };
    const { createUserIdField, createTimeField } = this.Service;
    if (createUserIdField && OpUser) {
      extData[createUserIdField] = OpUser.id;
    }
    if (createTimeField) {
      extData[createTimeField] = Date.now();
    }
    if (_.keys(extData).length) {
      _.map(records, record => {
        _.assign(record, extData);
      });
    }
    await this.handleUniqueCheck('addMulti');
    // create
    const ret = await this.Service.addMulti(records);
    // log
    if (this.addLogCallback) {
      await this.addLogCallback();
    }
    // response
    return await this.response(ret);
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
   * @param {Object} params    - 路由参数
   * @param {number} params.id - 主键
   * @param {Object} body - 请求参数
   *
   * @param {number[]} respData - 返回数据 - 值为变动的记录数量 ([ 1 ])
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
    const { updateUserIdField, updateTimeField } = this.Service;
    if (updateUserIdField && OpUser) {
      body[updateUserIdField] = OpUser.id;
    }
    if (updateTimeField) {
      body[updateTimeField] = Date.now();
    }
    await this.handleUniqueCheck('edit');
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
   * @param {Object} body - 请求参数
   *
   * @param {number[]} respData - 返回数据 - 值为变动的记录数量
   *
   * @returns
   * @memberof BaseController
   */
  async editMulti() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.editMulti) {
      ctx.validate(this.rules.editMulti);
    } else if (this.rules.edit) {
      const primaryKey = this.model.primaryKeyAttribute;
      ctx.validate(_.omit(this.rules.edit, primaryKey));
    }
    const params = ctx.params;
    const query = ctx.request.query;
    const body = ctx.request.body;
    const opt = { plain: true };
    const { updateUserIdField, updateTimeField } = this.Service;
    if (updateUserIdField && OpUser) {
      body[updateUserIdField] = OpUser.id;
    }
    if (updateTimeField) {
      body[updateTimeField] = Date.now();
    }
    await this.handleUniqueCheck('editMulti');
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
   * @param {Object} params    - 路由参数
   * @param {number} params.id - 主键
   *
   * @param {number} respData - 返回数据 - 值为删除的记录数量 (1)
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
    const { fake, deleteUserIdField, deleteTimeField } = this.Service;
    const fakeBody = {};
    if (fake) {
      if (deleteUserIdField && OpUser) {
        fakeBody[deleteUserIdField] = OpUser.id;
      }
      if (deleteTimeField) {
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
    return await this.response(ret);
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
   * @param {number} respData - 返回数据 - 值为删除的记录数量
   *
   * @returns
   * @memberof BaseController
   */
  async removeMulti() {
    const { ctx } = this;
    const { user:OpUser } = ctx.session;
    if (!this.Service) {
      return null;
    }
    if (this.rules.removeMulti) {
      ctx.validate(this.rules.removeMulti);
    } else if (this.rules.remove) {
      const primaryKey = this.model.primaryKeyAttribute;
      ctx.validate(_.omit(this.rules.remove, primaryKey));
    }
    const params = ctx.params;
    const query = ctx.request.query;
    const { fake, deleteUserIdField, deleteTimeField } = this.Service;
    const fakeBody = {};
    if (fake) {
      if (deleteUserIdField && OpUser) {
        fakeBody[deleteUserIdField] = OpUser.id;
      }
      if (deleteTimeField) {
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
    return await this.response(ret);
  }

  /**
   * 处理列表查询参数
   * 包括 搜索 筛选 及排序
   *
   * @returns {{sort: Egg.Sort, search: Egg.Search, filter: Egg.Filter}} { sort, search, filter }
   * @memberof BaseController
   */
  handleListOptions() {
    const { ctx } = this;
    const query = ctx.request.query;
    const opt = {/* count: true*/};
    const otherParams = _.omit(query, ['page', 'size', 'offset', 'attrs', 'attributes', 'sort', 'include']);
    opt.search = [];
    opt.filter = {};
    const rawAttributes = _.keys(this.model.rawAttributes);
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
      const { deleteUserIdField, deleteTimeField } = this.Service;
      if (deleteUserIdField) {
        opt.filter[deleteUserIdField] = null;
      }
      if (deleteTimeField) {
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
   * @returns {string[]} attributes
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
   * @returns {Egg.QueryObject} { page, size, offset }
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
   * @returns {Egg.Include} includeList
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
          const includeItem = { preset: item };
          if (attributes) {
            includeItem.attributes = attributes;
          }
          includeList.push(includeItem);
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
          delete query[key];
        }
      });
    }
  }

  /**
   * 将属性值`翻译成`中文(comment)
   *
   * @param {Array|string} attr 属性[数组]
   * @returns {Array|string}
   */
  handleGetAttributeComment(attr) {
    const rawAttributes = this.model.rawAttributes;
    if (Array.isArray(attr)) {
      return _.map(attr, a => (rawAttributes[a] ? rawAttributes[a].comment || a : a));
    }
    return rawAttributes[attr] ? rawAttributes[attr].comment || attr : attr;
  }

  /**
   * 处理将要导出的数据的属性值
   *
   * null undefined 值处理成空字符串
   * 时间格式 处理成 YYYY-MM-DD HH:mm:ss
   * 含有枚举（BaseService 配置）处理成相应的枚举值
   *
   * @param {Array<Object>} rows 导出列表
   * @returns {Array<*>}
   */
  handleGetRowsAttributeValue(rows) {
    const { createTimeField, updateTimeField, deleteTimeField } = this.Service;
    return _.map(rows, row => {
      const keys = _.keys(row);
      const ret = _.values(row);

      _.map(ret, (item, idx) => {
        if (_.isNull(item) || _.isUndefined(item)) {
          ret[idx] = '';
        } else if ((typeof item === 'object' && moment.isDate(item))
                || ([createTimeField, updateTimeField, deleteTimeField].indexOf(keys[idx]) >= 0)
        ) {
          if (item) {
            ret[idx] = moment(item).format('YYYY-MM-DD HH:mm:ss');
          } else {
            ret[idx] = '-';
          }
        } else if (this.enums && this.enums[keys[idx]]) {
          ret[idx] = this.enums[keys[idx]][item];
        }
      });
      return ret;
    });
  }

  /**
   * 数据库中唯一字段检测（add、edit、addMulti、editMulti 用）
   *
   * @param {string} type - add、edit、addMulti、editMulti
   * @param {Array} records - 添加记录列表 - addMulti 模式使用
   */
  async handleUniqueCheck(type, records) {
    const { ctx } = this;
    const { params } = ctx;
    const { body } = ctx.request;
    const primaryKeyAttribute = this.model.primaryKeyAttribute;
    const rawAttributes = this.model.rawAttributes;
    const rawAttributeList = _.map(rawAttributes);

    const uniqueFieldsAffected = [];
    const uniqueFieldsAffectedView = [];
    const uniqueCondition = [];
    if (type === 'add' || type === 'edit') {
      // 单字段唯一索引
      _.map(rawAttributeList, attr => {
        if (attr.unique && body[attr.fieldName]) {
          uniqueFieldsAffected.push(attr.fieldName);
          uniqueFieldsAffectedView.push(`${attr.comment}（${body[attr.fieldName]}）`);
          uniqueCondition.push({ [attr.fieldName]: body[attr.fieldName] });
        }
      });
      // 多字段唯一索引
      _.map(this.model.options.indexes, index => {
        if (index.unique && _.intersection(index.fields, _.keys(body)).length) {
          uniqueFieldsAffected.push(index.fields);
          const uniqueFieldsAffectedViewItem = [];
          const uniqueConditionItem = {};
          _.map(index.fields, f => {
            uniqueFieldsAffectedViewItem.push(`${rawAttributes[f].comment}（${body[f]}）`);
            uniqueConditionItem[f] = body[f];
          });
          uniqueFieldsAffectedView.push(uniqueFieldsAffectedViewItem);
          uniqueCondition.push(uniqueConditionItem);
        }
      });
    } else if (type === 'addMulti') {
      // 单字段唯一索引
      for (let i = 0; i < rawAttributeList.length; i++) {
        const attr = rawAttributeList[i];
        const recordValueList = [];
        _.map(records, record => {
          if (attr.unique && record[attr.fieldName]) {
            recordValueList.push(record[attr.fieldName]);
          }
        });
        if (recordValueList.length) {
          if (_.uniq(recordValueList).length !== recordValueList.length) {
            throw new this.returnError(`批量添加的记录中存在唯一字段的重复记录（${attr.fieldName}）`);
          }
          uniqueFieldsAffected.push(attr.fieldName);
          uniqueFieldsAffectedView.push(`${attr.comment}（${recordValueList.join(', ')}）`);
          uniqueCondition.push({ [attr.fieldName]: recordValueList });
        }
      }
      // 多字段唯一索引
      for (let i = 0; i < this.model.options.indexes.length; i++) {
        const index = this.model.options.indexes[i];
        const recordAffectedViewItemList = [];
        const recordConditionItemValueList = [];
        _.map(records, record => {
          if (index.unique && _.intersection(index.fields, _.keys(record)).length) {
            const uniqueFieldsAffectedViewItem = [];
            const uniqueConditionItem = {};
            _.map(index.fields, f => {
              uniqueFieldsAffectedViewItem.push(`${rawAttributes[f].comment}（${record[f]}）`);
              uniqueConditionItem[f] = record[f];
            });
            recordAffectedViewItemList.push(uniqueFieldsAffectedViewItem);
            recordConditionItemValueList.push(uniqueConditionItem);
          }
        });
        if (recordConditionItemValueList.length) {
          // 列表数据重复判断
          if (_.uniqBy(recordConditionItemValueList, item => `${_.values(_.pick(item, index.fields)).join('-')}`).length !== recordConditionItemValueList.length) {
            throw new this.returnError(`批量添加的记录中存在唯一索引的重复记录（${index.fields.join('-')}）`);
          }
          uniqueFieldsAffected.push(index.fields);
          uniqueFieldsAffectedView.push(recordAffectedViewItemList);
          uniqueCondition.push(recordConditionItemValueList);
        }
      }
    }
    switch (type) {
      case 'add': {
        const match = await this.Service.info({ }, {
          attributes: [primaryKeyAttribute, ..._.flattenDeep(uniqueFieldsAffected)],
          filter    : { [Op.or]: uniqueCondition },
          scope     : 'all',
          plain     : true,
        });
        if (match) {
          throw new this.returnError(`添加的记录已有存在于数据表中（${JSON.stringify(match)}）`);
        }
        break;
      }
      case 'edit': {
        const primaryKeyValue  = params[primaryKeyAttribute] || body[primaryKeyAttribute];
        const match = await this.Service.info({ params: { [primaryKeyAttribute]: { [Op.not]: primaryKeyValue } } }, {
          attributes: [primaryKeyAttribute, ..._.flattenDeep(uniqueFieldsAffected)],
          filter    : { [Op.or]: uniqueCondition },
          scope     : 'all',
          plain     : true,
        });
        if (match) {
          throw new this.returnError(`修改的结果已有存在于数据表中（${JSON.stringify(match)}）`);
        }
        break;
      }
      case 'addMulti': {
        const match = await this.Service.info({ }, {
          attributes: [primaryKeyAttribute, ..._.flattenDeep(uniqueFieldsAffected)],
          filter    : { [Op.or]: uniqueCondition },
          scope     : 'all',
          plain     : true,
        });
        if (match) {
          throw new this.returnError(`批量添加的记录已有存在于数据表中（${JSON.stringify(match)}）`);
        }
        break;
      }
      case 'editMulti':
      case 'editAll':
        throw new this.returnError('批量修改模式下不允许修改唯一属性字段');
      default:
        // pass
        break;
    }
  }

  /**
   * 处理列表导出功能(单页)
   *
   * @param {string} tmpPath - 表格临时存储目录
   * @param {string} exportName - 导出文件名
   * @param {Array}  head - 表头数据
   * @param {Array}  rows - 列表数据
   * @param {Object} [sheetStyle] - 表格配置 详细配置内容参考 utils/excel.js
   * @param {Object} [sheetStyle.colsStyle]     - 对应列的样式 (主要是设置列宽等通用属性)
   * @param {Object} [sheetStyle.headRowsStyle] - 头部行的样式（可以设置多行, 用于设置表头的样式）
   *                             如 [[CellStyle],rowStyle,[CellStyle]], 这样就设置了前三行的样式了
   *                             如果项是 CellStyle(数组)则设置每一个单元格的样式, 如果是 rowStyle(对象) 则设置整一行的样式
   * @param {Object} [sheetStyle.rowsStyle]     - 基本行的样式（用于设置表格内容每一行的样式, 可不设置使用默认样式）
   *                             从 headRowsStyle.length+1 行开始设置后面所有行的样式 ,
   *                             如果是数组则设置每一个单元格的样式, 如果是对象则设置整一行的样式
   * @param {Object} [sheetStyle.cellStyleMap]  - 单元格样式，针对特定单元格指定样式
   *                             格式如 { 'A3': CellStyle }
   *                             键为单元格坐标，值为单元格样式
   */
  async handleExportExcel(tmpPath, exportName, head, rows, sheetStyle) {
    const { ctx } = this;
    if (ctx.helper.excel) {
      if (['.xls', '.xlsx'].indexOf(path.extname(exportName)) === -1) {
        exportName += '.xlsx';
      }

      sheetStyle = sheetStyle || {};
      sheetStyle.colsStyle = sheetStyle.colsStyle || this.export.colsStyle || new Array(head.length).fill({ width: 20 });
      sheetStyle.headRowsStyle = sheetStyle.headRowsStyle || this.export.headRowsStyle || [new Array(head.length).fill({
        font: { name: '宋体', bold: true, size: 12, color: { argb: 'fffafaff' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ff608dfa' } },
      })];
      sheetStyle.rowsStyle = sheetStyle.rowsStyle || this.export.rowsStyle || { font: { name: '宋体' }, alignment: { wrapText: false } };
      sheetStyle.cellStyleMap = sheetStyle.cellStyleMap || this.export.cellStyleMap || undefined;

      const filePath = await ctx.helper.excel.generateTable(tmpPath, { sheet1: { rows: _.concat([head], rows), ...sheetStyle } });
      ctx.attachment(exportName);
      ctx.body = fs.createReadStream(filePath);
      return;
    }
    return await this.response(rows);
  }

  /**
   * response json data to client
   *
   * usage: ResponseJSON.call(this, ...)
   *
   * @static
   * @param {any} promise  -
   * @param {number} [successCode=0] -
   * @memberof BaseController
   */
  static async ResponseJSON(promise, successCode = 0) {
    const { ctx } = this;
    ctx.type = 'json';
    try {
      const data = await promise;
      ctx.apiResult = { code: successCode || 0, data, ext: { query: ctx.query } };
    } catch (err) {
      ctx.apiResult = { code: 1001, msg: err.message };
    }
  }

  /**
   * convert instance to plain object
   *
   * @static
   * @param {Array<Object>|Object} data -
   * @param {boolean} [plain] -
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

