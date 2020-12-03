import Egg from 'egg';
import Sequelize from 'sequelize';

declare module 'egg' {
  type Func = 'list' | 'listAll' | 'count' | 'countAll' | 'info' | 'infoById' | 'add' | 'addMulti' | 'edit' | 'editById' | 'remove' | 'removeById' | 'set' |
    'moreById' | 'refreshById' | 'indexById' | 'nth' | 'first' | 'last' | 'increase' | 'increaseById' | 'decrease' | 'decreaseById' | 'editSelf' | 'editSelfById' |
    'move' | 'moveById' | 'moveUp' | 'moveUpById' | 'moveDown' | 'moveDownById' | 'change' | 'changeById';
  /** 
   * 构造方法 prefix 参数
   */
  type BaseServicePrefix = {
    /* 默认 20 分页大小 */
    size ? : number = 20;
    /* 可选，是否为假删除方式， 默认 false */
    fake ? : boolean = false;
    /* 可选，存储与 session 的 user 的 id 字段名，默认 id，在条件允许的情况下（含有 session 并且未传入 body.XXXUserId）时获取操作人信息补全数据 */
    sessionUserIdField ? : string = 'id';
    /* 可选，createUserId 字段名，默认 createUserId，在 add 接口会自动追加上相应的数据 (session.user.id) */
    createUserIdField ? : string = 'createUserId';
    /* 可选，createTime 字段名，默认 createTime，在 add 接口会自动追加上相应的数据 */
    createTimeField ? : string = 'createUserId';
    /* 可选，updateUserId 字段名，默认 updateUserId，在 edit 接口会自动追加上相应的数据 (session.user.id) */
    updateUserIdField ? : string = 'updateUserId';
    /* 可选，updateTime 字段名，默认 updateTime，在 edit 接口会自动追加上相应的数据 */
    updateTimeField ? : string = 'updateTime';
    /* 可选，fake 为 true 时有效，deleteUserId 字段名，默认 deleteUserId，在 remove 接口会自动追加上相应的数据 (session.user.id) */
    deleteUserIdField ? : string = 'deleteUserId';
    /* 可选，fake 为 true 时有效，deleteTime 字段名，默认 deleteTime，在 remove 接口会自动追加上相应的数据 */
    deleteTimeField ? : string = 'deleteTime';
    /* 日志输出 */
    logging ? : boolean | Object = false;
    /* 预设联表关系={key:value} */
    include ? : {
      [key: string]: IncludePreset;
    };
    /* 是否开启操作日志整理，开启则会把操作记录整理到 ctx.operatorLogs 中 */
    operatorLog ? : boolean = false;
    /* 日志记录字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集 */
    logField ? : string[];
    /* 日志记录排除字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集 */
    logOmitField ? : string[];
    /* 字段可取值枚举，格式为 { [字段名]: 值映射对象 } 如 { enable: { 0: '禁用', 1: '启用' } } 。 仅 operatorLog === true 有用。用于日志信息显示。 */
    enums ? : Object;
    /* 记录日志方法，方法传入一个参数：该方法产生的操作日志。仅 operatorLog === true 有用。 */
    async addLogCallback ? (log: OperatorLog) : Promise < any > ;
  }

  /** 预设关联信息类型 */
  type IncludePreset = {
    /** 关系表 */
    model: IModel;
    /** as */
    as ? : string;
    /** 返回字段 */
    attributes ? : string[];
    /** where 条件 */
    where ? : Sequelize.WhereOptions;
    /** 是否必须 影响联表方式 left join | join */
    required ? : boolean;
    /** 
     * 搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。其他三项
     * 为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的 
     */
    scope ? : Scope;
    /**嵌套循环 */
    include ? : Include;
  }

  /** 
   * 搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。其他三项
   * 为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的 
   */
  type Scope = 'default' | 'deleted' | 'updated' | 'all';

  /** 关联信息类型 */
  type Include = {
    /** 
     * 有预设关系时，会导入相应的 include 信息，值应为在 Service 中配置好的 IncludePreset 的键
     * 包括 model，as，attributes，where，required，include
     * 注： include 是增量导入，（即与 options.include.include 不冲突）
     */
    preset ? : string;
    /** 关系表 */
    model ? : IModel;
    /** as */
    as ? : string;
    /** 返回字段 */
    attributes ? : string[];
    /** where 条件 */
    where ? : Sequelize.WhereOptions;
    /** 是否必须 影响联表方式 left join | join */
    required ? : boolean;
    /**嵌套循环 */
    include ? : Include;
  }

  /** 搜索配置类型 */
  type Search = {
    /**
     * 搜索关键字
     * 有 2 中写法
     * 1. 字符串： poi , 此时 SearchField 的 type 默认为 fuzzy，即模糊搜索模式
     * 2. 两个元素的字符串数组：[ '1', '10' ]，此时 SearchField 的 type 默认为 range，即区间搜索模式，即搜索 值在 [ '1', '10' ] 之间的数据
     */
    key: string | [string, string];
    /** 作用字段 */
    fields: [SearchField[] | SearchField];
  }

  /**
   * 搜索字段类型
   * 有 2 中写法
   * 1. 字符串： name 、 Users.Roles.name
   * 2. 对象： { field: 'name' } 、 { prefix: 'Users.Roles', field: 'name', type: 'fuzzy', mode: 'full' }
   */
  type SearchField = string | {
    /** 中间关联表 搜索联表字段时，需要以此传入途径的关联表 如 UserRole.Roles */
    prefix ? : string;
    /** 搜索字段 */
    field: string;
    type ? : SearchFieldType = 'fuzzy';
    mode ? : SearchFieldMode = 'full';
  };

  /** 搜索类型 可选值有 fuzzy range 默认 fuzzy */
  type SearchFieldType = 'fuzzy' | 'range';

  /** 可选值有 full left right none, 默认 full*/
  type SearchFieldMode = 'full' | 'left' | 'right' | 'none';

  /** 
   * 排序配置类型
   * ['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
   * 排序数组元素总的写法分为以下几种
   * 1. 字符串：使用前缀 `+``-` 号分别代表 `ASC``DESC`; 如： '+name' 、 '-Users.UserRoles.name'
   * 2. 数组: sequelize 原生写法; 如： ['name', 'ASC'] 、 ['Users', 'UserRoles', 'name', 'DESC']
   * 参数后面带 [GBK] 带面字段需要转成 GBK 编码进行排序（即需要中文顺序时可使用）
   * */
  type Sort = [string | string[]];

  /** 过滤判断配置类型 */
  type Filter = Sequelize.WhereOptions;

  type LogInfoDiff = {
    /** 字段名 */
    key: string;
    type: 'add' | 'edit' | 'remove';
    /** 变化前值 */
    before: any;
    /** 变化后值 */
    after: any;
  }

  type LogMessageDiff = {
    /** 字段名 */
    key: string;
    /** 字段值变化情况 */
    change: string;
    /** 变化的日志内容 */
    content: any;
  }

  type LogInfo = {
    /** 操作类型 */
    type: 'all' | 'search' | 'add' | 'edit' | 'remove' | 'set' | 'editSelf';
    /** 操作方法 */
    method: 'select' | 'list' | 'info' | 'infoById' | 'add' | 'addMulti' | 'edit' | 'editById' | 'fakeRemove' | 'remove' | 'fakeRemoveById' | 'removeById' | 'set';
    /** 操作语句（all 类型用） */
    sql ? : string;
    /** 搜索的日志数量（search 用）*/
    count ? : number;
    /** 搜索的参数（search 用）*/
    params ? : any,
    /** 搜索的参数（search 用）*/
    query ? : any,
    /** 搜索的配置（search 用）*/
    options ? : Options;
    /** 搜索的联表配置（search 用）*/
    include ? : Include;
    /** 搜索的排序配置（search 用）*/
    sort ? : string[];
    /** 修改前数据 （除 all、search 外均可用）*/
    before ? : any;
    /** 修改后数据 （除 all、search 外均可用）*/
    after ? : any;
    /** 多记录字段变化内容（edit 用）*/
    diffs ? : LogInfoDiff[];
    /** 单记录字段变化内容（edit 用）*/
    diff ? : LogInfoDiff
    /** 单记录字段变化内容（set 用）*/
    changed ? : {
      /** 删除记录条数量*/
      toRemove: number;
      /** 添加记录条数量*/
      toAdd: number;
      /** 编辑记录条数量*/
      toEdit: number;
    }
  }

  type LogMessage = {
    /** 操作类型 */
    op: '添加' | '批量添加' | '删除' | '（假）删除' | '查询' | '编辑' | '设置' | '无分类';
    /** 影响记录条数 （除查询、无分类外均可用） */
    affect ? : number;
    /** 自动生成的操作日志 */
    content: string;
    /** 查询记录条数（仅查询用） */
    count ? : number;
    /** 
     * 联表信息（仅查询用）
     * 值为关联表表名数组 
     */
    include ? : string[];
    /** 
     * 排序信息（仅查询用） 
     * 值为经处理后的排序信息数组 
     */
    sort ? : string[];
    /** 
     * 查询条件信息（仅查询用）
     * 值为经处理后的查询条件信息
     */
    condition ? : string[];
    /**
     * 变化信息（仅编辑用） 
     * 修改多条记录时
     * 二维数组，外层为对应的一条条记录，内层则为相应记录的字段变化信息列表
     */
    diffs ? : LogMessageDiff[];
    /** 
     * 变化信息（仅编辑用） 
     * 修改单条记录时（ById）
     * 一维数组，值为相应记录的字段变化信息列表
     */
    diff ? : LogMessageDiff;
    /** 删除记录条数量（仅设置用）*/
    remove ? : number;
    /** 增加记录条数量（仅设置用）*/
    add ? : number;
    /** 编辑记录条数量（仅设置用）*/
    edit ? : number;
  }

  /** 数据库操作日志类型 */
  type OperatorLog = {
    /** 方法名 */
    func: Func;
    /** 涉及的所有数据库操作信息 */
    logInfos: LogInfo[];
    /** 涉及的所有数据库操作信息日志 */
    logMessages: LogMessage[];
    /** 
     * 数据库操作信息
     * `${func}` 方法的操作信息
     * （值为 logInfos 最后一个元素）
     */
    logInfo: LogInfo;
    /** 
     * 数据库操作信息日志
     * `${func}` 方法的操作信息日志
     * （值为 logMessages 最后一个元素）
     */
    logMessage: LogMessage;
  }

  type ParamsObject = {
    [key: string]: any
  } & Sequelize.WhereOptions;
  type QueryObject = {
    page: number;
    size: number;
    offset: number;
  }
  type BodyObject = {
    [key: string]: any
  }

  type Options = {
    /** 可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据 */
    plain ? : boolean;
    /** 可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效. */
    replacements ? : any;
    /** 可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效. */
    bind ? : any;
    /** 可选，sequelize.query 参数. */
    type ? : string;

    /** 选，设置事务的autocommit（自动完成）属性，默认 true */
    autocommit ? : boolean;
    /** 
     * 可选，事务隔离级别，默认为 REPEATABLE READ，推荐使用 Sequelize 提供的枚举
     *    Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED // "READ UNCOMMITTED"
     *    Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED   // "READ COMMITTED"
     *    Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ  // "REPEATABLE READ"
     *    Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE     // "SERIALIZABLE"
     */
    isolationLevel ? : string;

    /** 可选，是否获取分页数据.默认 false | count list 至少一个为 true */
    count ? : boolean = false;
    /** 可选，是否获取列表数据.默认 true  | count list 至少一个为 true */
    list ? : boolean = true;
    /** 可选，是否分拆联表语句进行搜索.默认 true，此时如果搜索字段涉及了子表字段，则会将该条件在子表中进行搜索转换成主表中的主键 */
    splitSQL ? : boolean = true;
    /** 
     * 可选，搜索数据范围，可选值 'default' 'deleted' 'updated' 'all'，默认值为 'default' 搜索范围会忽略假删除的数据。
     *    其他三项为其字面意思，分别为：已经删除的（假删除），被编辑过的（已过滤假删除数据），所有的
     */
    scope ? : string = 'default';
    /** 可选，需要获取的属性列表.默认全部. */
    attributes ? : Array < string > = null;
    /** 可选，include 联表配置. */
    include ? : Include[];
    /**
     * 可选，关键字搜索.  [{ key: string | [string,string], fields: [string | {[prefix,]field,type,mode} | [string | {[prefix,]field,type,mode}] }]
     *    prefix 是联表的时候使用的，用于在外层搜索联表的字段
     */
    search ? : Search[];
    /**  
     * 可选，指定排序规则.['+aaa[GBK]','-bbb','ccc',['aaa','DESC'],['-aaa'],[model,[associateModel,]'ddd','ASC'],[model,[associateModel,]'-ddd']]
     *       排序规则字段后面带 [GBK] 表示使用 GBK 编码排序，也就是按拼音排序
     */
    sort ? : Sort;
    /** 可选，过滤信息.对应 <Sequelize> 的 where 条件，不推荐弄太复杂，对于搜索请用 search */
    filter ? : Filter;

    /** 可选，是否返回相关实例，默认 false */
    retValues ? : string = false;
    /** 可选，是否返回记录的调整情况，默认 false */
    retDiffs ? : string = false;

    /** 可选，是否返回相关实例，默认 false */
    retValue ? : string = false;
    /** 可选，是否返回记录的调整情况，默认 false */
    retDiff ? : string = false;

    /** 可选，是否使用假删除， 默认 this.fake。（默认情况下与配置一致，同时也允许进行真删除 ） */
    fake ? : string;
    /** 可选，fake 为 true 时有效，假删除时候更新的数据（键值对），如果需要处理 操作人操作时间外，需要更新其他字段可用（意同 edit 方法中的 body） */
    fakeBody ? : Object;

    /** 可选， 默认1000, 限制最大扫描数 */
    maxSize ? : number = 1000;

    /** 可选，排序字段，默认 order */
    orderKey ? : string = 'order';

    /** 可选，使用事务. */
    transaction ? : Sequelize.Transaction;
    /** 可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取） */
    lock ? : Sequelize.Transaction.LOCK;
  }

  type rawOptions = Pick < Options, 'replacements' | 'bind' | 'type' | 'transaction' | 'lock' > ;
  type transactionOptions = Pick < Options, 'autocommit' | 'isolationLevel' > ;
  type listOptions = Pick < Options, 'count' | 'list' | 'splitSQL' | 'scope' | 'attributes' | 'include' | 'search' | 'sort' | 'filter' | 'transaction' | 'lock' > ;
  type addOptions = Pick < Options, 'plain' | 'transaction' | 'lock' > ;
  type editOptions = Pick < Options, 'scope' | 'plain' | 'retValues' | 'retDiffs' | 'transaction' | 'lock' > ;
  type editOneOptions = Pick < Options, 'scope' | 'plain' | 'retValue' | 'retDiff' | 'transaction' | 'lock' > ;
  type removeOptions = Pick < Options, 'scope' | 'plain' | 'fake' | 'fakeBody' | 'retValues' | 'transaction' | 'lock' > ;
  type indexOptions = Pick < Options, 'maxSize' | 'count' | 'list' | 'splitSQL' | 'scope' | 'attributes' | 'include' | 'search' | 'sort' | 'filter' | 'transaction' | 'lock' > ;

  type moveOptions = Pick < Options, 'scope' | 'plain' | 'filter' | 'orderKey' | 'retValues' | 'retDiffs' | 'transaction' | 'lock' > ;

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
     * @param {boolean|Object}  [preset.logging=false]     日志输出
     * @param {Object.<string, Egg.IncludePreset>}  [preset.include]      预设联表关系={key:value}
     * @param {boolean}   [preset.operatorLog]    -  是否开启操作日志整理，开启则会把操作记录整理到 ctx.operatorLogs 中
     * @param {string[]}  [preset.logField]       -  日志记录字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集
     * @param {string[]}  [preset.logOmitField]  -  日志记录排除字段列表，仅 operatorLog === true 有用。同时传入 logField、logOmitField 时取交集
     * @param {Object}   [preset.enums]           -  字段可取值枚举，格式为 { [字段名]: 值映射对象 } 如 { enable: { 0: '禁用', 1: '启用' } } 。 仅 operatorLog === true 有用。用于日志信息显示。
     * @param {Function} [preset.addLogCallback]  -  记录日志方法，方法传入一个参数：该方法产生的操作日志。仅 operatorLog === true 有用。
     * @memberof BaseService
     */
    constructor(ctx: Egg.Context, model: Egg.EggModelType | Sequelize.ModelType, preset ? : BaseServicePrefix);

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
   * @param {Sequelize.LOCK}  [options.lock]         -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
   * @returns {Promise<Object>}
   */
    async query(sql: string, options: rawOptions): Promise < Object > ;

    /**
     * review sequelize.select
     * @param {string}  sql          - sql 语句
     * @param {Object}  [options={}] - 可选参数
    // * @param {boolean} options.plain        -  可选，是否返回 raw 数据.默认 false. 返回 Sequelize.Model 包装过的数据
     * @param {*}       [options.replacements] -  可选，sequelize.query 参数. 使用 replacements 方式替换语句变量 时有效.
     * @param {*}       [options.bind]         -  可选，sequelize.query 参数. 使用 bind         方式替换语句变量 时有效.
     * @param {string}  [options.type]         -  可选，sequelize.query 参数.
     * @param {Sequelize.Transaction}  [options.transaction]  -  可选，使用事务.
     * @param {Sequelize.LOCK}  [options.lock]         -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     */
    async select(sql: string, options: rawOptions): Promise < Object > ;

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
    async transaction(options: transactionOptions): Promise < Sequelize.Transaction > ;

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
     * @param {boolean} [options.splitSQL=true] -  可选，是否分拆联表语句进行搜索.默认 true，此时如果搜索字段涉及了子表字段，则会将该条件在子表中进行搜索转换成主表中的主键搜索条件，
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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async list(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions): Promise < Object[] | {
      count: number,
      rows: Object[]
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async listAll(args: {
      params: ParamsObject,
    }, options: listOptions): Promise < Object[] > ;

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async count(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions): Promise < number > ;

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async countAll(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions): Promise < number > ;

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async listAndCount(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions);

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async listAndCountAll(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions): Promise < {
      count: number,
      rows: Object[]
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async info(args: {
      params: ParamsObject,
      query: QueryObject
    }, options: listOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async infoById(id: number | string, options: listOptions): Promise < Object > ;

    /**
     * add an instance
     *
     * @param {Object}  args -
     * @param {Object}  [args.params] -
     * @param {Object}  [args.body]   -
     * @param {Object}  [options={}]          -
     * @param {boolean} [options.plain=false] -
     * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async add(args: {
      params: ParamsObject,
      body: BodyObject
    }, options: addOptions): Promise < Object > ;

    /**
     * add instances
     *
     * @param {Array}   records - 记录列表
     * @param {Object}  [options={}]          -
     * @param {boolean} [options.plain=false] -
     * @param {Sequelize.Transaction}  [options.transaction] -  可选，使用事务.
     * @param {Sequelize.LOCK}  [options.lock]        -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object[]>}
     * @memberof BaseService
     */
    async addMulti(records: Object[], options: addOptions): Promise < Object[] > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async edit(args: {
      params: ParamsObject,
      body: BodyObject
    }, options: editOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async editById(id: number | string, values: Object, options: editOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async remove(args: {
      params: ParamsObject
    }, options: removeOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async removeById(id: number | string, options: removeOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async set(args: {
      params: ParamsObject
    }, records: Object[], options: editOptions & removeOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]              -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moreById(id: number | string, args: {
      params: ParamsObject,
      query: QueryObject
    }, options: indexOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async refreshById(id: number | string, args: {
      params: ParamsObject,
      query: QueryObject
    }, options: indexOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async nth(args: {
      params: ParamsObject
    }, index, options: listOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async first(args: {
      params: ParamsObject
    }, options: listOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async last(args: {
      params: ParamsObject
    }, options: listOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async indexById(id: number | string, args: {
      params: ParamsObject,
      query: QueryObject
    }, options: indexOptions): Promise < number > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async increase(args: {
      params: ParamsObject,
      body: BodyObject
    }, options: editOptions): Promise < Object > ;

    /**
     * increase instance by primary key
     *
     * @param {number|string}  id - 主键
     * @param {Object}  values - 自增信息
     * @param {Object}  [options={}]                -
     * @param {Egg.Scope} [options.scope='default'] -
     * @param {boolean} [options.plain=false]       -
     * @param {string[]}  [options.attributes]        -  可选，功能同 Sequelize.increment 方法的 attributes 参数，用于更新数据，但不需要自增等才做，如传入 { deleteUserId: 3 }, 则该操作同时也会设置 deleteUserId 值为 3
     * @param {boolean} [options.retValues=false]   -  可选，是否返回相关实例，默认 false
     * @param {boolean} [options.retDiffs=false]    -  可选，是否返回记录的调整情况，默认 false
     * @param {Sequelize.Transaction}  [options.transaction]   -  可选，使用事务.
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async increaseById(id: number | string, values: Object, options: editOneOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async decrease(args: {
      params: ParamsObject,
      body: BodyObject
    }, options: editOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async decreaseById(id: number | string, values: Object, options: editOneOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async editSelf(args: {
      params: ParamsObject,
      body: BodyObject
    }, method, options: editOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async editSelfById(id: number | string, values: Object, method: string, options: editOneOptions): Promise < Object > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async move(origin: Object, target: Object, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moveById(originId: number | string, targetId: number | string, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } & {
      noChange: true
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moveUp(origin: Object, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } & {
      noChange: true
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moveUpById(originId: number | string, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } & {
      noChange: true
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moveDown(origin: Object, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } & {
      noChange: true
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async moveDownById(originId: number | string, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } & {
      noChange: true
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async change(origin: Object, target: Object, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } > ;

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
     * @param {Sequelize.LOCK}  [options.lock]          -  可选，使用事务时.锁定已选行. 取值有 transaction.LOCK.UPDATE、 transaction.LOCK.SHARE （必须通过事务对象实例获取）
     * @returns {Promise<Object>}
     * @memberof BaseService
     */
    async changeById(originId: number | string, targetId: number | string, options: moveOptions): Promise < {
      move: Object,
      origin: Object
    } > ;
  }
}