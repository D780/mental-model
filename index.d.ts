import 'egg';
// 将该上层框架用到的插件 import 进来
import 'egg-onerror';
import 'egg-session';
import 'egg-i18n';
import 'egg-watcher';
import 'egg-multipart';
import 'egg-security';
import 'egg-development';
import 'egg-logrotator';
import 'egg-schedule';
import 'egg-static';
import 'egg-jsonp';
import 'egg-view';
import 'egg-view-nunjucks';
import 'egg-router-plus';
import 'egg-sequelize';
import 'egg-session-redis';
import 'egg-redis';
import 'egg-cors';
import 'egg-passport';
import 'egg-bcrypt';
import 'egg-valparams';

import _BaseService = require('./lib/base_service');
import _BaseController = require('./lib/base_controller');
import _NonError = require('./lib/non-error');

import _ConfigDefault = require('./config/config.default');
import _UtilsIndex = require('./utils/index');
import _Excel = require('./utils/excel');
import _JSZipExtra = require('./utils/jszip-extra');
import _SequelizeCache = require('./utils/sequelize-cache');

import _AccessLogger  = require('./app/middleware/access_logger');
import _Gzip = require('./app/middleware/gzip');
import _ResponseWrapper = require('./app/middleware/response_wrapper');

import { Sequelize } from 'sequelize/types';
import sequelize = require('sequelize');

type ConfigDefault= ReturnType<typeof _ConfigDefault>;
type UtilsIndex= ReturnType<typeof _UtilsIndex>;

declare module 'egg' {  
  /** 预设关联信息类型 */
  type IncludePreset = { 
    /** 关系表 */
    model: IModel;
    /** as */
    as: string;
    /** 返回字段 */
    attributes: string[];
    /** where 条件 */
    where: sequelize.WhereOptions;
    /** 是否必须 影响联表方式 left join | join */
    required: boolean;
    /**嵌套循环 */
    include: Include;
  }

  /** 关联信息类型 */
  type Include = {    
    /** 
     * 有预设关系时，会导入相应的 include 信息，值应为在 Service 中配置好的 IncludePreset 的键
     * 包括 model，as，attributes，where，required，include
     * 注： include 是增量导入，（即与 options.include.include 不冲突）
     */
    preset: string;
    /** 关系表 */
    model: IModel;
    /** as */
    as: string;
    /** 返回字段 */
    attributes: string[];
    /** where 条件 */
    where: sequelize.WhereOptions;
    /** 是否必须 影响联表方式 left join | join */
    required: boolean;
    /**嵌套循环 */
    include: Include;
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
    fields: [ SearchField[] | SearchField ];
  }

  /**
   * 搜索字段类型
   * 有 2 中写法
   * 1. 字符串： name 、 Users.Roles.name
   * 2. 对象： { field: 'name' } 、 { prefix: 'Users.Roles', field: 'name', type: 'fuzzy', mode: 'full' }
   */
  type SearchField = string | {
    /** 中间关联表 搜索联表字段时，需要以此传入途径的关联表 如 UserRole.Roles */
    prefix?: string;
    /** 搜索字段 */
    field: string;
    type?: SearchFieldType;
    mode?: SearchFieldMode;
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
  type Sort = [ string | string[] ];

  /** 过滤判断配置类型 */
  type Filter = sequelize.WhereOptions;

  type _logInfo = {
    /** 操作类型 */
    type: string;
    /** 操作方法 */
    method: string;
    /** 操作语句（all 类型用） */
    sql?: string;
    /** 搜索的日志数量（search 用）*/
    count?: number;    
    /** 搜索的参数（search 用）*/
    params?: any,
    /** 搜索的参数（search 用）*/
    query?: any,
    /** 搜索的配置（search 用）*/
    options?: any;
    /** 搜索的联表配置（search 用）*/
    include?: Include;
    /** 搜索的排序配置（search 用）*/
    sort?: string[];
    /** 修改前数据 （除 all、search外均可用）*/
    before?: any;
    /** 修改后数据 （除 all、search外均可用）*/
    after?: any;
    /** 多记录字段变化内容（edit 用）*/
    diffs?: any[][];
    /** 单记录字段变化内容（edit 用）*/
    diff?: any[];
    /** 单记录字段变化内容（set 用）*/
    changed?: { 
      /** 删除记录条数量*/
      toRemove: number; 
      /** 添加记录条数量*/
      toAdd: number; 
      /** 编辑记录条数量*/
      toEdit: number; 
    }
  }

  type _diff = {
    /** 字段名 */
    key: string;    
    /** 变化内容 */
    change: string;
    /** 变化信息日志 */
    content: string;
  }

  type _logMessage = {
    /** 操作类型 */
    op: '添加' | '批量添加' | '删除' | '（假）删除' | '查询' | '编辑' | '设置' | '无分类';
    /** 影响记录条数 （除查询、无分类外均可用） */
    affect?: number;
    /** 自动生成的操作日志 */
    content: string;
    /** 查询记录条数（仅查询用） */
    count?: number;
    /** 
     * 联表信息（仅查询用）
     * 值为关联表表名数组 
     */
    include?: string[];
    /** 
     * 排序信息（仅查询用） 
     * 值为经处理后的排序信息数组 
     */
    sort?: string[];
    /** 
     * 查询条件信息（仅查询用）
     * 值为经处理后的查询条件信息
     */
    condition?: string[];
    /**
     * 变化信息（仅编辑用） 
     * 修改多条记录时
     * 二维数组，外层为对应的一条条记录，内层则为相应记录的字段变化信息列表
     */
    diffs?: _diff[];
    /** 
     * 变化信息（仅编辑用） 
     * 修改单条记录时（ById）
     * 一维数组，值为相应记录的字段变化信息列表
     */
    diff?: _diff;
    /** 删除记录条数量（仅设置用）*/
    remove?: number;
    /** 增加记录条数量（仅设置用）*/
    add?: number;
    /** 编辑记录条数量（仅设置用）*/
    edit?: number;
  }

  /** 数据库操作日志类型 */
  type _OperatorLog = {
    /** 方法名 */
    func: string;
    /** 涉及的所有数据库操作信息 */
    logInfos: _logInfo[];
    /** 涉及的所有数据库操作信息日志 */
    logMessages: _logMessage[];
    /** 
     * 数据库操作信息
     * `${func}` 方法的操作信息
     * （值为 logInfos 最后一个元素）
     */
    logInfo: _logInfo;
    /** 
     * 数据库操作信息日志
     * `${func}` 方法的操作信息日志
     * （值为 logMessages 最后一个元素）
     */
    logMessage: _logMessage;
  }

  // redis cache 类型
  class _Cache {
    /**
     * 将字符串值 value 关联到 key 。
     * @param {string} key
     * @param {number} value
     */
    set(key: string, value: any, ...args: any[]);
    /**
     * 只在键 key 不存在的情况下， 将键 key 的值设置为 value 。
     * @param {string} key
     * @param {number} value
     */
    setnx(key: string, value: any, ...args: any[]);
    /**
     * 将键 key 的值设为 value ， 并返回键 key 在被设置之前的旧值。
     * @param {string} key
     * @param {number} value
     * @returns {any} 返回给定键 key 的旧值。
     */
    getset(key: string, value: any): any;
    /**
     * 返回与键 key 相关联的字符串值。
     * @param {string} key
     * @returns {any} 返回给定键 key 的旧值。
     */
    get(key: string): any;
    /**
     * 将哈希表 hash 中域 field 的值设置为 value 。
     * @param {string} hash
     * @param {string} field
     * @param {any} value
     */
    hset(hash: string, field: string, value: any);
    /**
     * 当且仅当域 field 尚未存在于哈希表的情况下， 将它的值设置为 value 。
     * @param {string} hash
     * @param {string} field
     * @param {any} value
     */
    hsetnx(hash: string, field: string, value: any);
    /**
     * 返回哈希表中给定域的值。
     * @param {string} hash
     * @param {string} field
     * @returns {any} 返回给定域的值。
     */
    hget(hash: string, field: string): any;
    /**
     * 返回哈希表 key 中域的数量。
     * @param {string} hash
     * @returns {number} 哈希表中域的数量。
     */
    hlen(hash: string): number;
    /**
     * 返回哈希表 key 中的所有域。
     * @param {string} hash
     * @return {string[]} 一个包含哈希表中所有域的列表。
     */
    hkeys(hash: string): string[];
    /**
     * 返回哈希表 key 中所有域的值。
     * @param {string} hash
     * @return {any[]} 一个包含哈希表中所有值的列表。
     */
    hvals(hash: string): any[];
    /**
     * 删除哈希表 key 中的一个或多个指定域，不存在的域将被忽略。
     * @param {string} hash
     * @param {string} field
     */
    hdel(hash: string, ...field: string[]);
    /**
     * 将一个或多个值 value 插入到列表 key 的表头
     * @param {string} key
     * @param {number} value
     */
    lpush(key: string, ...value: any[]);
    /**
     * 将一个或多个值 value 插入到列表 key 的表尾(最右边)。
     * @param {string} key
     * @param {number} value
     */
    rpush(key: string, ...value: any[]);
    /**
     * 移除并返回列表 key 的头元素。
     * @param {string} key
     * @returns {any} 被弹出的元素。
     */
    lpop(key: string): any;
    /**
     * 移除并返回列表 key 的尾元素。
     * @param {string} key
     * @returns {any} 被弹出的元素。
     */
    rpop(key: string): any;
    /**
     * 命令 RPOPLPUSH 在一个原子时间内，执行以下两个动作：
     * 将列表 source 中的最后一个元素(尾元素)弹出，并返回给客户端。
     * 将 source 弹出的元素插入到列表 destination ，作为 destination 列表的的头元素。
     * 举个例子，你有两个列表 source 和 destination ， source 列表有元素 a, b, c ， destination 列表有元素 x, y, z ，执行 RPOPLPUSH source destination 之后， 
     *     source 列表包含元素 a, b ， destination 列表包含元素 c, x, y, z ，并且元素 c 会被返回给客户端。
     * 如果 source 不存在，值 nil 被返回，并且不执行其他动作。
     * 如果 source 和 destination 相同，则列表中的表尾元素被移动到表头，并返回该元素，可以把这种特殊情况视作列表的旋转(rotation)操作。
     * 
     * @param {string} source
     * @param {string} destination 生存时间
     * @returns {any} 被弹出的元素。
     */
    rpoplpush(source: string, destination: string): any;
    /**
     * rpoplpush 阻塞版
     * 
     * @param {string} source
     * @param {string} destination 生存时间
     * @returns {any} 被弹出的元素。
     */
    brpoplpush(source: string, destination: string, timeout: number): any;
    /**
     * 将列表 key 下标为 index 的元素的值设置为 value 。
     * @param {string} key
     * @param {string} index 下标
     * @param {number} value
     */
    lset(key: string, index: number, value: any);
    /**
     * 返回列表 key 的长度。
     * @param {string} key
     * @returns {any} 列表 key 的长度。
     */
    llen(key: string): number;
    /**
     * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。
     * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。
     * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
     * @param {string} key
     * @param {number} start 左区间
     * @param {number} stop  右区间
     * @returns {any[]} 一个列表，包含指定区间内的元素。
     */
    lrange(key: string, start: number, stop: number): any[];
    /**
     * 根据参数 count 的值，移除列表中与参数 value 相等的元素。
     * count 的值可以是以下几种：
     *   count > 0 : 从表头开始向表尾搜索，移除与 value 相等的元素，数量为 count 。
     *   count < 0 : 从表尾开始向表头搜索，移除与 value 相等的元素，数量为 count 的绝对值。
     *   count = 0 : 移除表中所有与 value 相等的值。
     * @param {string} key
     * @param {number} count
     * @param {any} value
     */
    lrem(key: string, count: number, value: any);
    /**
     * 返回列表 key 中，下标为 index 的元素。
     * @param {string} key
     * @param {number} index
     * @returns {any} 列表中下标为 index 的元素。
     */
    lindex(key: string, index: number): any;
    /**
     * 为给定 key 设置生存时间，当 key 过期时(生存时间为 0 )，它会被自动删除。
     * @param {string} key
     * @param {number} seconds 生存时间
     */
    expire(key: string, seconds: number);
    /**
     * 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。
     * @param {string} key 
     * @returns {number} 当 key 不存在时，返回 -2 。 当 key 存在但没有设置剩余生存时间时，返回 -1 。 否则，以秒为单位，返回 key 的剩余生存时间。 
     */
    ttl(key: string): number;
    /**
     * 查找所有符合给定模式 pattern 的 key ， 比如说：
     * KEYS * 匹配数据库中所有 key 。
     * KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。
     * KEYS h*llo 匹配 hllo 和 heeeeello 等。
     * KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。
     * 特殊符号用 \ 隔开。
     * @param {string} pattern 模式 
     * @returns {string[]} 符合给定模式的 key 列表。
     */
    keys(pattern: string): string[];
    /**
     * 删除给定的一个或多个 key 。
     * 不存在的 key 会被忽略。
     * @param {string} key
     */
    del(...key: string[]);
    /** 
     * 检查给定 key 是否存在。
     * 若 key 存在，返回 1 ，否则返回 0 。
     * @param {string} key
     * @returns {string[]} 若 key 存在，返回 1 ，否则返回 0 。
     */
    exists(key: string): number;
    /**
     * 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。
     * @param {string} key
     */
    watch(...key: string[]);
    /**
     * 取消 WATCH 命令对所有 key 的监视。
     * 如果在执行 WATCH 命令之后， EXEC 命令或 DISCARD 命令先被执行了的话，那么就不需要再执行 UNWATCH 了。
     * 因为 EXEC 命令会执行事务，因此 WATCH 命令的效果已经产生了；而 DISCARD 命令在取消事务的同时也会取消所有对 key 的监视，因此这两个命令执行之后，就没有必要执行 UNWATCH 了。
     */
    unwatch();
    /**
     * 根据 patten 删除 key 。
     * 不存在的 key 会被忽略。
     * @param {string} pattern 模式 
     */
    mdel(pattern: string);

    /** 启用事务 */
    multi(): _CacheMulti;
  }

  // redis cache 事务类型
  class _CacheMulti {
    /** 将字符串值 value 关联到 key 。*/
    set(key: string, value: any, ...args: any[]): _CacheMulti;
    /** 只在键 key 不存在的情况下， 将键 key 的值设置为 value 。*/
    setnx(key: string, value: any, ...args: any[]): _CacheMulti;
    /** 将键 key 的值设为 value ， 并返回键 key 在被设置之前的旧值。*/
    getset(key: string, value: any): _CacheMulti;
    /** 返回与键 key 相关联的字符串值。*/
    get(key: string): _CacheMulti;
    /** 将哈希表 hash 中域 field 的值设置为 value 。*/
    hset(hash: string, field: string, value: any): _CacheMulti;
    /** 当且仅当域 field 尚未存在于哈希表的情况下， 将它的值设置为 value 。*/
    hsetnx(hash: string, field: string, value: any): _CacheMulti;
    /** 返回哈希表中给定域的值。*/
    hget(hash: string, field: string): _CacheMulti;
    /** 返回哈希表 key 中域的数量。*/
    hlen(hash: string): _CacheMulti;
    /** 返回哈希表 key 中的所有域。*/
    hkeys(hash: string): _CacheMulti;
    /** 返回哈希表 key 中所有域的值。*/
    hvals(hash: string): _CacheMulti;
    /** 删除哈希表 key 中的一个或多个指定域，不存在的域将被忽略。*/
    hdel(hash: string, ...field: string[]): _CacheMulti;
    /** 将一个或多个值 value 插入到列表 key 的表头*/
    lpush(key: string, ...value: any[]): _CacheMulti;
    /** 将一个或多个值 value 插入到列表 key 的表尾(最右边)。*/
    rpush(key: string, ...value: any[]): _CacheMulti;
    /** 移除并返回列表 key 的头元素。*/
    lpop(key: string): _CacheMulti;
    /** 移除并返回列表 key 的尾元素。*/
    rpop(key: string): _CacheMulti;
    /** 
     * 将列表 source 中的最后一个元素(尾元素)弹出，并返回给客户端。
     * 将 source 弹出的元素插入到列表 destination ，作为 destination 列表的的头元素。
     */
    rpoplpush(source: string, destination: string): _CacheMulti;
    /** rpoplpush 阻塞版*/
    brpoplpush(source: string, destination: string, timeout: number): _CacheMulti;
    /** 将列表 key 下标为 index 的元素的值设置为 value 。*/
    lset(key: string, index: number, value: any): _CacheMulti;
    /** 返回列表 key 的长度。*/
    llen(key: string): _CacheMulti;
    /**
     * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。
     * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。
     * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
     */
    lrange(key: string, start: number, stop: number): _CacheMulti;
    /**
     * 根据参数 count 的值，移除列表中与参数 value 相等的元素。
     * count 的值可以是以下几种：
     *   count > 0 : 从表头开始向表尾搜索，移除与 value 相等的元素，数量为 count 。
     *   count < 0 : 从表尾开始向表头搜索，移除与 value 相等的元素，数量为 count 的绝对值。
     *   count = 0 : 移除表中所有与 value 相等的值。
     */
    lrem(key: string, count: number, value: any): _CacheMulti;
    /** 返回列表 key 中，下标为 index 的元素。*/
    lindex(key: string, index: number): _CacheMulti;
    /** 为给定 key 设置生存时间，当 key 过期时(生存时间为 0 )，它会被自动删除。*/
    expire(key: string, seconds: number): _CacheMulti;
    /** 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。*/
    ttl(key: string): _CacheMulti;
    /**
     * 查找所有符合给定模式 pattern 的 key ， 比如说：
     * KEYS * 匹配数据库中所有 key 。
     * KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。
     * KEYS h*llo 匹配 hllo 和 heeeeello 等。
     * KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。
     * 特殊符号用 \ 隔开。
     */
    keys(pattern: string): _CacheMulti;
    /**
     * 删除给定的一个或多个 key 。
     * 不存在的 key 会被忽略。
     */
    del(...key: string[]): _CacheMulti;
    /** 检查给定 key 是否存在。*/
    exists(key: string): _CacheMulti;
    /** 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。*/
    watch(...key: string[]): _CacheMulti;
    /**
     * 取消 WATCH 命令对所有 key 的监视。
     * 如果在执行 WATCH 命令之后， EXEC 命令或 DISCARD 命令先被执行了的话，那么就不需要再执行 UNWATCH 了。
     * 因为 EXEC 命令会执行事务，因此 WATCH 命令的效果已经产生了；而 DISCARD 命令在取消事务的同时也会取消所有对 key 的监视，因此这两个命令执行之后，就没有必要执行 UNWATCH 了。
     */
    unwatch(): _CacheMulti;

    /**
     * 执行事务
     */
    exec(): any[];
  }

  class _ErrorTraceLogger {
    log(level: LoggerLevel, args: any[], meta: object): void;
    error(msg: any, ...args: any[]): void;
    warn(msg: any, ...args: any[]): void;
    info(msg: any, ...args: any[]): void;
    debug(msg: any, ...args: any[]): void;
    trace(msg: any, ...args: any[]): void;
    mark(msg: any, ...args: any[]): void;
    fatal(msg: any, ...args: any[]): void;

    set enable(enable: boolean): boolean
    /** 输出缓存的日志 */
    output(): void;
  }

  // ======================================================
  // 扩展 app
  interface Application {
    utils: typeof _UtilsIndex;
    errorTraceLogger: _ErrorTraceLogger;
    excel: typeof _Excel;
    JSZip: _JSZipExtra;
    cache: _Cache;
    session: _Cache;
  }
  // 扩展 context
  interface Context {
    operatorLogs: _OperatorLog[];
    
    apiResult?:{
      code: number;
      msg?: string;
      data?: any;
    }
    viewResult?: {
      view: string;
      data: any;
    }
  }

  interface IModel {
    [key: string]: {
      /**
       * 获取 model cache 对象
       * 基于 `./utils/sequelize-cache`，该对象下的常用数据库操作方法均会启用缓存存取
       * {
       *   get     : ['findAll', 'count', 'findAndCountAll', 'findByPk', 'findCreateFind', 'findOne', 'findOrBuild', 'findOrCreate', 'max', 'min', 'sum', 'aggregate'],
       *   save    : ['bulkCreate', 'create', 'decrement', 'destroy', 'drop', 'increment', 'update', 'upsert'],
       *   instance: ['decrement', 'destroy', 'increment', 'reload', 'restore', 'save', 'set', 'setDataValue', 'update'],
       * }
       */
      cache()
    }
  }

  // BaseService
  class BaseService extends _BaseService {

  } 

  // BaseController
  class BaseController extends _BaseController {
    constructor(ctx: Egg.Context);

    Service : BaseService
  }

  interface IMiddleware {
    accessLogger: ReturnType<typeof _AccessLogger>;
    gzip: ReturnType<typeof _Gzip>;
    responseWrapper: ReturnType<typeof _ResponseWrapper>;
  }

  interface EggAppConfig extends ConfigDefault { }

  interface EggPlugin {
    onerror?: EggPluginItem;
    session?: EggPluginItem;
    i18n?: EggPluginItem;
    watcher?: EggPluginItem;
    multipart?: EggPluginItem;
    security?: EggPluginItem;
    development?: EggPluginItem;
    logrotator?: EggPluginItem;
    schedule?: EggPluginItem;
    static?: EggPluginItem;
    jsonp?: EggPluginItem;
    view?: EggPluginItem;
    nunjucks?: EggPluginItem;
    routerPlus?: EggPluginItem;
    sequelize?: EggPluginItem;
    sessionRedis?: EggPluginItem;
    redis?: EggPluginItem;
    cors?: EggPluginItem;
    passport?: EggPluginItem;
    bcrypt?: EggPluginItem;
    valparams?: EggPluginItem;
  }
}

export * from 'egg';
export as namespace Egg;
