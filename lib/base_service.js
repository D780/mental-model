'use strict';

/* eslint-disable */
const _ = require('lodash');
const Sequelize = require('sequelize');
// const qg        = require('sequelize/lib/dialects/mysql/query-generator');
const chalk = require('chalk');
const Op = Sequelize.Op;
const Utils = Sequelize.Utils;
/* eslint-enable */

const Service = require('egg').Service;
/* eslint-disable no-bitwise */
/* eslint-disable max-statements */
/* eslint-disable max-depth */
/* eslint-disable max-len */

const HANDLEOPTIONS = Symbol('baseService#handleOptions');
const HANDLEPAGINATION = Symbol('baseService#handlePagination');
const HANDLEINCLUDES = Symbol('baseService#handleIncludes');
const HANDLESEARCHS = Symbol('baseService#handleSearchs');
const HANDLESORTS = Symbol('baseService#handleSorts');
const HANDLEFILTERS = Symbol('baseService#handleFilters');
const HANDLEATTRIBUTES = Symbol('baseService#handleAttributes');
const HANDLENESTEDWHERE = Symbol('baseService#handleNestedWhere');
const HANDLESUBTABLESEARCH  = Symbol('baseService#handleSubTableSearch');
const HANDLESETSUBTABLESEARCHRET  = Symbol('baseService#handleSetSubTableSearchRet');

const HANDLENESTEDFIELDS = Symbol('baseService#handleNestedFields');
const HANDLEUNDEFINEDVALUES = Symbol('baseService#handleUndefinedValues');
const HANDLEINPUT = Symbol('baseService#handleinput');

/**
 * BaseService
 * service 基类
 * 提供基于 sequelize@4 的常用功能的实现，减少没必要冗余代码
 * 包括（暂定）list[AndCount][All] count[All]
 *             info[ById]
 *             add[Multi] edit[ById] remove[ById] set
 *             moreById refreshById indexById nth first last
 *             increase[ById] decrease[ById] editSelf[ById]
 *             move[ById] moveUp[ById] moveDown[ById] change[ById]
 * @class BaseService
 * @extends {Service}
 */
class BaseService extends Service {
  /**
   * Creates an instance of BaseService.
   *
   * @param {Object}  ctx
   * @param {Object}  model
   * @param {Object}  [preset]             预设值
   * @param {Number}  [preset.size=20]     默认 分页大小
   * @param {Number}  [preset.logging=false]     日志输出
   * @param {Object}  [preset.include={key:value}]      预设联表关系
   * @param {String}  [preset.include.key]               -  预设联表关系名称
   * @param {Object}  [preset.include.value.model]       -  关系表
   * @param {String}  [preset.include.value.as]          -  as
   * @param {Array}   [preset.include.value.attributes]  -  返回字段
   * @param {Object}  [preset.include.value.where]       -  where 条件
   * @param {Boolean} [preset.include.value.required]    -  是否必须 影响联表方式 left join | join
   * @param {Array}   [preset.include.value.include]     -  see 直循环 options.include
   * @memberof BaseService
   */
  constructor(ctx, model, preset = {}) {
    super(ctx);

    // model
    this.model = model;
    // 兼容非 eggjs 框架
    if (preset.logging) {
      this.logging = ctx ? ctx.app.logger : console;
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
  }

  // ===============================================================================
  // Sequelize Review Function Start ===============================================
  // ===============================================================================

  /**
   * review sequelize.query
   * @param {String}  sql
   * @param {Object}  [options={}]
 // * @param {Boolean} options.plain         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {Object}  [options.replacements]  -  可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效.
   * @param {Object}  [options.bind]          -  可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效.
   * @param {Object}  [options.type]          -  可选，sequelize.query 参数.
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise.<*>}
   */
  async query(sql, options) {
    return await this.sequelize.query(sql, options);
  }

  /**
   * review sequelize.select
   * @param {String}  sql
   * @param {Object}  [options={}]
  // * @param {Boolean} options.plain         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {Object}  [options.replacements]  -  可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效.
   * @param {Object}  [options.bind]          -  可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效.
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise.<*>}
   */
  async select(sql, options) {
    options.type = 'SELECT';
    return await this.sequelize.query(sql, options);
  }

  /**
   * review sequelize.transaction
   * @param {Object} [options]
   * @param {Boolean} [options.autocommit]   可选，设置事务的autocommit（自动完成）属性，默认 true
 //  * @param {String} [options.deferrable]   可选，设置立即或延迟检查约束 （貌似仅用于 postgresql）
   * @param {String} [options.isolationLevel] 可选，事务隔离级别，默认为 REPEATABLE READ，推荐使用 Sequelize 提供的枚举
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED // "READ UNCOMMITTED"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED // "READ COMMITTED"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ  // "REPEATABLE READ"
   *                                             Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE // "SERIALIZABLE"
   * @returns {Promise.<*>}
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
   * @param {Object}  params                - 可选，会作为 where 条件注入
   * @param {Object}  query
   * @param {Number}  query.page            - 可选，默认 1
   * @param {Number}  query.size            - 可选，默认 this.size
   * @param {Number}  query.offset          - 可选，默认 0
   * @param {Object}  [options={}]
   * @param {Boolean} [options.count]         -  可选，是否获取分页数据.默认 false | count list 至少一个为 true
   * @param {Boolean} [options.list]          -  可选，是否获取列表数据.默认 true  | count list 至少一个为 true
   * @param {Boolean} [options.plain]         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {Array}   [options.attributes]    -  可选，需要获取的属性列表.默认全部.
   * @param {Array}   [options.include]       -  可选，include 联表配置.
   * @param {String}  [options.include.preset ]    -  有预设关系时，会导入相应的 include 信息
   *                                                包括 model，as，attributes，where，required，include
   *                                                注： include 是增量导入，（即与 options.include.include 不冲突）
   * @param {Object}  [options.include.model]      -  关系表
   * @param {String}  [options.include.as]         -  as
   * @param {Array}   [options.include.attributes] -  返回字段
   * @param {Object}  [options.include.where]      -  where 条件
   * @param {Boolean} [options.include.required]   -  是否必须 影响联表方式 left join | join
   * @param {Array}   [options.include.include]    -  循环嵌套 与 options.include 一致
   * @param {Array}   [options.search]        -  可选，关键字搜索.  [{key:'string',fields:[String|{[prefix,]field,type,mode}]}|[String|{[prefix,]field,type,mode}]}]]
   *                                                 prefix 是联表的时候使用的，用于在外层搜索联表的字段
   * @param {Array}   [options.sort]          -  可选，指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   *                                                  排序规则字段后面带 [GBK] 表示使用 GBK 编码排序，也就是按拼音排序
   * @param {Array}   [options.filter]        -  可选，过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async list({ params = {}, query = {} }, options = {}) {
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
    return result;
  }

  /**
   * list all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  params                - 可选，会作为 where 条件注入
   * @param {Object}  [options={}]
   * @param {Boolean} [options.count]         -  可选，是否获取分页数据.默认 false | count list 至少一个为 true
   * @param {Boolean} [options.list]          -  可选，是否获取列表数据.默认 true  | count list 至少一个为 true
   * @param {Boolean} [options.plain]         -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
   * @param {Array}   [options.attributes]    -  可选，需要获取的属性列表.默认全部.
   * @param {Array}   [options.include]       -  可选，include 联表配置.
   * @param {String}  [options.include.preset ]    -  有预设关系时，会导入相应的 include 信息
   *                                                包括 model，as，attributes，where，required，include
   *                                                注： include 是增量导入，（即与 options.include.include 不冲突）
   * @param {Object}  [options.include.model]      -  关系表
   * @param {String}  [options.include.as]         -  as
   * @param {Array}   [options.include.attributes] -  返回字段
   * @param {Object}  [options.include.where]      -  where 条件
   * @param {Boolean} [options.include.required]   -  是否必须 影响联表方式 left join | join
   * @param {Array}   [options.include.include]    -  循环嵌套 与 options.include 一致
   * @param {Array}   [options.search]        -  可选，关键字搜索.  [{key:'string',fields:[String|{[prefix,]field,type,mode}]}|[String|{[prefix,]field,type,mode}]}]]
   *                                                 prefix 是联表的时候使用的，用于在外层搜索联表的字段
   * @param {Array}   [options.sort]          -  可选，指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   *                                                  排序规则字段后面带 [GBK] 表示使用 GBK 编码排序，也就是按拼音排序
   * @param {Array}   [options.filter]        -  可选，过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async listAll({ params = {} }, options = {}) {
    const query = { page: 1, size: 0, offset: 0 };
    return this.list({ params, query }, options);
  }

  /**
   * count instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async count({ params = {}, query = {} }, options = {}) {
    options.count = true;
    options.list = false;
    return this.list({ params, query }, options);
  }

  /**
   * count instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async countAll({ params = {}, query = {} }, options = {}) {
    options.count = true;
    options.list = false;
    return this.list({ params, query }, options);
  }

  /**
   * list and count all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async listAndCount({ params = {}, query = {} }, options = {}) {
    options.count = true;
    options.list = true;
    return this.list({ params, query }, options);
  }

  /**
   * list and count all instances
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async listAndCountAll({ params = {}, query = {} }, options = {}) {
    options.count = true;
    options.list = true;
    return this.list({ params, query }, options);
  }

  /**
   * get an instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async info({ params = {}, query = {} }, options = {}) {
    this[HANDLEINPUT](params, options);
    const opts = await this[HANDLEOPTIONS](params, query, options);
    let where;
    if (Reflect.ownKeys(opts.search) || Reflect.ownKeys(opts.filter)) {
      where = { [Op.and]: [params, opts.search, opts.filter] };
    } else {
      where = params;
    }
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

    return result;
  }

  /**
   * get an instance by primary key
   *
   * @see {@link BaseService#list}
   * @param {Number}  id
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async infoById(id, options = {}) {
    this[HANDLEINPUT](null, options);
    const opts = await this[HANDLEOPTIONS]({}, {}, options);
    const findOptions = {
      attributes : opts.attributes,
      include    : opts.include,
      transaction: options.transaction,
      lock       : options.lock,
    };
    let result = await this.model.findByPk(id, findOptions);
    result = BaseService.toJSON(result, options.plain);

    return result;
  }

  /**
   * add an instance
   *
   * @param {Object}  params
   * @param {Object}  body
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns
   * @memberof BaseService
   */
  async add({ params = {}, body = {} }, options = {}) {
    this[HANDLEINPUT](params, options);
    const instance = await this.model.create(_.assign({}, params, body), { transaction: options.transaction, lock: options.lock });
    return BaseService.toJSON(instance, options.plain);
  }

  /**
   * add instances
   *
   * @param {Array}   records
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns
   * @memberof BaseService
   */
  async addMulti(records, options = {}) {
    this[HANDLEINPUT](null, options);
    const instances = await this.model.bulkCreate(records, { transaction: options.transaction, lock: options.lock });
    return BaseService.toJSON(instances, options.plain);
  }

  /**
   * edit instances
   *
   * @param {Object}  params
   * @param {Object}  body
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async edit({ params = {}, body = {} }, options = {}) {
    this[HANDLEINPUT](params, options);
    let oldInstances;
    const idList = [];
    const primaryKey = this.model.primaryKeyAttribute;
    if (options.retValues || options.retDiffs) {
      oldInstances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
      for (let i = 0; i < oldInstances.length; i++) {
        idList.push(oldInstances[i][primaryKey]);
      }
    }
    const ret = await this.model.update(body, { where: params, transaction: options.transaction, lock: options.lock });
    if (options.retValues) {
      const instances = await this.model
        .findAll({ where: { [primaryKey]: idList }, transaction: options.transaction, lock: options.lock });
      if (options.retDiffs) {
        oldInstances = BaseService.toJSON(oldInstances, true);
        const diffs = BaseService.diffObjects(oldInstances, BaseService.toJSON(instances, true));
        return {
          datas: BaseService.toJSON(instances, options.plain),
          diffs,
        };
      }
      return BaseService.toJSON(instances, options.plain);
    }
    return ret;
  }

  /**
   * edit an instance by primary key
   *
   * @param {Object}  id
   * @param {Object}  values
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValue]      -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiff]       -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async editById(id, values, options = {}) {
    this[HANDLEINPUT](null, options);
    let oldInstance;
    if (options.retDiff) {
      oldInstance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
    }
    const ret = await this.model.update(values, {
      where      : { [this.model.primaryKeyAttribute]: id },
      transaction: options.transaction,
      lock       : options.lock,
    });
    if (options.retValue) {
      const instance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
      if (oldInstance) {
        oldInstance = BaseService.toJSON(oldInstance, true);
        const diff = BaseService.diffObject(oldInstance, BaseService.toJSON(instance, true));
        return {
          data: BaseService.toJSON(instance, options.plain),
          diff,
        };
      }

      return BaseService.toJSON(instance, options.plain);
    }

    return ret;
  }

  /**
   * remove instances
   *
   * @param {Object}  params
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.fake]          -  可选，是否为假删除， 默认 false
   * @param {String}  [options.fakeField]     -  可选，fake 为 true 时有效，假删除标记用的·字段·（默认为 deleteTime），字段类型为时间
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async remove({ params = {} }, options = {}) {
    this[HANDLEINPUT](params, options);
    if (options.fake) {
      // 假删除|软删除
      options.fakeField = options.fakeField || 'deleteTime';
      const body = { [options.fakeField]: Date.now() };
      return this.edit({ params, body }, options);
    }

    if (options.retValues) {
      const instances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
      await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
      // const ret = await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
      return BaseService.toJSON(instances, options.plain);
    }

    return await this.model.destroy({ where: params, transaction: options.transaction, lock: options.lock });
  }

  /**
   * remove an instance by primary key
   *
   * @param {Object}  id
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.fake]          -  可选，是否为假删除， 默认 false
   * @param {String}  [options.fakeField]     -  可选，fake 为 true 时有效，假删除标记用的·字段·（默认为 deleteTime），字段类型为时间
   * @param {Boolean} [options.retValue]      -  可选，是否返回相关实例，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async removeById(id, options = {}) {
    this[HANDLEINPUT](null, options);
    if (options.fake) {
      // 假删除|软删除
      options.fakeField = options.fakeField || 'deleteTime';
      const body = { [options.fakeField]: Date.now() };
      return this.editById(id, body, options);
    }

    if (options.retValue) {
      const instance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
      // const ret = await this.model.destroy({
      await this.model.destroy({
        where      : { [this.model.primaryKeyAttribute]: id },
        transaction: options.transactio,
        lock       : options.lock,
      });
      return BaseService.toJSON(instance, options.plain);
    }

    return await this.model.destroy({
      where      : { [this.model.primaryKeyAttribute]: id },
      transaction: options.transaction,
      lock       : options.lock,
    });
  }

  /**
   * set records
   * make sure the table's records which content the condition `params` is `records`
   *
   * @param {Object}  params                -  筛选记录的条件
   * @param {Array}   records               -  需要设置的记录，
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async set({ params = {} }, records, options = {}) {
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
    if (options.retValues) {
      const newVals = await this.list({ params }, options);
      retData.oldValues = oldVals;
      retData.newValues = newVals;
      if (options.retDiffs) {
        retData.changed = { toRemove, toAdd, toEdit };
      }
    }
    return {};
  }

  /**
   * client get more instances
   * 上拉加载更多
   * 此方法需要限制数据最大获取量，（maxSize控制），默认1000。越大则效率越低，
   * 后续会对单字段排序情况下进行优化（无须限制maxSize）
   * TODO 增加对单字段排序的优化 （再讨论吧，目前想法不需要单独支持，1如果排序的字段有重复也不好处理，2客户端这种方式获取限制能获取的最大数据量是没问题的)
     // * 使用此方法尽量仅使用单字段排序（多字段排序时需要扫描表记录）
   * @param {Object}  id                    可为空或 <0, 此时返回的数据为符合条件的第一条开始
   * @param {Object}  params
   * @param {Object}  [query={}]
   * @param {Number}  [query.page]            page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {Number}  [query.size]
   * @param {Number}  [query.offset]
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.maxSize=1000]       可选， 默认1000
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async moreById(id, { params = {}, query = {} }, options = {}) {
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
   * @param {Object}  params
   * @param {Object}  [query={}]
   * @param {Number}  [query.page]            page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {Number}  [query.size]
   * @param {Number}  [query.offset]
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.maxSize=1000]       可选， 默认1000
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async refreshById(id, { params = {}, query = {} }, options = {}) {
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
   * @param {Object}  params
   * @param {Number}  index
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async nth({ params = {} }, index, options = {}) {
    return this.list({ params, query: { page: index, size: 1, offset: 0 } }, options);
  }

  /**
   * get the first instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async first({ params = {} }, options = {}) {
    return this.list({ params, query: { page: 1, size: 1, offset: 0 } }, options);
  }

  /**
   * get the last instance
   *
   * @see {@link BaseService#list}
   * @param {Object}  params
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Array}   [options.attributes]
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async last({ params = {} }, options = {}) {
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
   * @param {Number}  id
   * @param {Object}  params
   * @param {Object}  [query={}]
   * @param {Number}  [query.page]            page 参数虽然可用，但尽量别用，容易把自己搞混，而且这里并不属于分页逻辑
   * @param {Number}  [query.size]
   * @param {Number}  [query.offset]
   * @param {Object}  [options={}]
     // * @param {Boolean} options.plain
     // * @param {Array}   options.attributes
   * @param {Array}   [options.maxSize=1000]       可选， 多字段排序时 限制最大的扫描数 默认1000
   * @param {Array}   [options.include]
   * @param {String}  [options.include.preset]
   * @param {Object}  [options.include.model]
   * @param {String}  [options.include.as]
   * @param {Array}   [options.include.attributes]
   * @param {Object}  [options.include.where]
   * @param {Boolean} [options.include.required]
   * @param {Array}   [options.include.include]
   * @param {Array}   [options.search]
   * @param {Array}   [options.sort]
   * @param {Array}   [options.filter]
   * @param {Object}  [options.transaction]
   * @param {Object}  [options.lock]
   * @returns {Object}
   * @memberof BaseService
   */
  async indexById(id, { params = {}, query = {} }, options = {}) {
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
   * @param {Object}  params
   * @param {Object}  body
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async increase({ params = {}, body = {} }, options = {}) {
    return await this.editSelf({ params, body }, 'increment', options);
  }

  /**
   * increase instance by primary key
   *
   * @param {Object}  id
   * @param {Object}  values
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async increaseById(id, values, options = {}) {
    return await this.editSelfById(id, values, 'increment', options);
  }

  /**
   * decrease instances
   *
   * @param {Object}  params
   * @param {Object}  body
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async decrease({ params = {}, body = {} }, options = {}) {
    return await this.editSelf({ params, body }, 'decrement', options);
  }

  /**
   * decrease instance by primary key
   *
   * @param {Object}  id
   * @param {Object}  values
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async decreaseById(id, values, options = {}) {
    return await this.editSelfById(id, values, 'decrement', options);
  }

  /**
   * update instances self
   *
   * @param {Object}  params
   * @param {Object}  body
   * @param {Object}  method                - 使用的方法 如 increase decrease 等 sequelize 实例支持的方法
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async editSelf({ params = {}, body = {} }, method, options = {}) {
    this[HANDLEINPUT](params, options);
    let oldInstances;
    // if (options.retDiffs) {
    oldInstances = await this.model.findAll({ where: params, transaction: options.transaction, lock: options.lock });
    // }
    const idList = [];
    const primaryKey = this.model.primaryKeyAttribute;
    for (let i = 0; i < oldInstances.length; i++) {
      idList.push(oldInstances[i][primaryKey]);
      await oldInstances[i][method](body, { transaction: options.transaction, lock: options.lock });
    }
    // const ret = await this.model.update(body, {where: params, transaction: options.transaction, lock: options.lock});
    if (options.retValues) {
      const instances = await this.model.findAll({ where: { [primaryKey]: idList }, transaction: options.transaction, lock: options.lock });
      if (oldInstances && options.retDiffs) {
        oldInstances = BaseService.toJSON(oldInstances, true);
        const diffs = BaseService.diffObjects(oldInstances, BaseService.toJSON(instances, true));
        return {
          datas: BaseService.toJSON(instances, options.plain),
          diffs,
        };
      }
      return BaseService.toJSON(instances, options.plain);
    }

    return {};
  }

  /**
   * update instance self by primary key
   *
   * @param {Object}  id
   * @param {Object}  values
   * @param {Object}  method                - 使用的方法 如 increase decrease 等 sequelize 实例支持的方法
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.retValue]      -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiff]       -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async editSelfById(id, values, method, options = {}) {
    this[HANDLEINPUT](null, options);
    let oldInstance;
    // if (options.retDiff) {
    oldInstance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
    // }
    await oldInstance[method](values, { transaction: options.transaction, lock: options.lock });
    if (options.retValue) {
      const instance = await this.model.findByPk(id, { transaction: options.transaction, lock: options.lock });
      if (oldInstance && options.retDiff) {
        oldInstance = BaseService.toJSON(oldInstance, true);
        const diff = BaseService.diffObject(oldInstance, BaseService.toJSON(instance, true));
        return {
          data: BaseService.toJSON(instance, options.plain),
          diff,
        };
      }

      return BaseService.toJSON(instance, options.plain);
    }

    return {};
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
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  originId              - 被移动的记录主键
   * @param {Object}  targetId              - 移动的目标记录主键
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  originId              - 被移动的记录主键
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  originId              - 被移动的记录主键
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  [options={}]v
   * @param {Boolean} [options.plain]
     // * @param {Boolean} options.filter        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * @param {Object}  originId              - 交换的记录主键
   * @param {Object}  targetId              - 被交换的记录主键
   * @param {Object}  [options={}]
   * @param {Boolean} [options.plain]
   * @param {Boolean} [options.filter]        -  可选，分类，分组筛选用，同 list 的 params、filter, 但不支持联表
   * @param {Boolean} [options.orderKey]      -  可选，排序字段，默认 order
   * @param {Boolean} [options.retValues]     -  可选，是否返回相关实例，默认 false
   * @param {Boolean} [options.retDiffs]      -  可选，是否返回记录的调整情况，默认 false
   * @param {Object}  [options.transaction]   -  可选，使用事务.
   * @param {Object}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
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
   * handle query options
   *
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @returns {Object}
   * @memberof BaseService
   */
  async [HANDLEOPTIONS](params, query, options) {
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
    this[HANDLENESTEDFIELDS](ret.search);
    this[HANDLENESTEDFIELDS](ret.filter);
    await this[HANDLENESTEDWHERE](params, query, _.assign({}, options, ret));
    // console.dir(ret);
    // console.dir(ret.search, {depth: null});
    // console.dir(ret.filter, {depth: null});
    return ret;
  }

  /**
   * handle pagination
   *
   * @param {Object} params
   * @param {Object} query
   * @param {Number} query.page
   * @param {Number} query.size
   * @param {Number} query.offset
   * @param {Object} options
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLEPAGINATION](params, query = {}, options) {
    const page = ~~query.page || 1;
    const size = Number.isInteger(Number(query.size)) && Number(query.size) >= 0 ? ~~query.size : this.size;
    const offset = Number.isInteger(Number(query.offset)) && Number(query.offset) >= 0 ? ~~query.offset : 0;
    return { page, size, offset };
  }

  /**
   * handle includes
   *
   * @param {Object}  params
   * @param {Object}  query
   * @param {Object}  options
   * @param {Array}   options.include       -  include 联表配置.
   *                          ----------------------------------------------
   * @param {String}  options.include.preset     -  有预设关系时，会导入相应的 include 信息
   *                                                包括 model，as，attributes，where，required，include
   *                                                注： include 是增量导入，（即与 options.include.include 不冲突）
   *                                  --------------------------------------
   * @param {Object}  options.include.model      -  关系表
   *                          ----------------------------------------------
   * @param {String}  options.include.as         -  as
   * @param {Array}   options.include.attributes -  返回字段
   * @param {Object}  options.include.where      -  where 条件
   * @param {Boolean} options.include.required   -  是否必须 影响联表方式 left join | join
   * @param {Array}   options.include.include    -  循环嵌套 与 options.include 一致
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
            _.assign(obj, this.include[item.preset], _.pick(item, ['as', 'attributes', 'where', 'required']));
            if (item.include) {
              obj.include = (obj.include || []).concat(item.include);
            }
          } else {
            _.assign(obj, item);
          }
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
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @param {Array}  options.search  -  关键字搜索.  [{key:'string',fields:[String|{[prefix,]field,type,mode}]}|[String|{[prefix,]field,type,mode}]}]]
   * @param {String} options.search.key
   * @param {String|Object|Array}  options.search.fields
   * @param {Array}  options.search.fields.prefix  联表的时候使用的，用于在外层搜索联表的字段
   * @param {Array}  options.search.fields.type    搜索类型 可选值有 fuzzy range 默认 fuzzy
   * @param {Array}  options.search.fields.mode    搜索模式 可选值有 full left right none，仅在 fuzzy range 下有效
   *                                                        type = fuzzy 时 默认 full
   *                                                        type = range 时 默认 full
   * @returns {Object}
   * @memberof BaseService
   */
  [HANDLESEARCHS](params, query, options = {}) {
    //         模糊    区间
    //  type = fuzzy   range
    //         %key%   [start,end]
    //  默认 full
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

        _.map(fields, field => {
          if (typeof field === 'string') {
            if (field.indexOf('.') >= 0) {
              field = field.split('.');
              list.push([{
                prefix: field.slice(0, -1).join('.'),
                field : field.slice(-1)[0],
              }]);
            } else {
            // String
              list.push([{ field }]);
            }
          } else if (!Array.isArray(field)) {
            // {[prefix,]field,type,mode}
            list.push([field]);
          } else {
            // [String|{[prefix,]field,type,mode}]
            const tmp = [];
            _.map(field, f => {
              if (typeof f === 'string') {
                // String
                tmp.push({ field: f });
              } else if (!Array.isArray(f)) {
                // {[prefix,]field,type,mode}
                tmp.push(f);
              }
            });
            list.push(tmp);
          }
        });
        _.map(list, items => {
          const keyVal = {};
          _.map(items, item => {
            let k = '';
            let v = `%${key}%`;
            if (item.prefix) {
              // sequelize 的量表查询并不会吧我们使用的 column 转换成对应数据库表字段，这里我们兼容处理下
              const prefixModels = item.prefix.split('.');
              let nestModel = this.model.associations[prefixModels[0]] ? this.model.associations[prefixModels[0]].target : null;
              if (nestModel) {
                for (let i = 1; i < prefixModels.length; i++) {
                  if (nestModel.associations[prefixModels[i]]) {
                    nestModel = nestModel.associations[prefixModels[i]].target;
                  } else {
                    nestModel = null;
                    break;
                  }
                }
              }
              if (nestModel) {
                if (nestModel.rawAttributes[item.field]) {
                  item.field = nestModel.rawAttributes[item.field].field;
                }
              }
              k = `$${item.prefix}.${item.field}$`;
            } else {
              k = item.field;
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
                  v = { [Op.eq]: key };
                  break;
                case 'left':
                  v = { [Op.like]: `%${key}` };
                  break;
                case 'right':
                  v = { [Op.like]: `${key}%` };
                  break;
                default: //  full
                  v = { [Op.like]: `%${key}%` };
                  break;
              }
            } else if (item.type === 'range') {
              item.mode = item.mode || defRangeMode;
              if (typeof key === 'string') {
                key = [key];
              }
              let [start, end] = key/* .split(',', 2)*/;
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
              keyVal[k] = v;
            }
          });

          if (_.keys(keyVal).length) {
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
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @param {Array}  options.sort -  指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
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
          // String
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
            let nestModel = this.model.associations[prefixModels[0]] ? this.model.associations[prefixModels[0]].target : null;
            if (nestModel) {
              for (let i = 1; i < prefixModels.length; i++) {
                if (nestModel.associations[prefixModels[i]]) {
                  nestModel = nestModel.associations[prefixModels[i]].target;
                } else {
                  nestModel = null;
                  break;
                }
              }
            }
            attr = nestModel.rawAttributes[attr].field;
            associationModel = nestModel;
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
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @param {Array}  options.filter -  过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search
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
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @param {Array}  options.attributes  -  需要获取的属性列表.默认全部.
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
   * sequelize 不会自动吧 model 定义的字段转成数据库的字段
   * @param {Object} obj
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
      _.map(obj, (value, key) => {
        if (key[0] === '$' && key[0] === key[key.length - 1]) {
          const item = key.slice(1, -1).split('.');
          const prefixModels = item.slice(0, -1);
          let nestField = item.slice(-1);
          let nestModel = this.model.associations[prefixModels[0]] ? this.model.associations[prefixModels[0]].target : null;
          if (nestModel) {
            for (let i = 1; i < prefixModels.length; i++) {
              if (nestModel.associations[prefixModels[i]]) {
                nestModel = nestModel.associations[prefixModels[i]].target;
              } else {
                nestModel = null;
                break;
              }
            }
          }
          if (nestModel) {
            if (nestModel.rawAttributes[nestField]) {
              nestField = nestModel.rawAttributes[nestField].field;
              obj[`$${prefixModels.join('.')}.${nestField}$`] = value;
              delete obj[key];
            }
          }
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
   * 这里的处理方案是先在子表筛选出可能的数据，再把 $xxx$ 的筛选条件 转化为对主表的 筛选条件
   * 目前针对 search、filter进行处理
   * @param {Object} params
   * @param {Object} query
   * @param {Object} options
   * @param {Array}  options.attributes  -  需要获取的属性列表.默认全部.
   * @param {Object}  [options.transaction] -  可选，使用事务
   * @param {Object}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Object}
   * @memberof BaseService
   */
  async [HANDLENESTEDWHERE](params, query, options = {}) {
    const transaction = options.transaction;
    const lock = options.lock;
    const search = options.search;
    const filter = options.filter;
    const includeList = _.cloneDeep(options.include);
    BaseService.emptyAttr(includeList);
    // size = 0 时 无须处理
    if (query.size) {
      if (search[Op.and]) {
        for (let i = 0; i < search[Op.and].length; i++) {
          for (let j = 0; j < search[Op.and][i][Op.or].length; j++) {
            const sItem = search[Op.and][i][Op.or][j];
            for (const field in sItem) {
              const value = sItem[field];
              const ret = await this[HANDLESUBTABLESEARCH](field, value, includeList, transaction);
              if (ret.key) {
                // 调整后的值直接用数组展示，并不会使用 Symbol
                // 而调整前的值大多时候使用 Op.like 等 Symbol， 这里需要做一个转换输出，（只[需]做一层）
                const oldValue = _.cloneDeep(value);
                if (Array.isArray(oldValue)) {
                  // 如果是数组，说明不会包含Symbol
                  // pass
                } else {
                  const symbols = Object.getOwnPropertySymbols(oldValue);
                  for (const idx in symbols) {
                    const symbol = symbols[idx];
                    oldValue[symbol.toString()] = oldValue[symbol];
                    delete oldValue[symbol];
                  }
                }
                this.logging.info(
                  chalk.cyan('[model] [search]'),
                  chalk.red(JSON.stringify({ [field]: oldValue })),
                  chalk.cyan('->'),
                  chalk.green(JSON.stringify({ [ret.key]: ret.value })));
              }
              this[HANDLESETSUBTABLESEARCHRET](sItem, field, ret);
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
      if (filter) {
        for (const field in filter) {
          const value = filter[field];
          const ret = await this[HANDLESUBTABLESEARCH](field, value, includeList, transaction, lock);
          if (ret.key) {
            // 调整后的值直接用数组展示，并不会使用 Symbol
            // 而调整前的值大多时候使用 Op.like 等 Symbol， 这里需要做一个转换输出，（只做一层）
            const oldValue = _.cloneDeep(value);
            if (Array.isArray(oldValue)) {
              // 如果是数组，说明不会包含Symbol
              // pass
            } else {
              const symbols = Object.getOwnPropertySymbols(oldValue);
              for (const idx in symbols) {
                const symbol = symbols[idx];
                // console.log(symbol);
                oldValue[symbol.toString()] = oldValue[symbol];
                delete oldValue[symbol];
              }
            }
            this.logging.info(
              chalk.cyan('[model] [filter]'),
              chalk.red(JSON.stringify({ [field]: oldValue })),
              chalk.cyan('->'),
              chalk.green(JSON.stringify({ [ret.key]: ret.value })));
          }
          this[HANDLESETSUBTABLESEARCHRET](filter, field, ret);
        }
      }
    }
    return { search, filter };
  }

  async [HANDLESUBTABLESEARCH](field, value, includeList, transaction, lock) {
    if (field[0] === '$') {
      const nestedList = field.slice(1, -1).split('.');
      const nestedFItem = nestedList[0];
      let matchInclude;
      _.map(includeList, include => {
        if ((include.as && include.as === nestedFItem)
              || (include.model.name === Utils.singularize(nestedFItem))) {
          matchInclude = include;
        }
      });
      const association = this.model.associations[nestedFItem];
      if (matchInclude && association) {
        if (association.associationType === 'BelongsToMany') {
          let whereKey = `$${nestedList.slice(1).join('.')}$`;
          if (nestedList.length === 2) {
            whereKey = `$${matchInclude.model.name}.${nestedList.slice(1).join('.')}$`;
          } else if (nestedList.length > 2 && nestedList[1] === association.throughModel.name) {
            whereKey = `$${Utils.pluralize(this.model.name)}.${nestedList.slice(1).join('.')}$`;
          }
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
            where     : { [whereKey]: value },
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
        } if (association.associationType === 'BelongsTo') {
          let whereKey = `$${nestedList.slice(1).join('.')}$`;
          if (nestedList.length === 2) {
            whereKey = `$${matchInclude.model.name}.${nestedList.slice(1).join('.')}$`;
          }
          const datas = BaseService.toJSON(await matchInclude.model.findAll({
            attributes: [association.targetKey],
            where     : { [whereKey]: value },
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
        let whereKey = `$${nestedList.slice(1).join('.')}$`;
        if (nestedList.length === 2) {
          whereKey = `$${matchInclude.model.name}.${nestedList.slice(1).join('.')}$`;
        }
        const datas = BaseService.toJSON(await matchInclude.model.findAll({
          attributes: [association.foreignKey],
          where     : { [whereKey]: value },
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

  [HANDLESETSUBTABLESEARCHRET](sItem, field, ret) {
    if (ret.key) {
      // delete  search[Op.and][i][Op.or][j][field];
      // search[Op.and][i][Op.or][j][ret.key] = ret.value;
      if (ret.key !== field) {
        delete sItem[field];
      }
      // if (ret.value.length) {
      if (sItem[Op.and] === undefined
              && sItem[ret.key] === undefined) {
        sItem[ret.key] = ret.value;
      } else {
        if (sItem[Op.and] === undefined) {
          sItem[Op.and] = [];
          for (const key in sItem) {
            sItem[Op.and].push({ [key]: sItem[key] });
            delete sItem[key];
          }
        }
        sItem[Op.and].push({ [ret.key]: ret.value });
      }
      // }
    }
  }


  /**
   * handle input
   * 调用 HANDLEUNDEFINEDVALUES 处理 undefind 值的参数
   * @param {Object} params
   * @param {Object} options
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
   * @param {Object} obj
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

  static diffObject(left, right, options = {}) {
    const detail = [];
    _.map(left, (value, key) => {
      if (value && !right[key]) {
        detail.push({ [key]: { type: 'remove', before: value, after: right[key] } });
      }
      if (value && right[key] && !_.isEqual(right[key], value)) {
        detail.push({ [key]: { type: 'edit', before: value, after: right[key] } });
      }
    });
    _.map(right, (value, key) => {
      if (!left[key] && value) {
        detail.push({ [key]: { type: 'add', before: left[key], after: value } });
      }
    });
    return detail;
  }

  static diffObjects(leftDatas, rightDatas, options = {}) {
    const details = [];
    for (let i = 0; i < leftDatas.length; i++) {
      details.push(BaseService.diffObject(leftDatas[i], rightDatas[i]));
    }
    return details;
  }
}

module.exports = BaseService;

