import Egg from 'egg';
import { BaseService } from 'egg-valparams';
import Excel from 'exceljs';
import './base_service';

declare module 'egg' {
  /** 
   * 构造方法 prefix 参数
   */
  type BaseControllerPrefix = {
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
    /* 导出表格风格配置 */
    export ? : exportType;
    /* 限制参数，限制返回的参数可选值 */
    limitAttributes ? : string[];
    /* 限制参数，限制子表返回的参数可选值 { [ 子表名 ]: [ ...limitAttributes ] } */
    limitIncludeAttributes ? : {
      [key: string]: string[];
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

  /* 导出表格风格配置 */
  type exportType = {
    colsStyle: Excel.Column[];
    headRowsStyle: (Excel.Style | Excel.Style[])[];
    rowsStyle: (Excel.Style | Excel.Style[])[];
    cellStyleMap: { [key: string]: Excel.Style };
  }

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
    // instance prototype
    Service: Egg.BaseService;
    model: Egg.EggModelType|Sequelize.ModelType;
    enums: { [key:string]: { [ev:string]: string } };
    logging: Egg.EggLogger;
    param: string;
    size: number;
    rules: Object;
    attributes: string[];
    includeAttributes: string[];
    include: string[];
    sort: string[];
    fieldMap: { [key:string]: string };
    export: exportType;
    limit: {
      attributes: string[];
      includeAttributes: {
        [key: string]: string[];
      };
      searchFields: string[];
      include: string[];
      maxPage: number;
      maxSize: number;
    }; 
    async response: (result: any, status: number) => Promise < any > ;
    async addLogCallback: () => Promise < any > ;
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
     * @param {exportType} [preset.export]      - 导出表格风格配置
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
     * @param {Object} body 请求参数
     *
     * @param {Object} resp 返回值说明
     *
     * @returns
     * @memberof BaseController
     */
    async addMulti(): Promise < null > ;

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
    async editMulti(): Promise < null > ;

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
    async removeMulti(): Promise < null > ;

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
     * 将属性值`翻译成`中文(comment)
     *
     * @param {Array|string} attr 属性[数组]
     * @returns {Array|string}
     */
    handleGetAttributeComment(attr: Array|string): Array|string

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
    handleGetRowsAttributeValue(rows: Array<Object>): Array<any>

    /**
     * 数据库中唯一字段检测（add、edit、addMulti、editMulti 用）
     *
     * @param {string} type - add、edit、addMulti、editMulti
     * @param {Array<Object>} records - 添加记录列表 - addMulti 模式使用
     */
    async handleUniqueCheck(type: string, records?: Array<Object>): Promise < null > ;

    /**
     * 处理列表导出功能(单页)
     *
     * @param {string} tmpPath - 表格临时存储目录
     * @param {string} exportName - 导出文件名
     * @param {Array}  head - 表头数据
     * @param {Array}  rows - 列表数据
     * @param {exportType} [sheetStyle] - 表格配置 详细配置内容参考 utils/excel.js
     * @param {Excel.Column[]} [sheetStyle.colsStyle]     - 对应列的样式 (主要是设置列宽等通用属性)
     * @param {(Excel.Style | Excel.Style[])[]} [sheetStyle.headRowsStyle] - 头部行的样式（可以设置多行, 用于设置表头的样式）
     *                             如 [[CellStyle],rowStyle,[CellStyle]], 这样就设置了前三行的样式了
     *                             如果项是 CellStyle(数组)则设置每一个单元格的样式, 如果是 rowStyle(对象) 则设置整一行的样式
     * @param {(Excel.Style | Excel.Style[])[]} [sheetStyle.rowsStyle]     - 基本行的样式（用于设置表格内容每一行的样式, 可不设置使用默认样式）
     *                             从 headRowsStyle.length+1 行开始设置后面所有行的样式 ,
     *                             如果是数组则设置每一个单元格的样式, 如果是对象则设置整一行的样式
     * @param {{ [key: string]: Excel.Style }} [sheetStyle.cellStyleMap]  - 单元格样式，针对特定单元格指定样式
     *                             格式如 { 'A3': CellStyle }
     *                             键为单元格坐标，值为单元格样式
     */
    async handleExportExcel(tmpPath: string, exportName: string, head: any[], rows: any[], sheetStyle: exportType): Promise < null > ;

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