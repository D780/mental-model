# 基类使用说明
> `BaseService`、`BaseController`

基类的目的旨在提供一些常用的封装，减少多余的重复代码以及功能的重新设计

原则上基类方法可用，但并不是必须，可自由选择，同名方法也可以根据实际情况覆盖

## `BaseService`
> 提供基于 `Sequelize` 的业务方法封装
>> 
>> `list[AndCount][All]`、`count[All]`  
>> `info[ById]`  
>> `add[Multi]`、`edit[ById]`、`remove[ById]`、`set`  
>> `moreById`、`refreshById`、`indexById` `nth`、`first`、`last`  
>> `increase[ById]`、`decrease[ById]`、`editSelf[ById]`  
>> `move[ById]`、`moveUp[ById]`、`moveDown[ById]`、`change[ById]`  

所有方法最后一个参数都是 `options`, 支持 `transaction` 和 `lock` 的传入

---
##### 常用参数说明

###### args
> 不少方法（非 `XXXById` 方法）都含有一个 `args` 参数，如下
> ```ts
> type args = { 
>   params?: {
>     [key: string]: any;
>   } & Sequelize.WhereOptions;
>   query?: {
>     [key: string]: any;
>   } & Sequelize.WhereOptions;
>   body?: {
>     [key: string]: any;
>   };
> };
> ```
> 可见，该对象是由 `params` `query` `body` 三个对象组成的  
> 没错，这三个对象真是对应于 `http` 请求中的三种参数，该基类的设计初衷就是为了更好的切合> 传来的参数。（不过后来做的越来越多功能，导致这个分类其实意义不太打了）
> > - `params` 作为查询的一个前提条件存在
> > - `query`  传入搜索分页参数 `page` `size` `offset`
> > - `body`   创建编辑等操作传入记录数据
> 
> 原本计划其实 `query` 在搜索上发挥跟重要的作用的，比如搜索关键字，筛选等，但是由于数据录入问题，以及参数处理问题，只保留搜索分页参数 `page` `size` `offset`，其他功能有可选参数 `options` 中的 `search`、`filter` 代替。

--

###### 字段说明
对于 `params`、`search`、`filter` 中出现的字段格式有如下几种表述方式  

- 当前主表中字段，如 `imLongId`、`name` 等直接书写字段名称即可  
- 子表中的字段，如 `$Role.name$`、`$Role.UserRole.createTime$` 等，前后均带有 `$` 符号，根据关联关系将表用 `.` 连接起来  
- 如果使用了 `JSON` 格式数据则如 `detail->'$.device.id'`、`$Role.detail->"$**.id"$` 等方式书写 `JSON` 中指定结构的键  

如此我们便可简单的表达我们需要获取的字段了。

###### `search`
> 顾名思义，搜索的意思，查询类接口搜索字段均使用这个来完成。  
> 如 `search = [{ key: '搜索关键词', fields: ['搜索字段A', '搜索字段B'] }]`  
>> 上述语句则表明我要对字段对 `fields` 的两个字段搜索 `key` 的内容，从上述格式也可以看出，我们也可以传入多个搜索条件。  
>
> 除了如上的基本使用外，还支持一些特别的功能，比如我们是`联表搜索`，搜索字段是子表的字段。除了`模糊搜索`外，我们还支持了`区间搜索`，举个例子：我们很经常会搜索列表中的数据的时间，比如在 1号 到 次月 1号 创建的记录，此时我们可以针对 `创建时间` 字段进行 `区间搜索`  
>
>> - `模糊搜索`  
>>    > `模糊搜索`分有 `4` 种，`精确搜索(none)`、`左模糊(left)`、`右模糊(right)`、`全模糊(full)`，默认为 `全模糊(full)`   
>>    > 通过 `mode` 指定
>>   
>> - `区间搜索`  
>>    > 上述也有说明，就是一个区域的搜索匹配，所以此时 `key` 的值应为一个数组 如 `[leftKey, rightKey]`, 两个元素均可省去，如 `[leftKey]` `[,rigthKey]`，但应至少保留一个，应为全省去了其实就毫无意义了  
>>    > 同 `模糊搜索` 分有 `4` 种 `mode`，`开区间(none)`、`左闭右开区间(left)`、`左开右闭区间(right)`、`闭区间(full)`  
>>    > 同样也通过 `mode` 指定   
>>
>> - `搜索字段`  
>>    > `fields`  元素值可以为上述的字符串外也可以为对象 `{[prefix,]field,type,mode}`，还可以为数组 `[string | {[prefix,]field,type,mode}]`
>>    >
>>    > - 为字符串时  
>>    >   > 值就是一个字段，同时默认使用 `模糊搜索` 的 `全模糊` 模式去进行搜索
>>    >
>>    > - 为对象时  
>>    >   > `{[prefix,]field,type,mode}`  
>>    >   > 此时 `$prefix.field$` 就是原来字符串值中的字段信息，此处把其分开来了     
>>    >   > 通过 `type` 指定使用 `模糊搜索(fuzzy)` 还是 `区间搜索(range)`，默认为 `模糊搜索(fuzzy)`   
>>    >   > 通过 `mode` 指定使用搜索模糊，即上述的 `none`、`left`、`right`、`full`，默认为 `full`   
>>    >
>>    > - 为数组时   
>>    >   > `[string | {[prefix,]field,type,mode}]`  
>>    >   > 可以看到起元素值格式其实同上面同级的 `字符串值` 及 `对象值`  
>>    >   > 其实这里是为了另一种搜索需求，一般而言，我们一个关键词搜索一堆字段，这些字段间的关系是 `或(OR)`  
>>    >   > 但是也有这么一种情况，这个关键词搜索在其中的一些字段中是必须要都存在的  
>>    >   > 简单举个例子，比如搜索用户姓名和昵称中均含有 `test` 或者个人简介中含有 `test` 的用户记录    
>>    >   > 此时的搜索定义可能为为 `[{ key: 'test', fields: [['name', 'nickName'], 'individualResume'] }]`    
>>    >   >> 可以看到 `fields` 第一层的数组元素间关系为 `或(OR)`，第二层数组元素间关系为 `与(AND)`   

###### `filter`
> 专门用于作为字段筛选用的一个参数，当然主要就是用作筛选了  
> 其实 `params` 也能满足这个筛选的需求，可以看到他们的格式基本一致的。但为什么又特意做这么个字段呢？  
> 这个就说回到上面 `args` 参数的位置，`params` 参数设计上本意是用于接收路由中的 `params` 参数，而不是为了复杂的筛选而做的，当然逻辑上是支持  
> 作为工具，这些均做有兼容额逻辑，并不会要求一定要怎么去使用，仅仅作为建议，主要还是看如何使用起来顺手，两者功能上并无二致，仅作为对参数的分类  


## `BaseController`
> 提供一系列通用的接口方法，包含 增、删、查、改  
> 因为需要通用的关系，上述也仅仅会提供基础的通用接口方法，而具体的业务接口还是得自行去做，并且还是因为通用问题，尤其是列表类接口，很多时候需要根据实际页面情况去做一定的调整
> 目前更多的意义是作为相应接口的参考。  
> 同时内部提供一些对接口参数的处理方法，如搜索字段等，能直接调用将其处理成符合 `BaseService` 相应参数格式的数据。  
> 由于功能的局限性，以及当前功能也尚未完善。不推荐过度依赖使用（应该也无法过度依赖。。）  
> 今后预计会主要是作为提供一些通用逻辑，然后通过配置生成代码的方式去使用   
