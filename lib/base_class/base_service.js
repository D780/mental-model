'use strict';

/* eslint-disable */
const _ = require('lodash');
const Sequelize = require('sequelize');
// const qg        = require('sequelize/lib/dialects/mysql/query-generator');
const chalk = require('chalk');
const Op = Sequelize.Op;
const Utils = Sequelize.Utils;
/* eslint-enable */

const Egg = require('egg');
const path = require('path');
const stackInfo = require('./stackInfo');
/* eslint-disable no-bitwise */
/* eslint-disable max-statements */
/* eslint-disable max-depth */
/* eslint-disable max-len */

const HANDLEPRESETINCLUDES = Symbol('baseService#handlePresetIncludes');

const HANDLEOPTIONS = Symbol('baseService#handleOptions');
const HANDLEPAGINATION = Symbol('baseService#handlePagination');
const HANDLEINCLUDES = Symbol('baseService#handleIncludes');
const HANDLESEARCHS = Symbol('baseService#handleSearchs');
const HANDLESORTS = Symbol('baseService#handleSorts');
const HANDLEFILTERS = Symbol('baseService#handleFilters');
const HANDLEATTRIBUTES = Symbol('baseService#handleAttributes');
const HANDLENESTEDWHERE = Symbol('baseService#handleNestedWhere');
const HANDLENESTEDWHEREFILTERR = Symbol('baseService#handleNestedWhereFilterR');
const HANDLESUBTABLESEARCH  = Symbol('baseService#handleSubTableSearch');

const SETXXXUSERANDTIME  = Symbol('baseService#setXXXUserAndTime');
const SETXXXUSERANDTIMERAW  = Symbol('baseService#setXXXUserAndTimeRaw');
const GETUPDATEEDATA  = Symbol('baseService#getUpdatedData');
const GETDELETEEDATA  = Symbol('baseService#getDeletedData');
const FILTERDELETEEDATA  = Symbol('baseService#filterDeletedData');
const HANDLESCOPE  = Symbol('baseService#handleScope');

const HANDLENESTEDFIELDS = Symbol('baseService#handleNestedFields');
const HANDLEUNDEFINEDVALUES = Symbol('baseService#handleUndefinedValues');
const HANDLEINPUT = Symbol('baseService#handleinput');

const GENERATEOPERATORLOG = Symbol('baseService#generateOperatorLog');
const DEALOPERATORLOG = Symbol('baseService#dealOperatorLog');

// 记录执行报错的文件位置
const RUNFILEPATH = Symbol.for('baseService#runFilePath');

/**
 * BaseService
 * service 基类
 * 提供基于 sequelize@^4 的常用功能的实现，减少没必要冗余代码
 * 包括（暂定）list[AndCount][All] count[All]
 *            info[ById]
 *            add[Multi] edit[ById] remove[ById] set
 *            moreById refreshById indexById nth first last
 *            increase[ById] decrease[ById] editSelf[ById]
 *            move[ById] moveUp[ById] moveDown[ById] change[ById]
 * @constructor BaseService
 * @extends {Egg.Service}
 */
class BaseService extends Egg.Service {
  /**
   * Creates an instance of BaseService.
   *
   * @param {Egg.Context} ctx   -
   * @param {Egg.EggModelType|Sequelize.ModelType}  model -
   * @param {Object}  [preset]             预设值
   * @param {number}  [preset.size=20]     可选, 默认 20 分页大小
   * @param {boolean}  [preset.fake]          - 可选，是否为假删除方式， 默认 false
   * @param {string}   [preset.sessionUserIdField] - 可选，存储与 session 的 user 的 id 字段名，默认 id，在条件允许的情况下（含有 session 并且未传入 body.XXXUserId）时获取操作人信息补全数据
   * @param {string}   [preset.createUserIdField]  - 可选，createUserId 字段名，默认 createUserId，在 add 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.createTimeField]    - 可选，createTime 字段名，默认 createTime，在 add 接口会自动追加上相应的数据
   * @param {string}   [preset.updateUserIdField]  - 可选，updateUserId 字段名，默认 updateUserId，在 edit 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.updateTimeField]    - 可选，updateTime 字段名，默认 updateTime，在 edit 接口会自动追加上相应的数据
   * @param {string}   [preset.deleteUserIdField]  - 可选，fake 为 true 时有效，deleteUserId 字段名，默认 deleteUserId，在 remove 接口会自动追加上相应的数据 (session.user.id)
   * @param {string}   [preset.deleteTimeField]    - 可选，fake 为 true 时有效，deleteTime 字段名，默认 deleteTime，在 remove 接口会自动追加上相应的数据
   * @param {boolean|Object}  [preset.logging=false] - 日志输出
   * @param {Object.<string, Egg.IncludePreset>}  [preset.include] - 预设联表关系={key:value}
   * @param {boolean}  [preset.operatorLog]    -  是否开启操作日志整理，开启则会把操作记录整理到 ctx.operatorLogs 中
   * @param {string[]} [preset.logField]       -  日志记录字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集
   * @param {string[]} [preset.logOmitField]   -  日志记录排除字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集
   * @param {Object}   [preset.enums]          -  字段可取值枚举，格式为 { [字段名]: 值映射对象 } 如 { enable: { 0: '禁用', 1: '启用' } } 。 仅 operatorLog === true 有用。用于日志信息显示。
   * @param {Function} [preset.addLogCallback] -  记录日志方法，方法传入一个参数：该方法产生的操作日志。仅 operatorLog === true 有用。
   * @memberof BaseService
   */
  constructor(ctx, model, preset = {}) {
    super(ctx);

    // model
    this.model = model;
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
    this.sequelize = ctx.model;
    // findOpts
    _.assign(this, {
      size   : preset.size || 20,
      include: preset.include || {},
    });
    // 创建|编辑|删除 操作人操作时间字段信息配置
    this.fake = preset.fake || false;
    this.sessionUserIdField = preset.sessionUserIdField || 'id';
    const createUserIdField = preset.createUserIdField || 'createUserId';
    const createTimeField  = preset.createTimeField || 'createTime';
    const updateUserIdField = preset.updateUserIdField || 'updateUserId';
    const updateTimeField  = preset.updateTimeField || 'updateTime';
    const deleteUserIdField = preset.deleteUserIdField || 'deleteUserId';
    const deleteTimeField  = preset.deleteTimeField || 'deleteTime';

    let rawAttributes = [];
    if (this.model) {
      rawAttributes = this.model.rawAttributes;
      if (rawAttributes[createUserIdField]) {
        this.createUserIdField = createUserIdField;
      }
      if (rawAttributes[createTimeField]) {
        this.createTimeField = createTimeField;
      }
      if (rawAttributes[updateUserIdField]) {
        this.updateUserIdField = updateUserIdField;
      }
      if (rawAttributes[updateTimeField]) {
        this.updateTimeField = updateTimeField;
      }
      if (rawAttributes[deleteUserIdField]) {
        this.deleteUserIdField = deleteUserIdField;
      }
      if (rawAttributes[deleteTimeField]) {
        this.deleteTimeField = deleteTimeField;
      }
    }

    this.operatorLog = preset.operatorLog || false;
    // if (this.operatorLog) {
    // 自动生成日志相关数据预处理
    this.fieldNameMap = {};
    _.map(rawAttributes, (rawAttrInfo, rawAttrKey) => {
      if (rawAttrInfo.comment) {
        this.fieldNameMap[rawAttrKey] = rawAttrInfo.comment;
      } else if (rawAttrInfo.primaryKey) {
        this.fieldNameMap[rawAttrKey] = `主键(${rawAttrKey})`;
      } else {
        this.fieldNameMap[rawAttrKey] = rawAttrKey;
      }
    });
    this.modelNameMap = {};
    _.map(this.sequelize.models, (modelInstance, key) => {
      this.modelNameMap[key] = modelInstance.options.comment || key;
      // this.modelNameMap[key]= model.tableName || key;
    });
    const tmpEnums = preset.enums || {};
    this.enums = {};
    // 兼容另一种写法的枚举格式
    _.map(tmpEnums, (ei, key) => {
      if (typeof ei === 'object' && ei.hasOwnProperty('getEnumNameByValue') && ei.hasOwnProperty('getEnumKeyByValue') && ei.hasOwnProperty('getValues')) {
        const valueList = ei.getValues();
        const t = {};
        _.map(valueList, v => {
          t[v] = ei.getEnumNameByValue(v);
        });
        this.enums[key] = t;
      } else {
        this.enums[key] = ei;
      }
    });
    this.operatorLogInfos = [];
    if (preset.logField || preset.logOmitField) {
      this.logField = _.difference(preset.logField || _.keys(this.fieldNameMap), preset.logOmitField || []);
    }
    this.addLogCallback = preset.addLogCallback || undefined;
    // }
  }

  // ===============================================================================
  // Sequelize Review Function Start ===============================================
  // ===============================================================================

  /**
   * review sequelize.query
   * @param {string}  sql          - sql 语句
   * @param {Object}  [options={}] - 可选参数
 // * @param {boolean} options.plain         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {*}       [options.replacements] -  可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效.
   * @param {*}       [options.bind]         -  可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效.
   * @param {string}  [options.type]         -  可选，sequelize.query 参数.
   * @param {Sequelize.Transaction}  [options.transaction]  -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]         -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   */
  async query(sql, options) {
    const ret = await this.sequelize.query(sql, options);
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type  : 'all',
        method: 'query',
        sql,
      });
    }
    return ret;
  }

  /**
   * review sequelize.select
   * @param {string}  sql          - sql 语句
   * @param {Object}  [options={}] - 可选参数
  // * @param {boolean} options.plain        -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {*}       [options.replacements] -  可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效.
   * @param {*}       [options.bind]         -  可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效.
   * @param {string}  [options.type]         -  可选，sequelize.query 参数.
   * @param {Sequelize.Transaction}  [options.transaction]  -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]         -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   */
  async select(sql, options) {
    options.type = 'SELECT';
    const ret = await this.sequelize.query(sql, options);
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type  : 'all',
        method: 'select',
        sql,
      });
    }
    return ret;
  }

  /**
   * review sequelize.transaction
   * @param {Object} [options] - 可选参数
   * @param {boolean} [options.autocommit=true]   可选，设置事务的autocommit（自动完成）属性，默认 true
 //  * @param {string} [options.deferrable]   可选，设置立即或延迟检查约束 （貌似仅用于 postgresql）
   * @param {string} [options.isolationLevel] 可选，事务隔离级别，默认为 REPEATABLE READ，推荐使用 Sequelize 提供的枚举
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED // "READ UNCOMMITTED"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED // "READ COMMITTED"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ  // "REPEATABLE READ"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE // "SERIALIZABLE"
   * @returns {Promise<Sequelize.Transaction>}
   */
  async transaction(options) {
    return await this.sequelize.transaction(options);
  }

  // ===============================================================================
  // Base Function Start ===========================================================
  // ===============================================================================

  /**
   * list instances
   *
   * @param {Object}  args                    - 接口参数
   * @param {Object}  [args.params]           - 可选，会作为 where 条件注入
   * @param {Object}  [args.query]            - query 参数
   * @param {number}  [args.query.page=1]       - 可选，默认 1
   * @param {number}  [args.query.size=20]      - 可选，默认 this.size || 20
   * @param {number}  [args.query.offset=0]     - 可选，默认 0
   * @param {Object}  [options={}]            - 可选参数
   * @param {boolean} [options.count]         -  可选，是否获取分页数据.默认 false | count list 至少一个为 true
   * @param {boolean} [options.list]          -  可选，是否获取列表数据.默认 true  | count list 至少一个为 true
   * @param {boolean} [options.splitSQL=true] -  可选，是否分拆联表语句进行搜索.默认 true，此时如果搜索字段涉及了子表字段，则会将该条件在子表中进行搜索转换成主表中的主键搜索条件
   * @param {Egg.Scope} [options.scope='default']     -  可选，搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。其他三项
   *                                                         为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的
   * @param {boolean} [options.plain=false]         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {string[]}      [options.attributes]    -  可选，需要获取的属性列表.默认全部.
   * @param {Egg.Include[]} [options.include]       -  可选，include 联表配置.
   * @param {Egg.Search[]}  [options.search]        -  可选，关键字搜索.  [{key:string|[string,string],fields:[string|{[prefix,]field,type,mode}|[string|{[prefix,]field,type,mode}]}]
   *                                                 prefix 是联表的时候使用的，用于在外层搜索联表的字段
   * @param {Egg.Sort}   [options.sort]          -  可选，指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   *                                                  排序规则字段后面带 [GBK] 表示使用 GBK 编码排序，也就是按拼音排序
   * @param {Egg.Filter}   [options.filter]      -  可选，过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async list(args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    if (_.isUndefined(options.list) || !options.count) {
      options.list = true;
    }
    this[HANDLEINPUT](params, options);
    const opts = await this[HANDLEOPTIONS](params, query, options);
    let where;
    if (Reflect.ownKeys(opts.search) || Reflect.ownKeys(opts.filter)) {
      where = { [Op.and]: [params, opts.search, opts.filter] };
    } else {
      where = params;
    }
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    this[HANDLESCOPE](scope, where);
    const findOptions = {
      attributes : opts.attributes || undefined,
      where,
      include    : opts.include,
      limit      : opts.pagination.size || undefined,
      offset     : (opts.pagination.offset + (opts.pagination.page - 1) * opts.pagination.size) || undefined,
      order      : opts.sort || [],
      distinct   : true,
      // raw        : true,
      transaction: options.transaction,
      lock       : options.lock,
    };
    let result;
    // find and count
    if (options.count) {
      if (options.list) {
        result = await this.model.findAndCountAll(findOptions);
        result.rows = BaseService.toJSON(result.rows, options.plain);
      } else {
        result = await this.model.count(findOptions);
        // result.rows = BaseService.toJSON(result.rows, options.plain);
      }
    } else {
      result = await this.model.findAll(findOptions);
      result = BaseService.toJSON(result, options.plain);
    }
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type   : 'search',
        method : 'list',
        count  : options.list ? (result.rows ? result.rows.length : result.length) : 0,
        params,
        query,
        options,
        include: opts.include,
        sort   : opts.sort,
      });
    }
    return result;
  }

  /**
   * list all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                    - 接口参数
   * @param {Object}  [args.params]           - 可选，会作为 where 条件注入
   * @param {Object}  [options={}]            - 可选参数
   * @param {boolean} [options.count]         -  可选，是否获取分页数据.默认 false | count list 至少一个为 true
   * @param {boolean} [options.list]          -  可选，是否获取列表数据.默认 true  | count list 至少一个为 true
   * @param {Egg.Scope} [options.scope='default']     -  可选，搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。其他三项
   *                                                       为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的
   * @param {boolean} [options.plain=false]         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {string[]}      [options.attributes]    -  可选，需要获取的属性列表.默认全部.
   * @param {Egg.Include[]} [options.include]       -  可选，include 联表配置.
   * @param {Egg.Search[]}  [options.search]        -  可选，关键字搜索.  [{key:string|[string,string],fields:[string|{[prefix,]field,type,mode}|[string|{[prefix,]field,type,mode}]}]
   *                                                 prefix 是联表的时候使用的，用于在外层搜索联表的字段
   * @param {Egg.Sort}   [options.sort]          -  可选，指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   *                                                  排序规则字段后面带 [GBK] 表示使用 GBK 编码排序，也就是按拼音排序
   * @param {Egg.Filter}   [options.filter]      -  可选，过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async listAll(args = {}, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    const query = { page: 1, size: 0, offset: 0 };
    return this.list({ params, query }, options);
  }

  /**
   * count instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                  -
   * @param {Object}  [args.params]         -
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   -
   * @param {number}  [args.query.size=20]  -
   * @param {number}  [args.query.offset=0] -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async count(args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    options.count = true;
    options.list = false;
    return this.list({ params, query }, options);
  }

  /**
   * count instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                  -
   * @param {Object}  [args.params]         -
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   -
   * @param {number}  [args.query.size=20]  -
   * @param {number}  [args.query.offset=0] -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async countAll(args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    options.count = true;
    options.list = false;
    return this.list({ params, query }, options);
  }

  /**
   * list and count all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                  -
   * @param {Object}  [args.params]         -
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   -
   * @param {number}  [args.query.size=20]  -
   * @param {number}  [args.query.offset=0] -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async listAndCount(args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    options.count = true;
    options.list = true;
    return this.list({ params, query }, options);
  }

  /**
   * list and count all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                  -
   * @param {Object}  [args.params]         -
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   -
   * @param {number}  [args.query.size=20]  -
   * @param {number}  [args.query.offset=0] -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async listAndCountAll(args = { }, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    options.count = true;
    options.list = true;
    return this.list({ params, query }, options);
  }

  /**
   * get an instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  args                  -
   * @param {Object}  [args.params]         -
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   -
   * @param {number}  [args.query.size=20]  -
   * @param {number}  [args.query.offset=0] -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async info(args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    const opts = await this[HANDLEOPTIONS](params, query, options);
    let where;
    if (Reflect.ownKeys(opts.search) || Reflect.ownKeys(opts.filter)) {
      where = { [Op.and]: [params, opts.search, opts.filter] };
    } else {
      where = params;
    }
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    this[HANDLESCOPE](scope, where);
    const findOptions = {
      attributes : opts.attributes,
      where,
      include    : opts.include,
      order      : opts.sort || [],
      // distinct   : true,
      // raw        : true,
      transaction: options.transaction,
      lock       : options.lock,
    };
    let result = await this.model.findOne(findOptions);
    result = BaseService.toJSON(result, options.plain);
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type   : 'search',
        method : 'info',
        params,
        query,
        options,
        include: opts.include,
        sort   : opts.sort,
      });
    }
    return result;
  }

  /**
   * get an instance by primary key
   *
   * @see {@link BaseService#list}
   * @param {number|string}  id             - 主键值
   * @param {Object}  [options={}]   -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async infoById(id, options = {}) {
    this[HANDLEINPUT](null, options);
    const opts = await this[HANDLEOPTIONS]({}, {}, options);
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    const where = { [this.model.primaryKeyAttribute]: id };
    this[HANDLESCOPE](scope, where);
    const findOptions = {
      attributes : opts.attributes,
      where,
      include    : opts.include,
      order      : opts.sort || [],
      transaction: options.transaction,
      lock       : options.lock,
    };
    let result = await this.model.findOne(findOptions);
    result = BaseService.toJSON(result, options.plain);
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type   : 'search',
        method : 'infoById',
        options,
        include: opts.include,
        sort   : opts.sort,
      });
    }
    return result;
  }

  /**
   * add an instance
   *
   * @param {Object}  args -
   * @param {Object}  [args.params] -
   * @param {Object}  [args.body]   -
   * @param {Object}  [options={}]          -
   * @param {boolean} [options.plain=false] -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async add(args = {}, options = {}) {
    const { params = {}, body = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    this[SETXXXUSERANDTIME]('create', body);
    const instance = await this.model.create(_.assign({}, params, body), { transaction: options.transaction, lock: options.lock });
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type  : 'add',
        method: 'add',
        after : BaseService.toJSON(instance, true),
      });
    }
    return BaseService.toJSON(instance, options.plain);
  }

  /**
   * add instances
   *
   * @param {Array}   records - 记录列表
   * @param {Object}  [options={}]          -
   * @param {boolean} [options.plain=false] -
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async addMulti(records, options = {}) {
    this[HANDLEINPUT](null, options);
    _.map(records, item => {
      this[SETXXXUSERANDTIME]('create', item);
    });
    const instances = await this.model.bulkCreate(records, { transaction: options.transaction, lock: options.lock });
    if (this.operatorLog) {
      this[GENERATEOPERATORLOG]({
        type  : 'add',
        method: 'addMulti',
        after : BaseService.toJSON(instances, true),
      });
    }
    return BaseService.toJSON(instances, options.plain);
  }

  /**
   * edit instances
   *
   * @param {Object}  args                        -
   * @param {Object}  [args.params]               -
   * @param {Object}  [args.body]                 -
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {boolean} [options.retValues=false]   -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]    -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async edit(args = {}, options = {}) {
    const { params = {}, body = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    this[SETXXXUSERANDTIME]('update', body);
    let oldInstances;
    const idList = [];
    const primaryKey = this.model.primaryKeyAttribute;
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    this[HANDLESCOPE](scope, params);

    if (options.retValues || options.retDiffs || this.operatorLog) {
      oldInstances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
      for (let i = 0; i < oldInstances.length; i++) {
        idList.push(oldInstances[i][primaryKey]);
      }
    }
    let ret = await this.model.update(body, { where: params, transaction: options.transaction, lock: options.lock });
    if (options.retValues || this.operatorLog) {
      const instances = await this.model
        .findAll({ where: { [primaryKey]: idList }, transaction: options.transaction, lock: options.lock });
      if ((options.retDiffs && oldInstances && oldInstances.length) || this.operatorLog) {
        oldInstances = BaseService.toJSON(oldInstances, true);
        const newInstances = BaseService.toJSON(instances, true);
        const diffs = BaseService.diffObjects(oldInstances, newInstances);
        ret = {
          before: oldInstances,
          after : newInstances,
          diffs,
        };
        if (this.operatorLog) {
          this[GENERATEOPERATORLOG]({
            type  : 'edit',
            method: 'edit',
            before: oldInstances,
            after : newInstances,
            diffs,
          });
        }
      } else {
        ret = BaseService.toJSON(instances, options.plain);
      }
    }
    return ret;
  }

  /**
   * edit an instance by primary key
   *
   * @param {number|string}  id            - 主键
   * @param {Object}  values        - 修改内容
   * @param {Object}  [options={}]  -
   * @param {Egg.Scope} [options.scope='default']  -
   * @param {boolean} [options.plain=false]        -
   * @param {boolean} [options.retValue=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiff=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async editById(id, values, options = {}) {
    this[HANDLEINPUT](null, options);
    this[SETXXXUSERANDTIME]('update', values);
    let oldInstance;
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    const where = { [this.model.primaryKeyAttribute]: id };
    this[HANDLESCOPE](scope, where);
    if (options.retDiff || this.operatorLog) {
      oldInstance = await this.model.findOne({ where, transaction: options.transaction, lock: options.lock });
    }
    let ret = await this.model.update(values, {
      where,
      transaction: options.transaction,
      lock       : options.lock,
    });
    if (options.retValue || this.operatorLog) {
      const instance = await this.model.findOne({ where, transaction: options.transaction, lock: options.lock });
      if ((options.retDiff && oldInstance) || this.operatorLog) {
        oldInstance = BaseService.toJSON(oldInstance, true);
        const newInstance = BaseService.toJSON(instance, true);
        const diff = BaseService.diffObject(oldInstance, newInstance);
        ret = {
          before: oldInstance,
          after : newInstance,
          diff,
        };
        if (this.operatorLog) {
          this[GENERATEOPERATORLOG]({
            type  : 'edit',
            method: 'editById',
            before: oldInstance,
            after : newInstance,
            diff,
          });
        }
      } else {
        ret = BaseService.toJSON(instance, options.plain);
      }
    }

    return ret;
  }

  /**
   * remove instances
   *
   * @param {Object}  args -
   * @param {Object}  [args.params] -
   * @param {Object}  [options={}]  - 可选参数
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]   -
   * @param {boolean} [options.fake]          -  可选，是否使用假删除， 默认 this.fake。（默认情况下与配置一致，同时也允许进行真删除 ）
   * @param {string}  [options.fakeBody]      -  可选，fake 为 true 时有效，假删除时候更新的数据（键值对），如果需要处理 操作人操作时间外，需要更新其他字段可用（意同 edit 方法中的 body）
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async remove(args = { }, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    let ret;
    if (_.isUndefined(options.fake)) {
      options.fake = this.fake;
    }
    if (options.fake) {
      // 假删除|软删除
      let body = {};
      if (options.fakeBody && _.keys(options.fakeBody).length >= 0) {
        body = options.fakeBody;
      }
      this[SETXXXUSERANDTIME]('delete', body);
      ret = await this.edit({ params, body }, options);
      if (this.operatorLog) {
        this[GENERATEOPERATORLOG]({
          type  : 'remove',
          method: 'fakeRemove',
          ...BaseService.toJSON(ret, true),
        });
      }
    } else if (options.retValues || this.operatorLog) {
      const instances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
      await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
      // const ret = await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
      ret = BaseService.toJSON(instances, options.plain);
      if (this.operatorLog) {
        this[GENERATEOPERATORLOG]({
          type  : 'remove',
          method: 'remove',
          before: BaseService.toJSON(ret, true),
        });
      }
    } else {
      ret = await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
    }
    return ret;
  }

  /**
   * remove an instance by primary key
   *
   * @param {number|string}  id    - 主键
   * @param {Object}  [options={}] -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {boolean} [options.fake]          -  可选，是否使用假删除， 默认 this.fake。（默认情况下与配置一致，同时也允许进行真删除 ）
   * @param {string}  [options.fakeBody]      -  可选，fake 为 true 时有效，假删除时候更新的数据（键值对），如果需要处理 操作人操作时间外，需要更新其他字段可用（意同 edit 方法中的 body）
   * @param {boolean} [options.retValue=false]      -  可选，是否返回相关实例，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async removeById(id, options = {}) {
    this[HANDLEINPUT](null, options);
    let ret;
    if (_.isUndefined(options.fake)) {
      options.fake = this.fake;
    }
    if (options.fake) {
      // 假删除|软删除
      let body = {};
      if (options.fakeBody && _.keys(options.fakeBody).length >= 0) {
        body = options.fakeBody;
      }
      this[SETXXXUSERANDTIME]('delete', body);
      ret = await this.editById(id, body, options);
      if (this.operatorLog) {
        this[GENERATEOPERATORLOG]({
          type  : 'remove',
          method: 'fakeRemoveById',
          ...BaseService.toJSON(ret, true),
        });
      }
    } else if (options.retValue || this.operatorLog) {
      const instance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
      // const ret = await this.model.destroy({
      await this.model.destroy({
        where      : { [this.model.primaryKeyAttribute]: id },
        transaction: options.transaction,
        lock       : options.lock,
      });
      ret = BaseService.toJSON(instance, options.plain);
      if (this.operatorLog) {
        this[GENERATEOPERATORLOG]({
          type  : 'remove',
          method: 'removeById',
          before: BaseService.toJSON(ret, true),
        });
      }
    } else {
      ret = await this.model.destroy({
        where      : { [this.model.primaryKeyAttribute]: id },
        transaction: options.transaction,
        lock       : options.lock,
      });
    }
    return ret;
  }

  /**
   * set records
   * make sure the table's records which content the condition `params` is `records`
   *
   * @param {Object}  args -
   * @param {Object}  [args.params] -
   * @param {Array}   records       -  需要设置的记录，
   * @param {Object}  [options={}]  -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {boolean} [options.fake]          -  可选，是否使用假删除， 默认 this.fake。（默认情况下与配置一致，同时也允许进行真删除 ）
   * @param {string}  [options.fakeBody]      -  可选，fake 为 true 时有效，假删除时候更新的数据（键值对），如果需要处理 操作人操作时间外，需要更新其他字段可用（意同 edit 方法中的 body）
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async set(args = { }, records, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    const retData = {};
    const toAdd = [];
    const toEdit = [];
    const toRemove = [];
    const oldVals = await this.list({ params }, options);

    const primaryKeys = this.model.primaryKeyAttributes;
    for (let i = 0; i < oldVals.length; i++) {
      // 先循环判断哪些需要删除的 哪些需要更新的
      const oldVal = oldVals[i];
      const primaryKeyVal = _.pick(oldVal, primaryKeys);
      const hitRecord = _.find(records, primaryKeyVal);
      if (hitRecord) {
        // 记录下来 在后面添加的时候过滤掉
        const ret = await this.edit({ params: primaryKeyVal, body: hitRecord }, {
          scope      : options.scope,
          retValue   : options.retValue,
          retDiffs   : options.retDiffs,
          transaction: options.transaction,
          lock       : options.lock,
        });
        const changed = {
          data: ret.datas[0],
          diff: ret.diffs[0],
        };
        toEdit.push(changed);
      } else {
        toRemove.push(oldVal);
        await this.remove({ params: primaryKeyVal }, options);
      }
    }
    _.map(records, function(record) {
      if (toEdit.indexOf(record) === -1) {
        toAdd.push(record);
      }
    });
    await this.addMulti(toAdd, options);
    if (options.retValues || this.operatorLog) {
      const newVals = await this.list({ params }, options);
      retData.oldValues = oldVals;
      retData.newValues = newVals;
      if (options.retDiffs) {
        retData.changed = { toRemove, toAdd, toEdit };
      }
      if (this.operatorLog) {
        this[GENERATEOPERATORLOG]({
          type   : 'set',
          method : 'set',
          before : BaseService.toJSON(oldVals, true),
          after  : BaseService.toJSON(newVals, true),
          changed: { toRemove, toAdd, toEdit },
        });
      }
    }
    return retData;
  }

  /**
   * client get more instances
   * 上拉加载更多
   * 此方法需要限制数据最大获取量，（maxSize控制），默认1000。越大则效率越低，
   * 后续会对单字段排序情况下进行优化（无须限制maxSize）
   * TODO 增加对单字段排序的优化 （再讨论吧，目前想法不需要单独支持，1如果排序的字段有重复也不好处理，2客户端这种方式获取限制能获取的最大数据量是没问题的)
     // * 使用此方法尽量仅使用单字段排序（多字段排序时需要扫描表记录）
   * @param {Object}  id                    可为空或 <0, 此时返回的数据为符合条件的第一条开始
   * @param {Object}  args                    - 接口参数
   * @param {Object}  [args.params]           - 可选，会作为 where 条件注入
   * @param {Object}  [args.query]            -
   * @param {number}  [args.query.page=1]       - page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {number}  [args.query.size=20]      - 可选，默认 this.size || 20
   * @param {number}  [args.query.offset=0]     - 可选，默认 0
   * @param {Object}  [options={}] -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {number}   [options.maxSize=1000]      - 可选， 默认1000
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction]       -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]              -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moreById(id, args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    // let sort = await this[HANDLESORTS]({}, {}, options);
    // 处理方案 获取 id 记录在相应条件下的 序号idx， 然后设置offset 进行获取

    // opts.sort     = _.filter(opts.sort, (i) => i.length === 2);
    // 这里将 page 转换成 offset
    const page = ~~query.page || 1;
    const size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    let offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    offset += (page - 1) * size;
    query.page = 1;
    query.offset = offset;
    // if (sort.length > 1) {
    // 多字段排序
    let idx = 0;
    if (id > 0) {
      options.maxSize = Number.isInteger(Number(options.maxSize)) && Number(options.maxSize) >= 0 ? ~~options.maxSize : 1000;
      idx = await this.indexById(id, { params, query }, options);
      if (idx >= 0) {
        query.offset = (query.offset || 0) + idx + 1;
      }
    }
    // }
    // else {
    // TODO 单字段排序 优化

    // }
    if (idx >= 0) {
      const datas = await this.list({ params, query }, options);
      return {
        datas,
        next: true,
      };
    }

    return {
      next: false,
    };
  }

  /**
   * client refresh instances
   * 下拉刷新数据
   * 此方法需要限制数据最大获取量，（maxSize控制），默认1000。越大则效率越低，
   * 后续会对单字段排序情况下进行优化（无须限制maxSize）
   * TODO 增加对单字段排序的优化 （再讨论吧，目前想法不需要单独支持，1如果排序的字段有重复也不好处理，2客户端这种方式获取限制能获取的最大数据量是没问题的)
     // * 使用此方法尽量仅使用单字段排序（多字段排序时需要扫描表记录）
   * @param {Object}  id                    可为空或 <0, 此时返回的数据为符合条件的第一条开始
   * @param {Object}  args                    - 接口参数
   * @param {Object}  [args.params]           - 可选，会作为 where 条件注入
   * @param {Object}  [args.query]            -
   * @param {number}  [args.query.page=1]       - page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {number}  [args.query.size=20]      - 可选，默认 this.size || 20
   * @param {number}  [args.query.offset=0]     - 可选，默认 0
   * @param {Object}  [options={}]              -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {number}   [options.maxSize=1000]      - 可选， 默认1000
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async refreshById(id, args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    // let sort = await this[HANDLESORTS]({}, {}, options);

    const page = ~~query.page || 1;
    const size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    let offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    offset += (page - 1) * size;
    query.page = 1;
    query.offset = offset;
    // opts.sort     = _.filter(opts.sort, (i) => i.length === 2);
    // if (sort.length > 1) {
    // 多字段排序
    let idx = 0;
    if (id > 0) {
      options.maxSize = Number.isInteger(Number(options.maxSize)) && Number(options.maxSize) >= 0 ? ~~options.maxSize : 1000;
      idx = await this.indexById(id, { params, query }, options);
      if (idx < query.size) {
        query.size = idx;
      }
    }
    // }
    // else {
    // TODO 单字段排序 优化

    // }
    const datas = await this.list({ params, query }, options);
    return {
      datas,
      count: query.size,
      total: idx,
    };
  }

  // ===============================================================================
  // Extend Function Start =========================================================
  // ===============================================================================

  /**
   * get an instance which is No.[nth]
   *
   * @see {@link BaseService#list}
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {number}  index         -
   * @param {Object}  [options={}]  -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async nth(args = {}, index, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    return this.list({ params, query: { page: index, size: 1, offset: 0 } }, options);
  }

  /**
   * get the first instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {Object}  [options={}]  -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async first(args = {}, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    return this.list({ params, query: { page: 1, size: 1, offset: 0 } }, options);
  }

  /**
   * get the last instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {Object}  [options={}]  -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]} [options.attributes]       -
   * @param {Egg.Include[]} [options.include]     -
   * @param {Egg.Search[]}  [options.search]      -
   * @param {Egg.Sort}      [options.sort]        -
   * @param {Egg.Filter}    [options.filter]      -
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async last(args = {}, options = {}) {
    const { params = {} } = _.cloneDeep(args);
    // 先用通用处理标准化排序字段
    options.sort = this[HANDLESORTS]({}, {}, options);
    if (options.sort === undefined) {
      // 没有设置排序方式就取主键倒序设置到sort上 ()
      const primaryKey = this.model.primaryKeyAttribute;
      options.sort = [[primaryKey, 'DESC']];
    } else {
      _.map(options.sort, function(item) {
        const len = item.length;
        switch (item[len - 1]) {
          case 'ASC':
            item[len - 1] = 'DESC';
            break;
          case 'DESC':
            item[len - 1] = 'ASC';
            break;
          default:
            item[len - 1] = 'DESC';
            break;
        }
      });
    }
    return this.list({ params, query: { page: 1, size: 1, offset: 0 } }, options);
  }

  /**
   * get index of instance in the list
   *
   * @param {number|string}  id - 主键
   * @param {Object}  args                  - 接口参数
   * @param {Object}  [args.params]         - 可选，会作为 where 条件注入
   * @param {Object}  [args.query]          -
   * @param {number}  [args.query.page=1]   - page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {number}  [args.query.size=20]  - 可选，默认 this.size || 20
   * @param {number}  [args.query.offset=0] - 可选，默认 0
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {number}   [options.maxSize=1000]      - 可选， 多字段排序时 限制最大的扫描数 默认1000
   * @param {Egg.Include[]} [options.include] -
   * @param {Egg.Search[]}  [options.search]  -
   * @param {Egg.Sort}      [options.sort]    -
   * @param {Egg.Filter}    [options.filter]  -
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<number>}
   * @memberof BaseService
   */
  async indexById(id, args = {}, options = {}) {
    const { params = {}, query = {} } = _.cloneDeep(args);
    // maxSize 能设置为 0，但尽量避免 防止全表扫描
    // 这里将 page 转换成 offset
    const page = ~~query.page || 1;
    const size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    let offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    offset += (page - 1) * size;
    query.page = 1;
    query.offset = offset;

    options.maxSize = Number.isInteger(Number(options.maxSize)) && Number(options.maxSize) >= 0 ? ~~options.maxSize : 1000;
    const list = await this.list({ params, query: { size: options.maxSize, offset } },
      _.assign({}, options, { attributes: [this.model.primaryKeyAttribute] }));
    return _.findIndex(list, [this.model.primaryKeyAttribute, id]);
  }

  /**
   * increase instances
   *
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {Object}  [args.body]   - 自增信息
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]        -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValues=false]   -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]    -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async increase(args = {}, options = {}) {
    const { params = {}, body = {} } = _.cloneDeep(args);
    return await this.editSelf({ params, body }, 'increment', options);
  }

  /**
   * increase instance by primary key
   *
   * @param {number|string}  id - 主键
   * @param {Object}  values - 自增信息
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]        -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValue=false]   -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiff=false]    -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async increaseById(id, values, options = {}) {
    return await this.editSelfById(id, values, 'increment', options);
  }

  /**
   * decrease instances
   *
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {Object}  [args.body]   - 自减信息
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]      -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async decrease(args = {}, options = {}) {
    const { params = {}, body = {} } = _.cloneDeep(args);
    return await this.editSelf({ params, body }, 'decrement', options);
  }

  /**
   * decrease instance by primary key
   *
   * @param {number|string}  id - 主键
   * @param {Object}  values - 自减信息
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]      -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValue=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiff=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async decreaseById(id, values, options = {}) {
    return await this.editSelfById(id, values, 'decrement', options);
  }

  /**
   * update instances self
   *
   * @param {Object}  args          - 接口参数
   * @param {Object}  [args.params] - 可选，会作为 where 条件注入
   * @param {Object}  [args.body]   - 修改信息
   * @param {string}  method        - 使用的方法 如 increase decrease 等 sequelize 实例支持的方法
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]      -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async editSelf(args = {}, method, options = {}) {
    const { params = {}, body = {} } = _.cloneDeep(args);
    this[HANDLEINPUT](params, options);
    let ret = {};
    let oldInstances;
    // if (options.retDiffs) {
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    this[HANDLESCOPE](scope, params);
    oldInstances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
    // }
    const idList = [];
    const primaryKey = this.model.primaryKeyAttribute;
    for (let i = 0; i < oldInstances.length; i++) {
      idList.push(oldInstances[i][primaryKey]);
      const attributes = options.attributes || {};
      this[SETXXXUSERANDTIMERAW]('update', attributes);
      await oldInstances[i][method](body, { attributes, transaction: options.transaction, lock: options.lock });
    }
    // const ret = await this.model.update(body, {where: params, transaction: options.transaction, lock: options.lock});
    if (options.retValues || this.operatorLog) {
      const instances = await this.model.findAll({ where: { [primaryKey]: idList }, transaction: options.transaction, lock: options.lock });
      if ((options.retDiffs && oldInstances) || this.operatorLog) {
        oldInstances = BaseService.toJSON(oldInstances, true);
        const newInstances = BaseService.toJSON(instances, true);
        const diffs = BaseService.diffObjects(oldInstances, newInstances);
        ret = {
          datas: BaseService.toJSON(instances, options.plain),
          diffs,
        };
        if (this.operatorLog) {
          this[GENERATEOPERATORLOG]({
            type  : 'editSelf',
            method: 'editSelf',
            before: oldInstances,
            after : newInstances,
            diffs,
          });
        }
      } else {
        ret = BaseService.toJSON(instances, options.plain);
      }
    }
    return ret;
  }

  /**
   * update instance self by primary key
   *
   * @param {number|string}  id - 主键
   * @param {Object}  values - 修改信息
   * @param {string}  method - 使用的方法 如 increase decrease 等 sequelize 实例支持的方法
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {string[]}  [options.attributes]        -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
   * @param {boolean} [options.retValue=false]    -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiff=false]     -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async editSelfById(id, values, method, options = {}) {
    this[HANDLEINPUT](null, options);
    let ret = {};
    let oldInstance;
    let scope = options.scope || 'default';
    if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
      scope = 'default';
    }
    const where = { [this.model.primaryKeyAttribute]: id };
    this[HANDLESCOPE](scope, where);
    // if (options.retDiff) {
    oldInstance = await this.model.findOne({ where, transaction: options.transaction, lock: options.lock });
    // }
    if (oldInstance) {
      const attributes = options.attributes || {};
      this[SETXXXUSERANDTIMERAW]('update', attributes);
      await oldInstance[method](values, { attributes, transaction: options.transaction, lock: options.lock });
      if (options.retValue || this.operatorLog) {
        const instance = await this.model.findOne({ where, transaction: options.transaction, lock: options.lock });
        if ((options.retDiff && oldInstance) || this.operatorLog) {
          oldInstance = BaseService.toJSON(oldInstance, true);
          const newInstance = BaseService.toJSON(instance, true);
          const diff = BaseService.diffObject(oldInstance, newInstance);
          ret = {
            data: BaseService.toJSON(instance, options.plain),
            diff,
          };
          if (this.operatorLog) {
            this[GENERATEOPERATORLOG]({
              type  : 'editSelf',
              method: 'editSelf',
              before: oldInstance,
              after : newInstance,
              diff,
            });
          }
        } else {
          ret = BaseService.toJSON(instance, options.plain);
        }
      }
    }
    return ret;
  }

  /**
   * move instanceA to instanceB
   * 把实例A移动到实例B所在位置（依据数据表中排序字段(orderKey)，排序字段需要使用 int 数据类型且应为正整数，排序使用正序）
   * （不支持联表）
   * 移动规则 取出 origin， 把 [target,origin) 的 orderKey 自增 1 或 把 (origin,target] 的 orderKey 自减 1，
   *          然后把 target 的 orderKey 赋予 origin
   * 当 target 为null时，为为实例A移除排序
   *
   * @param {Object}  origin                - 被移动的记录
   * @param {Object}  target                - 移动的目标记录
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]           -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']    -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async move(origin, target, options = {}) {
    const filter = options.filter || {};
    const orderKey = options.orderKey || 'order';
    const primaryKey = this.model.primaryKeyAttribute;
    options.retValue = options.retValues;
    options.retDiff = options.retDiffs;
    // 有  种情况 （下面 ·有·代表 origin 数据已经在排序； ·冇·代表 origin 数据未在序列中（即排序字段为 null ） ）
    // 1 移入: 冇 -> 有 将 [target, 数据自增 1，然后把 target 的 orderKey 赋予 origin
    // 2 移动: 有 -> 有
    //     ① 上移      把 [target,origin) 的 orderKey 自增 1； 然后把 target 的 orderKey 赋予 origin
    //     ② 下移      把 (origin,target] 的 orderKey 自减 1； 然后把 target 的 orderKey 赋予 origin
    // 3 移出: 有 -> 冇 将 (origin, 数据自减 1，然后把 origin 的 orderKey 置为 null
    const ret = {};
    if (!target) {
      // 3 移出
      filter[orderKey] = { [Op.gt]: origin[orderKey] };
      ret.move = await this.decrease({ params: filter, body: { [orderKey]: 1 } }, options);
      ret.origin = await this.editById(origin[primaryKey], { [orderKey]: null }, options);
    } else {
      if (origin[orderKey]) {
        // 2 移动
        if (origin[orderKey] > target[orderKey]) {
          // 上移
          filter[orderKey] = { [Op.gte]: target[orderKey], [Op.lt]: origin[orderKey] };
          ret.move = await this.increase({ params: filter, body: { [orderKey]: 1 } }, options);
        } else {
          // 下移
          filter[orderKey] = { [Op.gt]: origin[orderKey], [Op.lte]: target[orderKey] };
          ret.move = await this.decrease({ params: filter, body: { [orderKey]: 1 } }, options);
        }
      } else {
        // 1 移入
        filter[orderKey] = { [Op.gte]: target[orderKey] };
        ret.move = await this.increase({ params: filter, body: { [orderKey]: 1 } }, options);
      }
      ret.origin = await this.editById(origin[primaryKey], { [orderKey]: target[orderKey] }, options);
    }
    return ret;
  }

  /**
   * move instanceA to instanceB by primary key
   * 把实例A移动到实例B前面（依据数据表中排序字段(orderKey)，排序字段需要使用 int 数据类型且应为正整数，排序使用正序）
   * （不支持联表）
   * 移动规则 取出 origin， 把 [target,origin) 的 orderKey 自增 1 或 把 (origin,target] 的 orderKey 自减 1，
   *          然后把 target 的 orderKey 赋予 origin
   * 当 target 为null时，为为实例A移除排序
   *
   * @param {number|string}  originId              - 被移动的记录主键
   * @param {number|string}  targetId              - 移动的目标记录主键
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]           -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']    -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moveById(originId, targetId, options = {}) {
    const origin = await this.infoById(originId, options);
    const target = await this.infoById(targetId, options);
    return await this.move(origin, target, options);
  }

  /**
   * move instanceA up one order
   * 上移一位
   *
   * @param {Object}  origin                - 被移动的记录
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moveUp(origin, options = {}) {
    const filter = options.filter || {};
    const orderKey = options.orderKey || 'order';
    const target = await this.info({ params: { [orderKey]: { [Op.lt]: origin[orderKey] } } }, {
      filter,
      sort       : [[orderKey, 'DESC']],
      transaction: options.transaction,
      lock       : options.lock,
    });
    if (target) {
      return await this.move(origin, target, options);
    }

    // 找不到上一个元素项时候
    return { noChange: true };
  }

  /**
   * move instanceA up one order by primary key
   * 上移一位
   *
   * @param {number|string}  originId              - 被移动的记录主键
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moveUpById(originId, options = {}) {
    const origin = await this.infoById(originId, options);
    return await this.moveUp(origin, options);
  }

  /**
   * move instanceA down one order
   * 下移一位
   *
   * @param {Object}  origin                - 被移动的记录
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moveDown(origin, options = {}) {
    const filter = options.filter || {};
    const orderKey = options.orderKey || 'order';
    const target = await this.info({ params: { [orderKey]: { [Op.gt]: origin[orderKey] } } }, {
      filter,
      sort       : [[orderKey, 'ASC']],
      transaction: options.transaction,
      lock       : options.lock,
    });
    if (target) {
      return await this.move(origin, target, options);
    }

    return { noChange: true };
  }

  /**
   * move instanceA down one order by primary key
   * 下移一位
   *
   * @param {number|string}  originId              - 被移动的记录主键
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async moveDownById(originId, options = {}) {
    const origin = await this.infoById(originId, options);
    return await this.moveDown(origin, options);
  }

  /**
   * change order between instanceA and instanceB
   * 交换位置
   *
   * @param {Object}  origin                - 交换的记录
   * @param {Object}  target                - 被交换的记录
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
     // * @param {Egg.Filter} options.filter        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async change(origin, target, options = {}) {
    // let filter       = options.filter || {};
    const orderKey = options.orderKey || 'order';
    options.retValue = options.retValues;
    options.retDiff = options.retDiffs;
    const ret = {};
    const primaryKey = this.model.primaryKeyAttribute;
    if (origin && target && origin[orderKey] && target[orderKey] && origin[orderKey] !== target[orderKey]) {
      ret.origin = await this.editById(origin[primaryKey], { [orderKey]: target[orderKey] }, options);
      ret.target = await this.editById(target[primaryKey], { [orderKey]: origin[orderKey] }, options);
    }
    return ret;
  }

  /**
   * change order between instanceA and instanceB
   * 交换位置
   *
   * @param {number|string}  originId              - 交换的记录主键
   * @param {number|string}  targetId              - 被交换的记录主键
   * @param {Object}  [options={}]                -
   * @param {Egg.Scope} [options.scope='default'] -
   * @param {boolean} [options.plain=false]       -
   * @param {Egg.Filter} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {string}  [options.orderKey='order']      -  可选，排序字段，默认 order
   * @param {boolean} [options.retValues=false]     -  可选，是否返回相关实例，默认 false
   * @param {boolean} [options.retDiffs=false]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
   * @param {Sequelize.Transaction.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async changeById(originId, targetId, options = {}) {
    const origin = await this.infoById(originId, options);
    const target = await this.infoById(targetId, options);
    return await this.change(origin, target, options);
  }


  // ===============================================================================
  // Handle Tools Start ============================================================
  // ===============================================================================

  /**
   * handle preset includes
   *
   * @param {Object.<string, Egg.IncludePreset>}  presetInclude   预设联表关系={key:value}
   * @memberof BaseService
   */
  [HANDLEPRESETINCLUDES](presetInclude) {
    _.map(presetInclude, include => {
      let scope = include.scope || 'default';
      if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
        scope = 'default';
      }
      const where = include.where || {};
      this[HANDLESCOPE](scope, where, include.model);
      if (_.keys(where).length) {
        include.where = where;
        if (_.isUndefined(include.required)) {
          include.required = false;
        }
      }
      if (include.include) {
        // 递归处理 嵌套include
        include.include = this[HANDLEPRESETINCLUDES](include.include);
      }
    });
  }

  /**
   * handle query options
   *
   * @param {Object} params  -
   * @param {Object} query   -
   * @param {Object} options -
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async [HANDLEOPTIONS](params, query, options) {
    if (_.isUndefined(options.splitSQL)) {
      options.splitSQL = true;
    }
    const ret = {};
    ret.pagination = this[HANDLEPAGINATION](params, query, options);
    ret.include = this[HANDLEINCLUDES](params, query, options);
    ret.search = this[HANDLESEARCHS](params, query, options);
    ret.sort = this[HANDLESORTS](params, query, options);
    ret.filter = this[HANDLEFILTERS](params, query, options);
    ret.attributes = this[HANDLEATTRIBUTES](params, query, _.assign({}, options, ret));
    // console.dir(ret.filter, {depth: null});
    // console.dir(ret.search, {depth: null});
    this[HANDLENESTEDFIELDS](params);
    this[HANDLENESTEDFIELDS](ret.filter);
    // this[HANDLENESTEDFIELDS](ret.search);
    await this[HANDLENESTEDWHERE](params, query, _.assign({}, options, ret));
    // console.dir(ret);
    // console.dir(ret.search, {depth: null});
    // console.dir(ret.filter, {depth: null});
    return ret;
  }

  /**
   * handle pagination
   *
   * @param {Object} params       -
   * @param {Object} query        -
   * @param {number} query.page   -
   * @param {number} query.size   -
   * @param {number} query.offset -
   * @param {Object} options      -
   * @returns {Object}
   * @memberof BaseService
   */
  // eslint-disable-next-line no-unused-vars
  [HANDLEPAGINATION](params, query = {}, options) {
    const page = ~~query.page || 1;
    const size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    const offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    return { page, size, offset };
  }

  /**
   * handle includes
   *
   * @param {Object}  params  -
   * @param {Object}  query   -
   * @param {Object}  options -
   * @param {Egg.Scope} [options.scope='default']    -  主表使用的 scope 配置
   * @param {Egg.Include[]}  options.include       -  include 联表配置.
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLEINCLUDES](params, query, options = {}) {
    const include = [];
    if (options.include && Array.isArray(options.include)) {
      _.map(options.include, item => {
        const obj = {};
        if (item.model || item.preset) {
          if (item.preset && this.include[item.preset]) {
            _.assign(obj, this.include[item.preset], _.pick(item, ['as', 'attributes', 'where', 'required', 'scope']));
            if (item.include) {
              obj.include = (obj.include || []).concat(item.include);
            }
          } else {
            _.assign(obj, item);
          }
          let scope = obj.scope || options.scope || 'default';
          if (['default', 'deleted', 'updated', 'all'].indexOf(scope) === -1) {
            scope = 'default';
          }
          const where = obj.where || {};
          this[HANDLESCOPE](scope, where, obj.model);
          if (_.keys(where).length) {
            obj.where = where;
            if (_.isUndefined(obj.required)) {
              obj.required = false;
            }
          }
          delete obj.scope;
          if (obj.include) {
            // 递归处理 嵌套include
            obj.include = this[HANDLEINCLUDES](params, query, { include: obj.include });
          }
          if (obj.model) {
            include.push(obj);
          }
        } else {
          // [{TableA}] 的情况
          include.push({ model: item });
        }
      });
    }
    return include;
  }

  /**
   * handle searchs
   *
   * @param {Object} params  -
   * @param {Object} query   -
   * @param {Object} options -
   * @param {Egg.Search[]}  options.search  -  关键字搜索.  [{key:string|[string,string],fields:[string|{[prefix,]field,type,mode}|[string|{[prefix,]field,type,mode}]}]
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLESEARCHS](params, query, options = {}) {
    //         模糊    区间
    //  type = fuzzy   range
    //         %key%   [start,end]
    //  搜索关键字 key 为 字符串时 默认为 fuzzy
    //  搜索关键字 key 为 数组时   默认为 range
    //  其余情况 默认为 defType 目前，defType = 'fuzzy'
    //
    //  mode =      full   left     right     none
    //    对 fuzzy 全模糊 左模糊    右模糊    精确
    //    对 range 闭区间 左闭右开  左开右闭  开区间
    //  type = fuzzy 时 默认 full
    //  type = range 时 默认 full
    const defType = 'fuzzy';
    const defFuzzyMode = 'full';
    const defRangeMode = 'full';
    const searchs = { [Op.and]: [] };
    if (options.search && Array.isArray(options.search)) {
      _.map(options.search, searchItem => {
        const search = { [Op.or]: [] };
        const list = [];
        let { key, fields } = searchItem;
        if (typeof key === 'string') {
          key = key.replace(/(\'|\\\\|%|\_)/g, '\\$1');
        }

        _.map(fields, field => {
          if (typeof field === 'string') {
            // string
            if (field[0] === field[field.length - 1] && field[0] === '$') {
              field = field.slice(1, -1);
            }
            if (field.indexOf('.') >= 0) {
              const jsonFlagIdx = field.indexOf('->');
              if (jsonFlagIdx === -1) {
                field = field.split('.');
                list.push([{
                  prefix: field.slice(0, -1).join('.'),
                  field : field.slice(-1)[0],
                }]);
              } else {
                list.push([{
                  // eslint-disable-next-line newline-per-chained-call
                  prefix: field.slice(0, jsonFlagIdx).split('.').slice(0, -1).join('.'),
                  field : field.slice(0, jsonFlagIdx).split('.').slice(-1)[0] + field.slice(jsonFlagIdx),
                }]);
              }
            } else {
              list.push([{ field }]);
            }
          } else if (!Array.isArray(field)) {
            // {[prefix,]field,type,mode}
            list.push([field]);
          } else {
            // [string|{[prefix,]field,type,mode}]
            const tmp = [];
            _.map(field, f => {
              if (typeof f === 'string') {
                // string
                if (f[0] === f[f.length - 1] && f[0] === '$') {
                  f = f.slice(1, -1);
                }
                if (f.indexOf('.') >= 0) {
                  const jsonFlagIdx = f.indexOf('->');
                  if (jsonFlagIdx === -1) {
                    f = f.split('.');
                    tmp.push({
                      prefix: f.slice(0, -1).join('.'),
                      field : f.slice(-1)[0],
                    });
                  } else {
                    tmp.push({
                      // eslint-disable-next-line newline-per-chained-call
                      prefix: f.slice(0, jsonFlagIdx).split('.').slice(0, -1).join('.'),
                      field : f.slice(0, jsonFlagIdx).split('.').slice(-1)[0] + f.slice(jsonFlagIdx),
                    });
                  }
                } else {
                  tmp.push({ field: f });
                }
              } else if (!Array.isArray(f)) {
                // {[prefix,]field,type,mode}
                tmp.push(f);
              }
            });
            list.push(tmp);
          }
        });
        _.map(list, items => {
          const keyVal = { [Op.and]: [] };
          _.map(items, item => {
            let k = '';
            let v = `%${key}%`;
            const jsonFlagIdx = item.field.indexOf('->');
            const isJSONKey = jsonFlagIdx >= 0;
            let pureField = item.field;
            let suffix = '';
            let needRegExp = false;
            if (isJSONKey) {
              pureField = item.field.slice(0, jsonFlagIdx);
              suffix = item.field.slice(jsonFlagIdx);
              if (!/^->\s*(?<q>'|")\$.*\k<q>\s*$/.test(suffix)) {
                suffix = `->"${suffix.slice(2)}"`;
              }
            }
            if (suffix.indexOf('*') >= 0) {
              needRegExp = true;
            }
            if (item.prefix) {
              // sequelize 的联表查询并不会把我们使用的 column 转换成对应数据库表字段，这里我们兼容处理下
              const prefixModels = item.prefix.split('.');
              const prefixStr = prefixModels.join('->');
              let nestAssociations = this.model.associations[prefixModels[0]] || null;
              if (nestAssociations) {
                for (let i = 1; i < prefixModels.length; i++) {
                  if (nestAssociations.target.associations[prefixModels[i]]) {
                    nestAssociations = nestAssociations.associations[prefixModels[i]];
                  } else if (nestAssociations.throughModel && [nestAssociations.throughModel.name, nestAssociations.throughModel.tableName].indexOf(prefixModels[i]) >= 0) {
                    nestAssociations = { target: nestAssociations.throughModel };
                  } else {
                    nestAssociations = null;
                    break;
                  }
                }
              }
              if (nestAssociations) {
                if (nestAssociations.target.rawAttributes[pureField]) {
                  item.field = `\`${nestAssociations.target.rawAttributes[pureField].field}\`${suffix}`;
                }
              }
              k = Sequelize.literal(`\`${prefixStr}\`.${item.field}`);
            } else {
              if (this.model.rawAttributes[pureField]) {
                item.field = `\`${this.model.name}\`.\`${this.model.rawAttributes[pureField].field}\`${suffix}`;
              }
              k = Sequelize.literal(item.field);
            }
            if (typeof key === 'string') {
              item.type = item.type || 'fuzzy';
            } else if (Array.isArray(key)) {
              item.type = item.type || 'range';
            } else {
              item.type = item.type || defType;
            }
            if (item.type === 'fuzzy') {
              item.mode = item.mode || defFuzzyMode;
              switch (item.mode) {
                case 'none':
                  if (needRegExp) {
                    v = { [Op.regexp]: `(\\\[|, )"?${key}"?(\\\]|, )` };
                  } else {
                    v = { [Op.eq]: key };
                  }
                  break;
                case 'left':
                  if (needRegExp) {
                    v = { [Op.regexp]: `(\\\[|, )"?.*${key}"?(\\\]|, )` };
                  } else {
                    v = { [Op.like]: `%${key}` };
                  }
                  break;
                case 'right':
                  if (needRegExp) {
                    v = { [Op.regexp]: `(\\\[|, )"?${key}.*"?(\\\]|, )` };
                  } else {
                    v = { [Op.like]: `${key}%` };
                  }
                  break;
                default:
                  // full
                  if (needRegExp) {
                    v = { [Op.regexp]: `(\\\[|, )"?.*${key}.*"?(\\\]|, )` };
                  } else {
                    v = { [Op.like]: `%${key}%` };
                  }
                  break;
              }
            } else if (item.type === 'range') {
              item.mode = item.mode || defRangeMode;
              if (typeof key === 'string') {
                key = [key];
              }
              let [start, end] = key;
              start = start || '';
              end = end || '';
              let gt = Op.gt;
              let lt = Op.lt;
              switch (item.mode) {
                case 'none':
                  break;
                case 'left':
                  gt = Op.gte;
                  break;
                case 'right':
                  lt = Op.lte;
                  break;
                default: //  full
                  gt = Op.gte;
                  lt = Op.lte;
                  break;
              }
              v = {};
              if (start !== '') { v[gt] = start; }
              if (end !== '') { v[lt] = end; }
            }
            if (Reflect.ownKeys(v).length) {
              keyVal[Op.and].push(Sequelize.where(k, v));
            }
          });

          if (keyVal[Op.and].length) {
            search[Op.or].push(keyVal);
          }
        });
        if (search[Op.or].length) {
          searchs[Op.and].push(search);
        }
      });
    }
    if (searchs[Op.and].length) {
      return searchs;
    }

    return {};
  }

  /**
   * handle sorts
   *
   * @param {Object} params  -
   * @param {Object} query   -
   * @param {Object} options -
   * @param {Egg.Sort}  options.sort -  指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLESORTS](params, query, options = {}) {
    // 规则基本是直接使用 sequelize 的，额外增加一个用 +- 号做前缀的指定顺序逆序的写法
    const sorts = [];
    if (options.sort) {
      // sort 转成 order的格式在处理
      _.map(options.sort, sort => {
        if (typeof sort === 'string' && sort.indexOf('.') >= 0) {
          // 现在认为 `.` 为联表字段排序的分隔符，此时这里需要把 sort 转换成数组形式进行处理
          let order = 'ASC';
          if (sort[0] === '+') {
            sort = sort.slice(1);
          } else if (sort[0] === '-') {
            order = 'DESC';
            sort = sort.slice(1);
          }
          sort = sort.split('.');
          sort.push(order);
        }
        if (typeof sort === 'string') {
          // string
          if (sort[0] === '+') {
            sorts.push([sort.slice(1), 'ASC']);
          } else if (sort[0] === '-') {
            sorts.push([sort.slice(1), 'DESC']);
          } else {
            sorts.push([sort, 'ASC']);
          }
        } else if (Array.isArray(sort)) {
          const sortLast = sort.slice(-1)[0];
          const order = sort.slice(-1)[0].toUpperCase();
          if (order === 'DESC' || order === 'ASC') {
            sorts.push(sort.slice(0, -1).concat(order));
          } else if (sortLast[0] === '+') {
            sorts.push(sort.slice(0, -1).concat(sortLast.slice(1), 'ASC'));
          } else if (sortLast[0] === '-') {
            sorts.push(sort.slice(0, -1).concat(sortLast.slice(1), 'DESC'));
          } else {
            sorts.push(sort.slice(0, -1).concat(sortLast, 'ASC'));
          }
        } else {
          // pass
          sorts.push(sort);
        }
      });
      // 针对 +aaa[GBK], 后面接 [GBK] 的写法转换成使用 CONVERT(aaa USING GBK) 进行排序处理
      _.map(sorts, (sort, idx) => {
        let associationModel = null;
        if (sort[sort.length - 2] && sort[sort.length - 2].slice && sort[sort.length - 2].slice(-5) === '[GBK]') {
          const prefixModels = sort.slice(0, -2);
          let attr = sort[sort.length - 2].slice(0, -5);
          if (prefixModels.length) {
            let nestAssociations = this.model.associations[prefixModels[0]] || null;
            if (nestAssociations) {
              for (let i = 1; i < prefixModels.length; i++) {
                if (nestAssociations.target.associations[prefixModels[i]]) {
                  nestAssociations = nestAssociations.associations[prefixModels[i]];
                } else if (nestAssociations.throughModel && [nestAssociations.throughModel.name, nestAssociations.throughModel.tableName].indexOf(prefixModels[i]) >= 0) {
                  nestAssociations = { target: nestAssociations.throughModel };
                } else {
                  nestAssociations = null;
                  break;
                }
              }
            }
            attr = nestAssociations.target.rawAttributes[attr].field;
            associationModel = nestAssociations.target;
          } else {
            // 主表使用原输入
            // attr = this.model.rawAttributes[attr].field;
          }
          sort[sort.length - 2] = attr;
          const literal = Sequelize.literal(`CONVERT(\`${sort.slice(0, -1).join('`.`')}\` USING GBK)`);
          if (associationModel) {
            // 对于联表字段，增加 model 属性，绕开子查询的 order 语句
            literal.model = associationModel;
          } else {
            // 主表字段增加 field 属性，值为原字段，在 HANDLEATTRIBUTE 处识别处理，在 attributes 上补充相应的字段获取
            literal.field = attr;
          }
          sorts[idx] = [literal, sort[sort.length - 1]];
        }
      });
    }
    return sorts;
  }

  /**
   * handle filters
   *
   * @param {Object} params  -
   * @param {Object} query   -
   * @param {Object} options -
   * @param {Egg.Filter}  options.filter -  过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLEFILTERS](params, query, options = {}) {
    return options.filter || {};
  }

  /**
   * handle attributes
   * 存在联表的情况下 如果设置 attributes 就必须把联表用的外键加到 attributes 内
   * 存在排序的情况下 如果设置 attributes 就必须把排序的字段加到 attributes 内
   * @param {Object} params  -
   * @param {Object} query   -
   * @param {Object} options -
   * @param {string[]}  options.attributes  -  需要获取的属性列表.默认全部.
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLEATTRIBUTES](params, query, options = {}) {
    let attributes = options.attributes || [];
    if (options.attributes && Array.isArray(options.attributes)) {
      if (options.include && Array.isArray(options.include)) {
        const keys = [];
        _.map(options.include, ic => {
          const tname = ic.model.name;
          const tnames = Utils.pluralize(tname);
          if (this.model.associations[tname] || this.model.associations[tnames]) {
            const associate = this.model.associations[tname] || this.model.associations[tnames];
            if (associate.associationType === 'BelongsTo') {
              keys.push(associate.foreignKey);
            }
          }
        });
        attributes = attributes.concat(keys);
      }
      if (options.sort && Array.isArray(options.sort)) {
        const keys = [];
        _.map(options.sort, sort => {
          if (sort.length === 2) {
            if (typeof sort[0] === 'object' && sort[0].field) {
              keys.push(sort[0].field);
            }
          }
        });
        attributes = attributes.concat(keys);
      }
    }
    if (!attributes.include && !attributes.exclude) {
      attributes = _.uniq(attributes);
      if (attributes.length === 0) {
        attributes = null;
      }
    }
    return attributes;
  }

  /**
   * handle nested fields
   * 把传来的参数中的联表字段的字段名称进行处理
   * sequelize 不会自动把 model 定义的字段转成数据库的字段
   * @param {Object} obj - where 字段结构数据
   * @memberof BaseService
   */
  [HANDLENESTEDFIELDS](obj) {
    if (obj[Op.and]) {
      this[HANDLENESTEDFIELDS](obj[Op.and]);
    }
    if (obj[Op.or]) {
      this[HANDLENESTEDFIELDS](obj[Op.or]);
    }
    if (Array.isArray(obj)) {
      _.map(obj, item => this[HANDLENESTEDFIELDS](item));
    } else {
      if (obj instanceof Sequelize.Utils.Where) {
        return;
      }
      const tmpObj = _.cloneDeep(obj);
      _.map(tmpObj, (value, key) => {
        delete obj[key];
        value = Array.isArray(value) ? { [Op.in]: value } : value;
        if (key[0] === '$' && key[0] === key[key.length - 1]) {
          let tmp = key.slice(1, -1);
          let prefix = '';
          let field  = tmp;
          const jsonFlagIdx = tmp.indexOf('->');
          const isJSONKey = jsonFlagIdx >= 0;
          if (isJSONKey) {
            // eslint-disable-next-line newline-per-chained-call
            prefix = tmp.slice(0, jsonFlagIdx).split('.').slice(0, -1).join('.');
            field = tmp.slice(0, jsonFlagIdx).split('.').slice(-1)[0] + tmp.slice(jsonFlagIdx);
          } else {
            tmp = tmp.split('.');
            prefix = tmp.slice(0, -1).join('.');
            field = tmp.slice(-1)[0];
          }
          let pureField  = field;
          let suffix  = '';
          const jsonFlagIdx2 = field.indexOf('->');
          if (isJSONKey) {
            pureField = field.slice(0, jsonFlagIdx2);
            suffix = field.slice(jsonFlagIdx2);
            if (!/^->\s*(?<q>'|")\$.*\k<q>\s*$/.test(suffix)) {
              suffix = `->"${suffix.slice(2)}"`;
            }
          }
          const prefixModels = prefix.split('.');
          const prefixStr = prefixModels.join('->');
          let nestAssociations = this.model.associations[prefixModels[0]] || null;
          if (nestAssociations) {
            for (let i = 1; i < prefixModels.length; i++) {
              if (nestAssociations.target.associations[prefixModels[i]]) {
                nestAssociations = nestAssociations.associations[prefixModels[i]];
              } else if (nestAssociations.throughModel && [nestAssociations.throughModel.name, nestAssociations.throughModel.tableName].indexOf(prefixModels[i]) >= 0) {
                nestAssociations = { target: nestAssociations.throughModel };
              } else {
                nestAssociations = null;
                break;
              }
            }
          }
          if (nestAssociations) {
            if (nestAssociations.target.rawAttributes[pureField]) {
              field = `\`${nestAssociations.target.rawAttributes[pureField].field}\`${suffix}`;
            }
          }
          if (_.isUndefined(obj[Op.and])) {
            obj[Op.and] = [];
          }
          obj[Op.and].push(Sequelize.where(Sequelize.literal(`\`${prefixStr}\`.${field}`), value));
        } else {
          const jsonFlagIdx = key.indexOf('->');
          const isJSONKey = jsonFlagIdx >= 0;
          let field  = key;
          let pureField  = key;
          let suffix  = '';
          if (isJSONKey) {
            pureField = key.slice(0, jsonFlagIdx);
            suffix = key.slice(jsonFlagIdx);
            if (!/^->\s*(?<q>'|")\$.*\k<q>\s*$/.test(suffix)) {
              suffix = `->"${suffix.slice(2)}"`;
            }
          }
          if (this.model.rawAttributes[pureField]) {
            field = `\`${this.model.name}\`.\`${this.model.rawAttributes[pureField].field}\`${suffix}`;
          }
          if (_.isUndefined(obj[Op.and])) {
            obj[Op.and] = [];
          }
          obj[Op.and].push(Sequelize.where(Sequelize.literal(field), value));
        }
      });
    }
  }

  /**
   * handle Nested eager loading where
   * 在外层联表查询子表的字段时 这里 sequelize@4 有个 bug，
   * sequelize@4 的联表处理 在有设置 limit 的情况下是一个嵌套的查询，子查询是对主表的查询，里面包含各种筛选条件，
   *                          在外层筛选联表的字段时候就出现这样的报错 "Unknown column 'Replies.id' in 'where clause'"
   *                        没有设置 limit 时，是正常的联表查询，没有问题
   * 这里的处理方案是先在子表筛选出可能的数据，再把子表的筛选条件 转化为对主表的 筛选条件
   * 目前针对 search、filter进行处理
   * @param {Object} params - params
   * @param {Object} query  - query
   * @param {Object} options - 可选参数
   * @param {string[]}  options.attributes  -  需要获取的属性列表.默认全部.
   * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务
   * @param {Sequelize.Transaction.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   * @memberof BaseService
   */
  async [HANDLENESTEDWHERE](params, query, options = {}) {
    const transaction = options.transaction;
    const lock = options.lock;
    const search = options.search;
    const filter = options.filter;
    const includeList = _.cloneDeep(options.include);
    BaseService.emptyAttr(includeList);
    if (options.splitSQL) {
      if (search[Op.and]) {
        for (let i = 0; i < search[Op.and].length; i++) {
          for (let j = 0; j < search[Op.and][i][Op.or].length; j++) {
            const sItem = search[Op.and][i][Op.or][j][Op.and];
            for (const idx in sItem) {
              // Sequelize.Utils.Where
              const whereObj = sItem[idx];
              const fullField = whereObj.attribute.val;
              const value = whereObj.logic;
              const ret = await this[HANDLESUBTABLESEARCH](whereObj, includeList, transaction, lock);
              if (ret.key) {
                // 调整后的值直接用数组展示，并不会使用 Symbol
                // 而调整前的值大多时候使用 Op.like 等 Symbol， 这里需要做一个转换输出，（只[需]做一层）
                const oldValue = _.cloneDeep(value);
                if (Array.isArray(oldValue)) {
                  // 如果是数组，说明不会包含Symbol
                  // pass
                } else {
                  const symbols = Object.getOwnPropertySymbols(oldValue);
                  for (const idxs in symbols) {
                    const symbol = symbols[idxs];
                    oldValue[symbol.toString()] = oldValue[symbol];
                    delete oldValue[symbol];
                  }
                }
                this.logging.info(
                  chalk.cyan('[model] [search]'),
                  chalk.red(JSON.stringify({ [fullField]: oldValue })),
                  chalk.cyan('->'),
                  chalk.green(JSON.stringify({ [ret.key]: ret.value })));
                sItem[idx] = { [ret.key]: ret.value };
              }
            }
          }
          // 转换处理完之后 搜索条件就可能出现多个使用相同键的搜索条件，此时可以将这些条件合并
          // 仅处理 只有一个 key 并且值为数组的
          const combineKeys = {};
          for (let j = 0; j < search[Op.and][i][Op.or].length; j++) {
            const sItem = search[Op.and][i][Op.or][j];
            if (Reflect.ownKeys(sItem).length === 1) {
              for (const field in sItem) {
                // 虽然是循环 但其实只有一项或零项（仅含有一个[Op.and]之类的symbol时）
                if (Array.isArray(sItem[field])) {
                  if (combineKeys[field] === undefined) {
                    combineKeys[field] = [];
                  }
                  combineKeys[field] = combineKeys[field].concat(sItem[field]);
                }
              }
            }
          }
          // console.dir(options.search, {depth: null});
          for (const k in combineKeys) {
            combineKeys[k] = _.uniq(combineKeys[k]);
            _.remove(search[Op.and][i][Op.or],
              item => Reflect.ownKeys(item).length === 1 && item[k] && Array.isArray(item[k]));
            search[Op.and][i][Op.or].push({ [k]: combineKeys[k] });
          }
        }
      }
      if (params) {
        const filterItem = params[Op.and];
        await this[HANDLENESTEDWHEREFILTERR]('params', filterItem, includeList, transaction, lock);
      }
      if (filter) {
        const filterItem = filter[Op.and];
        await this[HANDLENESTEDWHEREFILTERR]('filter', filterItem, includeList, transaction, lock);
      }
    }

    return { search, filter };
  }

  async [HANDLENESTEDWHEREFILTERR](typeStr, filterItem, includeList, transaction, lock) {
    for (const idx in filterItem) {
      const whereObj = filterItem[idx];
      if (!(whereObj instanceof Sequelize.Utils.Where)) {
        if (whereObj[Op.and]) {
          await this[HANDLENESTEDWHEREFILTERR](typeStr, whereObj[Op.and], includeList, transaction, lock);
        }
        if (whereObj[Op.or]) {
          await this[HANDLENESTEDWHEREFILTERR](typeStr, whereObj[Op.or], includeList, transaction, lock);
        }
        continue;
      }
      // Sequelize.Utils.Where

      const fullField = whereObj.attribute.val;
      const value = whereObj.logic;
      const ret = await this[HANDLESUBTABLESEARCH](whereObj, includeList, transaction, lock);
      if (ret.key) {
        // 调整后的值直接用数组展示，并不会使用 Symbol
        // 而调整前的值大多时候使用 Op.like 等 Symbol， 这里需要做一个转换输出，（只做一层）
        const oldValue = _.cloneDeep(value);
        if (Array.isArray(oldValue)) {
          // 如果是数组，说明不会包含Symbol
          // pass
        } else {
          const symbols = Object.getOwnPropertySymbols(oldValue);
          for (const idx2 in symbols) {
            const symbol = symbols[idx2];
            // console.log(symbol);
            oldValue[symbol.toString()] = oldValue[symbol];
            delete oldValue[symbol];
          }
        }
        this.logging.info(
          chalk.cyan(`[model] [${typeStr}]`),
          chalk.red(JSON.stringify({ [fullField]: oldValue })),
          chalk.cyan('->'),
          chalk.green(JSON.stringify({ [ret.key]: ret.value })));
        filterItem[idx] = { [ret.key]: ret.value };
      }
    }
  }

  async [HANDLESUBTABLESEARCH](whereObj, includeList, transaction, lock) {
    // 此处一个完整的 键名应该是 `Table1->Table2->Table3`.`field`->'$**.XXX'
    const fullField = whereObj.attribute.val;
    const value = whereObj.logic;
    const isAssociationSQL = /(?<!`)`.`(?!`)/.test(fullField);
    if (isAssociationSQL) {
      const isJSONKey = /(?<!`)`\s*->/.test(fullField);
      let jsonFlagIdx = -1;
      if (isJSONKey) {
        jsonFlagIdx = fullField.lastIndexOf('->');
      }
      let prefix;
      let field;
      if (isJSONKey) {
        // eslint-disable-next-line newline-per-chained-call
        prefix = fullField.slice(0, jsonFlagIdx).split('.').slice(0, -1).join('.');
        field = fullField.slice(0, jsonFlagIdx).split('.').slice(-1)[0] + fullField.slice(jsonFlagIdx);
      } else {
        field = fullField.split('.');
        prefix = field.slice(0, -1).join('.');
        field = field.slice(-1)[0];
      }
      const nestedList = prefix.slice(1, -1).split('->');
      // 去掉 ` 包裹进行关系的匹配
      const nestedFItem = nestedList[0];
      let matchInclude;
      _.map(includeList, include => {
        if ((include.as && include.as === nestedFItem) || (include.model.name === Utils.singularize(nestedFItem))) {
          matchInclude = include;
        }
      });
      const association = this.model.associations[nestedFItem];
      if (matchInclude && association) {
        if (association.associationType === 'BelongsToMany') {
          let whereKey = nestedList.slice(1).join('->');
          if (nestedList.length === 1) {
            whereKey = [matchInclude.model.name, ...nestedList.slice(1)].join('->');
          } else if (nestedList.length >= 2 && nestedList[1] === association.throughModel.name) {
            whereKey = [Utils.pluralize(this.model.name), ...nestedList.slice(1)].join('->');
          }
          whereKey = `\`${whereKey}\`.${field}`;
          if (!matchInclude.include) {
            matchInclude.include = [];
            matchInclude.include.push({
              model     : this.model,
              required  : true,
              attributes: [association.toSource.targetKey],
              through   : { attributes: [association.toSource.foreignKey] },
            });
          }
          const datas = BaseService.toJSON(await matchInclude.model.findAll({
            attributes: [],
            where     : { [Op.and]: [matchInclude.where, Sequelize.where(Sequelize.literal(whereKey), value)] },
            include   : matchInclude.include,
            transaction,
            lock,
          }), true);
          const idList = [];
          const mainModelNameP = Utils.pluralize(this.model.name);
          _.map(datas, data => {
            _.map(data[mainModelNameP], item => {
              if (idList.indexOf(item[association.toSource.targetKey]) === -1) {
                idList.push(item[association.toSource.targetKey]);
              }
            });
          });
          // delete  search[Op.and][i][Op.or][j][field];
          // search[Op.and][i][Op.or][j][association.toSource.targetKey] = idList;
          return { key: association.toSource.targetKey, value: idList };
        }
        if (association.associationType === 'BelongsTo') {
          let whereKey = nestedList.slice(1).join('->');
          if (nestedList.length === 1) {
            whereKey = [matchInclude.model.name, ...nestedList.slice(1)].join('->');
          }
          whereKey = `\`${whereKey}\`.${field}`;
          const datas = BaseService.toJSON(await matchInclude.model.findAll({
            attributes: [association.targetKey],
            where     : { [Op.and]: [matchInclude.where, Sequelize.where(Sequelize.literal(whereKey), value)] },
            include   : matchInclude.include,
            transaction,
            lock,
          }), true);
          const idList = [];
          _.map(datas, item => {
            if (idList.indexOf(item[association.targetKey]) === -1) {
              idList.push(item[association.targetKey]);
            }
          });
          // search[Op.and][i][Op.or][j] = {[association.foreignKey]: idList};
          // delete  search[Op.and][i][Op.or][j][field];
          // search[Op.and][i][Op.or][j][association.foreignKey] = idList;
          return { key: association.foreignKey, value: idList };
        }

        // HasMany HasOne
        let whereKey = nestedList.slice(1).join('->');
        if (nestedList.length === 1) {
          whereKey = [matchInclude.model.name, ...nestedList.slice(1)].join('->');
        }
        whereKey = `\`${whereKey}\`.${field}`;
        const datas = BaseService.toJSON(await matchInclude.model.findAll({
          attributes: [association.foreignKey],
          where     : { [Op.and]: [matchInclude.where, Sequelize.where(Sequelize.literal(whereKey), value)] },
          include   : matchInclude.include,
          transaction,
          lock,
        }), true);
        const idList = [];
        _.map(datas, item => {
          if (idList.indexOf(item[association.foreignKey]) === -1) {
            idList.push(item[association.foreignKey]);
          }
        });
        // search[Op.and][i][Op.or][j] = {[association.sourceKey]: idList};
        // delete  search[Op.and][i][Op.or][j][field];
        // search[Op.and][i][Op.or][j][association.sourceKey] = idList;
        return { key: association.sourceKey, value: idList };
      }

      // 没有匹配到 include，说明联表配置有误，跳过处理，直接让其报错
      return {};
    }

    return {};
  }

  /**
   * handle input
   * 调用 HANDLEUNDEFINEDVALUES 处理 undefind 值的参数
   * @param {Object} params  - params
   * @param {Object} options - 可选参数
   * @memberof BaseService
   */
  [HANDLEINPUT](params, options) {
    if (params) {
      this[HANDLEUNDEFINEDVALUES](params);
    }
    if (options.filter) {
      this[HANDLEUNDEFINEDVALUES](options.filter);
    }
    if (options.include) {
      this[HANDLEUNDEFINEDVALUES](options.include);
    }
  }

  /**
   * handle undefined values
   * 处理作为 where 条件的参数，把参数中的 undefind 值转换成 null，（190410 目前最新的 sequelize 版本（5.2.15）把 undefined 值作为错误抛出）
   * sequelize 不会自动吧 model 定义的字段转成数据库的字段
   * @param {Object} obj -
   * @memberof BaseService
   */
  [HANDLEUNDEFINEDVALUES](obj) {
    if (obj[Op.and]) {
      this[HANDLEUNDEFINEDVALUES](obj[Op.and]);
    }
    if (obj[Op.or]) {
      this[HANDLEUNDEFINEDVALUES](obj[Op.or]);
    }
    if (obj.include) {
      this[HANDLEUNDEFINEDVALUES](obj.include);
    }
    if (Array.isArray(obj)) {
      _.map(obj, item => this[HANDLEUNDEFINEDVALUES](item));
    } else {
      _.map(obj, (value, key) => {
        if (value === undefined) {
          obj[key] = null;
        }
      });
    }
  }

  /**
   * 设置 创建|编辑|删除 记录信息
   * @param {string} type 类型 'create' | 'update' | 'delete'
   * @param {Object} body body 数据
   * @memberof BaseService
   */
  [SETXXXUSERANDTIME](type, body) {
    const userIdField = `${type}UserIdField`;
    const timeField = `${type}TimeField`;
    if (this[userIdField] && !body[this[userIdField]]) {
      const user = this.ctx.session && this.ctx.session.user || null;
      if (user) {
        body[this[userIdField]] = user[this.sessionUserIdField];
      }
    }
    if (this[timeField] && !body[this[timeField]]) {
      const attr = this.model.rawAttributes[this[timeField]];
      if (['NUMBER', 'BIGINT'].indexOf(attr.type.key) >= 0) {
        body[this[timeField]] = Date.now();
      } else if (['BOOLEAN'].indexOf(attr.type.key) >= 0) {
        body[this[timeField]] = true;
      } else {
        body[this[timeField]] = new Date();
      }
    }
  }

  /**
   * 设置 创建|编辑|删除 记录信息 Type2
   * 区别于 SETXXXUSERANDTIME, 该方法会将字段转成数据库字段（在 increase decrease 等操作中的这个设置类数据不会帮你转成数据库字段）
   * @param {string} type 类型 'create' | 'update' | 'delete'
   * @param {Object} body body 数据
   * @memberof BaseService
   */
  [SETXXXUSERANDTIMERAW](type, body) {
    const userIdField = `${type}UserIdField`;
    const timeField = `${type}TimeField`;
    if (this[userIdField] && !body[this[userIdField]]) {
      const user = this.ctx.session && this.ctx.session.user || null;
      if (user) {
        body[this[userIdField]] = user[this.sessionUserIdField];
      }
    }
    if (this[timeField] && !body[this[timeField]]) {
      const attr = this.model.rawAttributes[this[timeField]];
      if (['NUMBER', 'BIGINT'].indexOf(attr.type.key) >= 0) {
        body[this[timeField]] = Date.now();
      } else if (['BOOLEAN'].indexOf(attr.type.key) >= 0) {
        body[this[timeField]] = true;
      } else {
        body[this[timeField]] = new Date();
      }
    }
    const rawAttributes = this.model.rawAttributes;
    if (this[userIdField] && rawAttributes[this[userIdField]] && this[userIdField] !== rawAttributes[this[userIdField]]) {
      body[rawAttributes[this[userIdField]].field] = body[this[userIdField]];
      delete body[this[userIdField]];
    }
    if (this[timeField] && rawAttributes[this[timeField]] && this[timeField] !== rawAttributes[this[timeField]]) {
      body[rawAttributes[this[timeField]].field] = body[this[timeField]];
      // body[this[timeField]];
      delete body[this[timeField]];
    }
  }

  /**
   * 获取已编辑数据
   * @param {Object} where where 条件对象
   * @param {Object} query  query 数据
   * @param {Object} modelInfo  目标表的信息
   * @memberof BaseService
   */
  [GETUPDATEEDATA](where, query, modelInfo) {
    const info = modelInfo || this;
    // 只要操作时间不为 null 即可，操作人还是可能为 null 的
    // if (info.updateUserIdField && !query[info.updateUserIdField]) {
    //   where[info.updateUserIdField] = { [Op.not]: null };
    // }
    if (info.updateTimeField && !query[info.updateTimeField]) {
      const attr = info.model.rawAttributes[info.updateTimeField];
      if (attr.allowNull) {
        where[info.updateTimeField] = { [Op.not]: null };
      } else if (['NUMBER', 'BIGINT'].indexOf(attr.type.key) >= 0) {
        where[info.updateTimeField] = { [Op.gt]: 0 };
      } else if (['BOOLEAN'].indexOf(attr.type.key) >= 0) {
        where[info.updateTimeField] = true;
      } else {
        where[info.updateTimeField] = { [Op.not]: '' };
      }
    }
  }

  /**
   * 获取已删除数据
   * @param {Object} where where 条件对象
   * @param {Object} modelInfo  目标表的信息
   * @memberof BaseService
   */
  [GETDELETEEDATA](where, modelInfo) {
    const info = modelInfo || this;
    // 只要操作时间不为 null 即可，操作人还是可能为 null 的
    // if (info.deleteUserIdField && !where[info.deleteUserIdField]) {
    //   where[info.deleteUserIdField] = { [Op.not]: null };
    // }
    if (info.deleteTimeField && !where[info.deleteTimeField]) {
      const attr = info.model.rawAttributes[info.deleteTimeField];
      if (attr.allowNull) {
        where[info.deleteTimeField] = { [Op.not]: null };
      } else if (['NUMBER', 'BIGINT'].indexOf(attr.type.key) >= 0) {
        where[info.deleteTimeField] = { [Op.gt]: 0 };
      } else if (['BOOLEAN'].indexOf(attr.type.key) >= 0) {
        where[info.deleteTimeField] = true;
      } else {
        where[info.deleteTimeField] = { [Op.not]: '' };
      }
    }
  }

  /**
   * 过滤已删除数据（假删除）
   * 真删除本身就不存在数据库，但是假删除需要我们吧相关信息设置为 null 来过滤掉
   * @param {Object} where where 条件对象
   * @param {Object} modelInfo  目标表的信息
   * @memberof BaseService
   */
  [FILTERDELETEEDATA](where, modelInfo) {
    const info = modelInfo || this;
    if (info.fake) {
      if (info.deleteUserIdField) {
        where[info.deleteUserIdField] = null;
      }
      if (info.deleteTimeField) {
        const attr = info.model.rawAttributes[info.deleteTimeField];
        if (attr.allowNull) {
          where[info.deleteTimeField] = null;
        } else if (['NUMBER', 'BIGINT'].indexOf(attr.type.key) >= 0) {
          where[info.deleteTimeField] = 0;
        } else if (['BOOLEAN'].indexOf(attr.type.key) >= 0) {
          where[info.deleteTimeField] = false;
        } else {
          where[info.deleteTimeField] = '';
        }
      }
    }
  }

  /**
   * 处理搜索范围参数设置
   * 真删除本身就不存在数据库，但是假删除需要我们吧相关信息设置为 null 来过滤掉
   * @param {string} scope - 可选，搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。其他三项
   *                             为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的
   * @param {Object} where where 条件对象
   * @param {string|Egg.EggModelType|Sequelize.ModelType} [model] 可选，默认为空，使用当前 model 相应数据，用于联表的 操作人、时间 字段的信息获取（来源于其他 service）
   * @memberof BaseService
   */
  [HANDLESCOPE](scope, where, model) {
    let modelInfo;
    if (model) {
      model = model.name || model;
      modelInfo = this.ctx.service[_.camelCase(model)];
    }
    switch (scope) {
      case 'deleted':
        this[GETDELETEEDATA](where, modelInfo);
        break;
      case 'updated':
        this[GETDELETEEDATA](where, modelInfo);
        this[GETUPDATEEDATA](where, modelInfo);
        break;
      case 'all':
        // pass 不需要追加条件
        break;
      default:
        this[FILTERDELETEEDATA](where, modelInfo);
        break;
    }
  }

  /**
   * generate operator log
   * 生成操作日志主体内容
   * @param {Object} obj - 日志对象
   * @memberof BaseService
   */
  [GENERATEOPERATORLOG](obj) {
    this.operatorLogInfos.push(obj);
  }

  /**
   * deal operator log
   * 处理操作日志成标准格式
   * @param {Object} obj - 日志对象
   * @returns
   * @memberof BaseService
   */
  [DEALOPERATORLOG](obj) {
    const { enums, fieldNameMap } = this;
    obj.logMessages = [];
    _.map(obj.logInfos, logInfo => {
      const message = {
        type   : logInfo.type,
        method : logInfo.method,
        model  : this.model.name,
        modelCN: this.modelNameMap[this.model.name],
      };
      const primaryKey = this.model.primaryKeyAttribute;
      if (logInfo.type === 'add') {
        message.op = '添加';
        message.affect = 1;
        if (logInfo.method.indexOf('Multi') >= 0) {
          message.op = `批量${message.op}`;
          message.affect = logInfo.after.length;
        }
        message.content = `${message.op} ${message.affect} 条新记录`;
      } else if (logInfo.type === 'remove') {
        message.op = '删除';
        message.affect = 1;
        if (logInfo.method.indexOf('fake') === 0) {
          message.op = `（假）${message.op}`;
        }
        if (logInfo.method.indexOf('ById') === -1) {
          message.affect = logInfo.before.length;
        }
        message.content = `${message.op} ${message.affect} 条记录 `;
        if (logInfo.method.indexOf('ById') === -1) {
          message.content += `( 涉及主键 \`${fieldNameMap[primaryKey] || primaryKey}\` IN (${_.map(logInfo.before, primaryKey)}) ) `;
        } else {
          message.content += `( 涉及主键 \`${fieldNameMap[primaryKey] || primaryKey}\` === ${logInfo.before[primaryKey]} ) `;
        }
      } else if (logInfo.type === 'search') {
        message.op = '查询';
        message.count = logInfo.count || 0;
        if (logInfo.method.indexOf('list') >= 0) {
          message.op = `${message.op}列表`;
          message.content = `${message.op} ( ${message.count} 条记录 ) `;
        } else {
          message.op = `${message.op}记录`;
          message.content = `${message.op}`;
        }
        message.include = [];
        if (logInfo.include) {
          _.map(logInfo.include, val => {
            message.include.push(this.modelNameMap[val.model.name]);
          });
        }
        message.sort = [];
        if (logInfo.sort) {
          message.sort = logInfo.sort;
          // _.map(logInfo.sort, (val, key) => {
          //   message.sort.push(this.modelNameMap[val.model.name]);
          // });
        }
        message.condition = [];
        if (logInfo.params) {
          _.map(logInfo.params, (val, key) => {
            message.condition.push(`${fieldNameMap[key] || key}：${symbolObjectStringify(enums[key] && enums[key][val] || val)}`);
          });
        }
        if (logInfo.options) {
          if (logInfo.options.filter) {
            _.map(logInfo.options.filter, (val, key) => {
              message.condition.push(`${fieldNameMap[key] || key}：${symbolObjectStringify(enums[key] && enums[key][val] || val)}`);
            });
          }
          if (logInfo.options.search) {
            _.map(logInfo.options.search, searchInfo => {
              message.condition.push(`于 ${_.map(searchInfo.fields, field => fieldNameMap[field] || field).join('、')} 中搜索 \`${searchInfo.key}\``);
            });
          }
        }
        if (logInfo.query) {
          if (logInfo.query.page) {
            message.condition.push(`页码：${logInfo.query.page}`);
          }
          if (logInfo.query.size) {
            message.condition.push(`页面大小：${logInfo.query.size}`);
          }
        }
        if (message.include.length) {
          message.content += ` | 包含表: ${message.include.join('、')}`;
        }
        if (message.condition.length) {
          message.content += ` | 查询条件: ${message.condition.join(', ')}`;
        }
        if (message.sort.length) {
          message.content += ` | 排序规则: ${objectStringify(message.sort)}`;
        }
      } else if (logInfo.type === 'edit' || logInfo.type === 'editSelf') {
        message.op = '编辑';
        message.affect = 1;
        if (logInfo.method.indexOf('ById') === -1) {
          message.affect = logInfo.before.length;
          message.diffs = [];
          _.map(logInfo.diffs, diff => {
            const tmpDiff = [];
            _.map(diff, change => {
              if (this.logField && this.logField.indexOf(change.key) === -1) {
                const c = {
                  key   : fieldNameMap[change.key] || change.key,
                  change: '更新',
                };
                c.content = `\`${c.key}\` ${c.change}`;
                tmpDiff.push(c);
                return;
              }
              const beforeFlag = !(_.isUndefined(change.before) || _.isNull(change.before));
              const afterFlag = !(_.isUndefined(change.after) || _.isNull(change.after));
              const c = {
                key   : fieldNameMap[change.key] || change.key,
                change: `${beforeFlag ? change.before : '--'} -> ${afterFlag ? change.after : '--'}`,
              };
              if (enums[change.key]) {
                c.change = `${beforeFlag ? `${enums[change.key][change.before]}(${change.before})` : '--'} -> `
                  + `${afterFlag ? `${enums[change.key][change.after]}(${change.after})` : '--'}`;
              }
              c.content = `${c.key}: ${c.change}`;
              tmpDiff.push(c);
            });
            message.diffs.push(tmpDiff);
          });
        } else {
          message.diff = [];
          if (logInfo.diff.length === 0) {
            message.affect = 0;
          }
          _.map(logInfo.diff, change => {
            if (this.logField && this.logField.indexOf(change.key) === -1) {
              const c = {
                key   : fieldNameMap[change.key] || change.key,
                change: '更新',
              };
              c.content = `\`${c.key}\` ${c.change}`;
              message.diff.push(c);
              return;
            }
            const beforeFlag = !(_.isUndefined(change.before) || _.isNull(change.before));
            const afterFlag = !(_.isUndefined(change.after) || _.isNull(change.after));
            const c = {
              key   : fieldNameMap[change.key] || change.key,
              change: `${beforeFlag ? change.before : '--'} -> ${afterFlag ? change.after : '--'}`,
            };
            if (enums[change.key]) {
              c.change = `${beforeFlag ? `${enums[change.key][change.before]}(${change.before})` : '--'} -> `
                + `${afterFlag ? `${enums[change.key][change.after]}(${change.after})` : '--'}`;
            }
            c.content = `${c.key}: ${c.change}`;
            message.diff.push(c);
          });
        }
        message.content = `${message.op} ${message.affect} 条记录 `;
        if (logInfo.method.indexOf('ById') >= 0) {
          message.content = `${message.op}: `;
        }
        if (message.affect === 0) {
          message.content += '无变动';
        } else if (message.diff) {
          message.content += message.diff.length ? _.map(message.diff, 'content').join(', ') : '无变化';
        } else if (message.diffs) {
          message.content += `( 涉及主键 \`${fieldNameMap[primaryKey] || primaryKey}\` IN (${_.map(logInfo.after, primaryKey)}) ) `
            + `| 变化内容： ( ${_.map(message.diffs, (diff, idx) => `[${logInfo.after[idx][primaryKey]}] ${diff.length ? _.map(diff, 'content').join(', ') : '无变化'}`).join(' ) ( ')} ) `;
        }
      } else if (logInfo.type === 'set') {
        message.op = '设置';
        message.remove = logInfo.changed.toRemove.length;
        message.add = logInfo.changed.toAdd.length;
        message.edit = logInfo.changed.toEdit.length;
        message.affect = message.remove + message.add + message.edit;
        message.content = `${message.op}: 涉及 ${message.affect} 条记录 ( 删除 ${message.remove} 条，添加 ${message.add} 条，编辑 ${message.edit} 条 ) `;
      } else if (logInfo.type === 'all') {
        // query
        message.op = '无分类';
        message.content = `${logInfo.method}${logInfo.sql}`;
      }
      obj.logMessages.push(message);
    });
    obj.logInfo = obj.logInfos.slice(-1)[0];
    obj.logMessage = obj.logMessages.slice(-1)[0];
    return obj;
  }

  static emptyAttr(includeList) {
    _.map(includeList, include => {
      include.attributes = [];
      if (include.include) {
        BaseService.emptyAttr(include.include);
      }
    });
  }

  /**
   * convert instance to plain object
   *
   * @static
   * @param {Array<Sequelize#Model>|Object} data -data
   * @param {boolean} plain -
   * @returns
   * @memberof BaseService
   */
  static toJSON(data, plain) {
    if (!data || !plain) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(item => (item.toJSON ? item.toJSON() : item));
    }
    return data.toJSON ? data.toJSON() : data;
  }

  static diffObject(left, right) {
    const detail = [];
    if (left) {
      _.map(left, (value, key) => {
        if (right) {
          if (value && !right[key]) {
            detail.push({ key, type: 'remove', before: value, after: right[key] });
          }
          if (value && right[key] && !_.isEqual(right[key], value)) {
            detail.push({ key, type: 'edit', before: value, after: right[key] });
          }
        } else {
          detail.push({ key, type: 'remove', before: value, after: undefined });
        }
      });
    }
    if (right) {
      _.map(right, (value, key) => {
        if (left) {
          if (!left[key] && value) {
            detail.push({ key, type: 'add', before: left[key], after: value });
          }
        } else {
          detail.push({ key, type: 'add', before: undefined, after: value });
        }
      });
    }
    return detail;
  }

  static diffObjects(leftDatas, rightDatas) {
    const details = [];
    for (let i = 0; i < leftDatas.length; i++) {
      details.push(BaseService.diffObject(leftDatas[i], rightDatas[i]));
    }
    return details;
  }
}

// ========================================================================
/**
 * 对象字符串化
 *
 * @param {Object} obj    输入对象
 * @param {Function} [replacer] replacer
 * @param {number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {number} [prefixIndent]   缩进修正值 默认0（即整体左侧修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {string}
 */
function objectStringify(obj, replacer, indent, prefixIndent) {
  if (!obj) {
    return obj;
  }

  let ret;
  if (indent >= 1) {
    ret = JSON.stringify(obj, replacer, indent)
      .replace(/"([^"]+)"(\s*:\s*)/g, '$1$2')
      .replace(/"/g, '\'');
  } else {
    ret = JSON.stringify(obj, replacer)
      .replace(/"([^"]+)"(\s*:\s*)/g, '$1$2 ')
      .replace(/,/g, ', ')
      .replace(/:\{/g, ': {')
      .replace(/\{/g, '{ ')
      .replace(/\}/g, ' }')
      .replace(/\{\s\s\}/g, '{}')
      .replace(/"/g, '\'');
  }
  if (prefixIndent >= 1) {
    const spaces = new Array(prefixIndent + 1).join(' ');
    ret = spaces + ret.replace(/\n/g, `\n${spaces}`);
  }
  return ret;
}
/**
 * 对象字符串化(支持 symbol)
 * objectStringify extra
 *
 * @param {Object} obj    输入对象
 * @param {Function} [replacer] replacer
 * @param {number} [indent]   缩进空格数 最大值为10（JSON.stringify限制）
 * @param {number} [prefixIndent]   缩进修正值 默认0（即整体左侧修正缩进，如设置为 2，每一行默认追加两个空格在行首）
 * @returns {string}
 */
function symbolObjectStringify(obj, replacer, indent, prefixIndent) {
  if (!obj) {
    return obj;
  }

  function mapKeysDeep(o) {
    if (Array.isArray(o)) {
      const ret = [];
      _.map(o, i => {
        ret.push(mapKeysDeep(i));
      });
      return ret;
    }
    if (o && typeof o === 'object') {
      const keys = Reflect.ownKeys(o);
      const ret = {};
      _.map(keys, key => {
        ret[key.toString()] = mapKeysDeep(o[key]);
      });
      return ret;
    }
    return typeof o === 'symbol' ? o.toString() : o;
  }

  return objectStringify(mapKeysDeep(obj), replacer, indent, prefixIndent);
}
// ========================================================================

// 对所有操作方法统一加上操作日志处理逻辑
const keys = Reflect.ownKeys(BaseService.prototype);
const funcNames = [];
_.map(keys, item => {
  if (!(typeof item === 'symbol' || item === 'constructor')) {
    funcNames.push(item);
  }
});

_.map(funcNames, func => {
  const tmp = BaseService.prototype[func];
  BaseService.prototype[func] = async function() {
    const pathInfo = stackInfo.find(new RegExp(`\\${path.sep}app\\${path.sep}`));
    if (pathInfo) {
      this.app[RUNFILEPATH] = pathInfo;
    }
    if (this.operatorLog) {
      this.level = (Number(this.level) || 0) + 1;
      const ret = await tmp.bind(this)(...arguments);
      this.level -= 1;
      if (this.level === 0) {
        if (_.isUndefined(this.ctx.operatorLogs)) {
          this.ctx.operatorLogs = [];
        }
        const operatorLog = this[DEALOPERATORLOG]({
          func,
          logInfos: this.operatorLogInfos,
        });
        if (this.addLogCallback) {
          await this.addLogCallback(operatorLog);
        }
        this.ctx.operatorLogs.push(operatorLog);
        this.operatorLogInfos = [];
      }

      return ret;
    }
    const ret = await tmp.bind(this)(...arguments);

    delete this.app[RUNFILEPATH];
    return ret;
  };
});

module.exports = BaseService;
