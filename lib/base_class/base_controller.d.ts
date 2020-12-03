import Egg from 'egg';
import './base_service';

declare module 'egg' {
  /** 
   * 构造方法 prefix 参数
   */
  type BaseControllerPrefix = {
    // * @param {number}   [preset.limitMaxPage]      - 限制参数，限制最大页码 （设置了这个，list 类方法的 offset 参数则不会生效）
    // * @param {number}   [preset.limitMaxSize]      - 限制参数，限制最大页面大小
    // * @param {Array|string} [preset.limitInclude]      - 限制参数，限制可联的表
    // * @param {Array|string} [preset.fieldMap]      - 字段映射表（设置相应值可以对外屏蔽真实数据库字段，而直接使用这个映射表的 key 作为参数传入）
    // * @param {Function} [preset.addLogCallback]    -  记录日志方法，无参数，联动 baseService 的操作日志功能，从 ctx.opetatorLogs 中取数据库日志信息。
    /* param 参数名（对应主键） */
    param ? : string = 'id';
    /* 默认 20 分页大小 */
    size ? : number = 20;
    /* 指定各个方法的参数 */
    rules ? : Object;
    /* list[All] show方法 默认返回的参数 默认全部 */
    attributes ? : string[];
    /* list[All] show方法 默认的子表返回的参数 默认全部 */
    includeAttributes ? : string[];
    /* list[All] show 方法 默认联表 默认为空 */
    include ? : string[];
    /* list[All]方法 默认排序方式 */
    sort ? : string[];
    /* 使用自定义的返回值处理方法（传入参数为 1 结果 2 状态码） */
    async response ? (result: any, status: number) : Promise < any > ;
    /* 限制参数，限制返回的参数可选值 */
    limitAttributes ? : string[];
    /* 限制参数，限制子表返回的参数可选值 { [ 子表名 ]: [ ...limitAttributes ] } */
    limitIncludeAttributes ? : {
      [key: string]: string[]
    };
    /* 限制参数，限制可搜索字段 */
    limitSearchFields ? : string | string[];
    /* 限制参数，限制最大页码 （设置了这个，list 类方法的 offset 参数则不会生效） */
    limitMaxPage ? : number;
    /* 限制参数，限制最大页面大小 */
    limitMaxSize ? : number;
    /* 限制参数，限制可联的表 */
    limitInclude ? : string | string[];
    /* 字段映射表（设置相应值可以对外屏蔽真实数据库字段，而直接使用这个映射表的 key 作为参数传入） */
    fieldMap ? : {
      [key: string]: string
    };
    /* 日志输出 */
    logging ? : boolean | Object = false;
    /* 记录日志方法，无参数，联动 baseService 的操作日志功能，从 ctx.opetatorLogs 中取数据库日志信息。 */
    async addLogCallback ? () : Promise < any > ;
  }

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
   * @extends {Egg.Controller}
   */
  class BaseController extends Egg.Controller {
    Service: BaseService;
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
     * @param {Array|string} [preset.fieldMap]      - 字段映射表（设置相应值可以对外屏蔽真实数据库字段，而直接使用这个映射表的 key 作为参数传入）
     * @param {Function} [preset.addLogCallback]    -  记录日志方法，无参数，联动 baseService 的操作日志功能，从 ctx.opetatorLogs 中取数据库日志信息。
     * @memberof BaseController
     */
    constructor(ctx: Egg.Context, service: Egg.BaseService, preset: BaseControllerPrefix);

    /**
     * [GET] ping
     *
     * @returns
     * @memberof BaseController
     */
    async ping(): Promise < null > ;

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
    async list(): Promise < null > ;

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
    async listAll(): Promise < null > ;

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
    async show(): Promise < null > ;

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
    async add(): Promise < null > ;

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
    async edit(): Promise < null > ;

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
    async editAll(): Promise < null > ;

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
    async remove(): Promise < null > ;

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
    async removeAll(): Promise < null > ;

    /**
     * 处理列表查询参数
     * 包括 搜索 筛选 及排序
     *
     * @returns {{sort: Egg.Sort,search: Egg.Search,filter: Egg.Filter}} { sort, search, filter }
     * @memberof BaseController
     */
    handleListOptions(): {
      sort: Egg.Sort,
      search: Egg.Search,
      filter: Egg.Filter
    };

    /**
     * 处理返回字段信息
     * 数据来源于 query.attrs|query.attributes
     * 如果没有传入上面参数，则默认取值 this.attributes
     * 受限于 limitAttributes
     *
     * @returns {string[]} attributes
     * @memberof BaseController
     */
    handleAttributes(): string[];

    /**
     * 处理分页信息
     * 数据来源于 query.page query.size query.offset
     * 如果没有传入上面参数，则默认取值 page 取 1，size 取 this.size，offset 取 0
     * 受限于 limitMaxPage limitMaxSize
     *
     * @returns {Egg.QueryObject} { page, size, offset }
     * @memberof BaseController
     */
    handlePagination(): Egg.QueryObject;

    /**
     * 处理联表信息
     * 数据来源于 query.include query.includeAttrs|query.includeAttributes
     * 如果没有传入上面参数，则默认取值 this.include 及 this.includeAttributes
     * 受限于 limitInclude limit
     *
     * @returns {Egg.Include} includeList
     * @memberof BaseController
     */
    handleInclude(): Egg.Include;

    /**
     * 处理 query 参数，应用字段映射表转换相应字段数据
     * - 使用 fieldMap 进行转换
     */
    handleQueryFields(): null;

    /**
     * 数据库中唯一字段检测（add、edit、editAll 用）
     *
     * @param {string} type - add、edit、editAll
     */
    async handleUniqueCheck(type): Promise < null > ;

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
    static async ResponseJSON(promise: any, successCode = 0): Promise < null > ;

    /**
     * convert instance to plain object
     *
     * @static
     * @param {Array<Object>|Object} data -
     * @param {boolean} [plain] -
     * @returns
     * @memberof BaseService
     */
    static toJSON(data:Array<Object>|Object, plain:boolean): any;
  }
}