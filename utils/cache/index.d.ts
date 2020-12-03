
import IORedis from 'ioredis';

export = Cache;

// redis cache 类型
class Cache extends IORedis {
  new(client: IORedis.Redis): Cache;
  // Key =====
  /**
   * #### DEL
   * DEL key [key ...]
   * 
   * 删除给定的一个或多个 key 。  
   * 不存在的 key 会被忽略。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<number>} 被删除 key 的数量。
   */
  async del(...key: Array<string>): Promise<number>;
  /**
   * #### DUMP
   * DUMP key
   * 
   * 序列化给定 key ，并返回被序列化的值，使用 RESTORE 命令可以将这个值反序列化为 Redis 键。  
   * 序列化的值不包括任何生存时间信息。 
   * 
   * @param {string} key
   * @returns {Promise<null|any>} 如果 key 不存在，那么返回 nil 。
   *                    否则，返回序列化之后的值。
   */
  async dump(key: string): Promise<null|any>;
  /**
   * #### EXISTS
   * EXISTS key
   * 
   * 检查给定 key 是否存在。  
   * 
   * @param {string} key
   * @returns {Promise<number>} 若 key 存在，返回 1 ，否则返回 0 。
   */
  async exists(key: string): Promise<number>;
  /**
   * #### EXPIRE
   * EXPIRE key seconds
   * 
   * 为给定 key 设置生存时间，当 key 过期时(生存时间为 0 )，它会被自动删除。    
   * 
   * @param {string} key
   * @param {number} seconds
   * @returns {Promise<number>} 设置成功返回 1 ，否则返回 0 。
   */
  async expire(key: string, seconds: number): Promise<number>;
  /**
   * #### EXPIREAT
   * EXPIREAT key timestamp
   * 
   * EXPIREAT 的作用和 EXPIRE 类似，都用于为 key 设置生存时间。  
   * 不同在于 EXPIREAT 命令接受的时间参数是 UNIX 时间戳(unix timestamp)。  
   * 
   * @param {string} key
   * @param {number} timestamp
   * @returns {Promise<number>} 设置成功返回 1 ，否则返回 0 。
   */
  async expireat(key: string, timestamp: number): Promise<number>;
  /**
   * #### KEYS
   * KEYS pattern
   * 
   * 查找所有符合给定模式 pattern 的 key ， 比如说：  
   * KEYS * 匹配数据库中所有 key 。  
   * KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。  
   * KEYS h*llo 匹配 hllo 和 heeeeello 等。  
   * KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。  
   * 特殊符号用 \ 隔开。  
   * 
   * @param {string} pattern 模式 
   * @returns {Promise<Array<string>>} 符合给定模式的 key 列表。
   */
  async keys(pattern: string): Promise<Array<string>>;
  /**
   * #### MIGRATE
   * MIGRATE host port key destination-db timeout [COPY] [REPLACE]
   * 
   * 将 key 原子性地从当前实例传送到目标实例的指定数据库上，一旦传送成功， key 保证会出现在目标实例上，而当前实例上的 key 会被删除。
   * 
   * @param {string} host 
   * @param {string} port 
   * @param {string} key 
   * @param {string} db 
   * @param {string} timeout 
   * @param {Array<any>} [args]
   * @returns {Promise<string>} 迁移成功时返回 OK ，否则返回相应的错误。
   */
  async migrate(host: string, port: string, key: string, db: string, timeout: string, [...args]: Array<any>): Promise<string>;
  /**
   * #### MOVE
   * MOVE key db
   * 
   * 将当前数据库的 key 移动到给定的数据库 db 当中。
   * 如果当前数据库(源数据库)和给定数据库(目标数据库)有相同名字的给定 key ，或者 key 不存在于当前数据库，那么 MOVE 没有任何效果。
   * 因此，也可以利用这一特性，将 MOVE 当作锁(locking)原语(primitive)。
   * 
   * @param {string} key 
   * @param {string} db 
   * @returns {Promise<number>} 移动成功返回 1 ，失败则返回 0 。
   */
  async move(key: string, db: string): Promise<number>;
  /**
   * #### OBJECT
   * OBJECT subcommand [arguments [arguments]]
   * 
   * OBJECT 命令允许从内部察看给定 key 的 Redis 对象。  
   * OBJECT 命令有多个子命令：  
   * - OBJECT REFCOUNT <key> 返回给定 key 引用所储存的值的次数。此命令主要用于除错。
   * - OBJECT ENCODING <key> 返回给定 key 锁储存的值所使用的内部表示(representation)。
   * - OBJECT IDLETIME <key> 返回给定 key 自储存以来的空转时间(idle， 没有被读取也没有被写入)，以秒为单位。
   * 
   * @param {'REFCOUNT'|'IDLETIME'|'ENCODING'} subcommand
   * @param {Array<any>} [args]
   * @returns {Promise<any>} REFCOUNT 和 IDLETIME 返回数字。  
   *                ENCODING 返回相应的编码类型。  
   */
  async object(subcommand: 'REFCOUNT'|'IDLETIME'|'ENCODING', [...args]: Array<any>): Promise<any>;
  /**
   * #### PERSIST
   * PERSIST key
   * 
   * 移除给定 key 的生存时间，将这个 key 从『易失的』(带生存时间 key )转换成『持久的』(一个不带生存时间、永不过期的 key )。
   * 
   * @param {string} key 
   * @returns {Promise<number>} 设置成功返回 1 ，否则返回 0 。
   */
  async persist(key: string): Promise<number>;
  /**
   * #### PEXPIRE
   * PEXPIRE key milliseconds
   * 
   * 这个命令和 EXPIRE 命令的作用类似，但是它以毫秒为单位设置 key 的生存时间，而不像 EXPIRE 命令那样，以秒为单位。 
   * 
   * @param {string} key
   * @param {number} seconds
   * @returns {Promise<number>} 设置成功返回 1 ，否则返回 0 。
   */
  async pexpire(key: string, seconds: number): Promise<number>;
  /**
   * #### PEXPIREAT
   * PEXPIREAT key milliseconds-timestamp
   * 
   * 这个命令和 EXPIREAT 命令类似，但它以毫秒为单位设置 key 的过期 unix 时间戳，而不是像 EXPIREAT 那样，以秒为单位。
   * 
   * @param {string} key
   * @param {number} mtimestamp
   * @returns {Promise<number>} 设置成功返回 1 ，否则返回 0 。
   */
  async pexpireat(key: string, mtimestamp: number): Promise<number>;
  /**
   * #### PTTL
   * PTTL key 
   * 
   * 这个命令类似于 TTL 命令，但它以毫秒为单位返回 key 的剩余生存时间，而不是像 TTL 命令那样，以秒为单位。
   *  
   * @param {string} key
   * @returns {Promise<number>} 当 key 不存在时，返回 -2 。
   *   当 key 存在但没有设置剩余生存时间时，返回 -1 。
   *   否则，以毫秒为单位，返回 key 的剩余生存时间。
   */
  async pttl(key: string): Promise<number>;
  /**
   * #### RANDOMKEY
   * RANDOMKEY
   * 
   * 从当前数据库中随机返回(不删除)一个 key 。 
   *  
   * @returns {Promise<string>} 当数据库不为空时，返回一个 key 。
   *   当数据库为空时，返回 nil 。
   */
  async randomkey(): Promise<string>;
  /**
   * #### RENAME
   * RENAME key newkey
   * 
   * 将 key 改名为 newkey 。
   * 当 key 和 newkey 相同，或者 key 不存在时，返回一个错误。  
   * 当 newkey 已经存在时， RENAME 命令将覆盖旧值。  
   * 
   * @param {string} key
   * @param {string} newkey
   * @returns {Promise<string>} 改名成功时提示 OK ，失败时候返回一个错误。
   */
  async rename(key: string, newkey: string): Promise<string>;
  /**
   * #### RENAMENX
   * RENAMENX key newkey
   * 
   * 当且仅当 newkey 不存在时，将 key 改名为 newkey 。  
   * 当 key 不存在时，返回一个错误。  
   * 
   * @param {string} key
   * @param {string} newkey
   * @returns {Promise<number>} 修改成功时，返回 1 。如果 newkey 已经存在，返回 0 。
   */
  async renamenx(key: string, newkey: string): Promise<string>;
  /**
   * #### SORT
   * SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern ...]] [ASC | DESC] [ALPHA] [STORE destination]
   * 
   * 返回或保存给定列表、集合、有序集合 key 中经过排序的元素。  
   * 排序默认以数字作为对象，值被解释为双精度浮点数，然后进行比较。  
   * 最简单的 SORT 使用方法是 SORT key 和 SORT key DESC ：  
   * 
   * 
   * @param {string} key
   * @param {Array<any>} [args]
   * @returns {Promise<Array<any>|null>} 排序结果
   */
  async sort(key: string, [...args]: Array<any>): Promise<Array<any>|null>;  
  /**
   * #### TTL
   * TTL key 
   * 
   * 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。  
   *  
   * @param {string} key
   * @returns {Promise<number>} 当 key 不存在时，返回 -2 。
   *   当 key 存在但没有设置剩余生存时间时，返回 -1 。
   *   否则，以秒为单位，返回 key 的剩余生存时间。
   */
  async ttl(key: string): Promise<number>;
  /**
   * #### TYPE
   * TYPE key 
   * 
   * 返回 key 所储存的值的类型。   
   *  
   * @param {string} key
   * @returns {Promise<string>} none (key不存在)  
   *                   string (字符串)  
   *                   list (列表)  
   *                   set (集合)  
   *                   zset (有序集)  
   *                   hash (哈希表)  
   */
  async type(key: string): Promise<string>;
  /**
   * #### SCAN
   * SCAN cursor [MATCH pattern] [COUNT count]
   * 
   * SCAN 命令及其相关的 SSCAN 命令、 HSCAN 命令和 ZSCAN 命令都用于增量地迭代（incrementally iterate）一集元素（a collection of elements）：
   * 
   * - SCAN 命令用于迭代当前数据库中的数据库键。 
   * - SSCAN 命令用于迭代集合键中的元素。
   * - HSCAN 命令用于迭代哈希键中的键值对。
   * - ZSCAN 命令用于迭代有序集合中的元素（包括元素成员和元素分值）。
   * 
   * - SSCAN 命令、 HSCAN 命令和 ZSCAN 命令的第一个参数总是一个数据库键。 
   * - 而 SCAN 命令则不需要在第一个参数提供任何数据库键 —— 因为它迭代的是当前数据库中的所有数据库键。
   *  
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {Promise<any>}
   */
  async scan(cursor: string, [...args]: Array<any>): Promise<any>;

  // String =====

  /**
   * #### APPEND   
   * APPEND key value
   * 
   * 如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。  
   * 如果 key 不存在， APPEND 就简单地将给定 key 设为 value ，就像执行 SET key value 一样。  
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {Promise<number>} 追加 value 之后， key 中字符串的长度。
   */
  async append(key: string, value: any): Promise<number>;
  /**
   * #### BITCOUNT   
   * BITCOUNT key [start] [end]
   * 
   * 计算给定字符串中，被设置为 1 的比特位的数量。  
   * 一般情况下，给定的整个字符串都会被进行计数，通过指定额外的 start 或 end 参数，可以让计数只在特定的位上进行。  
   * start 和 end 参数的设置和 GETRANGE 命令类似，都可以使用负数值：比如 -1 表示最后一个位，而 -2 表示倒数第二个位，以此类推。  
   * 不存在的 key 被当成是空字符串来处理，因此对一个不存在的 key 进行 BITCOUNT 操作，结果为 0 。  
   *  
   * @param {string} key
   * @param {number} [start]
   * @param {number} [end]
   * @returns {Promise<number>} 被设置为 1 的位的数量。
   */
  async bitcount(key: string, [start]: string, [end]: string): Promise<number>;
  /**
   * #### BITOP   
   * BITOP operation destkey key [key ...]
   * 
   * 对一个或多个保存二进制位的字符串 key 进行位元操作，并将结果保存到 destkey 上。  
   * operation 可以是 AND 、 OR 、 NOT 、 XOR 这四种操作中的任意一种：  
   * - BITOP AND destkey key [key ...] ，对一个或多个 key 求逻辑并，并将结果保存到 destkey 。
   * - BITOP OR destkey key [key ...] ，对一个或多个 key 求逻辑或，并将结果保存到 destkey 。
   * - BITOP XOR destkey key [key ...] ，对一个或多个 key 求逻辑异或，并将结果保存到 destkey 。
   * - BITOP NOT destkey key ，对给定 key 求逻辑非，并将结果保存到 destkey 。
   * 
   * 除了 NOT 操作之外，其他操作都可以接受一个或多个 key 作为输入。    
   *  
   * @param {string} operation
   * @param {string} destkey 
   * @param {Array<string>} key 
   * @returns {Promise<number>} 保存到 destkey 的字符串的长度，和输入 key 中最长的字符串长度相等。
   */
  async bitop(operation: string, destkey: string, ...key: Array<string>): Promise<number>;
  /**
   * #### DECR   
   * DECR key
   * 
   * 将 key 中储存的数字值减一。   
   * 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 DECR 操作。   
   * 如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。  
   *  
   * @param {string} key
   * @returns {Promise<number>} 执行 DECR 命令之后 key 的值。
   */
  async decr(key: string): Promise<number>;
  /**
   * #### DECRBY   
   * DECRBY key decrement
   * 
   * 将 key 所储存的值减去减量 decrement 。  
   *  
   * @param {string} key
   * @param {number} decrement
   * @returns {Promise<number>} 减去 decrement 之后， key 的值。
   */
  async decrby(key: string, decrement: number): Promise<number>;
  /**
   * #### GET   
   * GET key
   * 
   * 返回 key 所关联的字符串值。  
   * 如果 key 不存在那么返回特殊值 nil 。  
   * 假如 key 储存的值不是字符串类型，返回一个错误，因为 GET 只能用于处理字符串值。   
   * 
   * @param {string} key
   * @returns {Promise<any>} 当 key 不存在时，返回 nil ，否则，返回 key 的值。  
   *                如果 key 不是字符串类型，那么返回一个错误。  
   */
  async get(key: string): Promise<any>;
  /**
   * #### GETBIT   
   * GETBIT key offset
   * 
   * 对 key 所储存的字符串值，获取指定偏移量上的位(bit)。  
   * 当 offset 比字符串值的长度大，或者 key 不存在时，返回 0 。    
   * 
   * @param {string} key
   * @param {number} offset
   * @returns {Promise<number>} 字符串值指定偏移量上的位(bit)。  
   */
  async getbit(key: string, offset: number): Promise<number>;
  /**
   * #### GETRANGE   
   * GETRANGE key start end
   * 
   * 返回 key 中字符串值的子字符串，字符串的截取范围由 start 和 end 两个偏移量决定(包括 start 和 end 在内)。  
   * 负数偏移量表示从字符串最后开始计数， -1 表示最后一个字符， -2 表示倒数第二个，以此类推。      
   * GETRANGE 通过保证子字符串的值域(range)不超过实际字符串的值域来处理超出范围的值域请求。 
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} end
   * @returns {Promise<string>} 截取得出的子字符串。  
   */
  async getrange(key: string, start: number, end: number): Promise<string>;
  /**
   * #### GETSET   
   * GETSET key value
   * 
   * 将给定 key 的值设为 value ，并返回 key 的旧值(old value)。  
   * 当 key 存在但不是字符串类型时，返回一个错误。  
   * 
   * @param {string} key
   * @param {any}    value
   * @returns {Promise<any>} 返回给定键 key 的旧值。 当 key 没有旧值时，也即是， key 不存在时，返回 nil 。
   */
  async getset(key: string, value: any): Promise<any>;
  /**
   * #### INCR   
   * INCR key
   * 
   * 将 key 中储存的数字值增一。  
   * 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCR 操作。  
   * 如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。  
   *  
   * @param {string} key
   * @returns {Promise<number>} 执行 INCR 命令之后 key 的值。
   */
  async incr(key: string): Promise<number>;
  /**
   * #### INCRBY   
   * INCRBY key increment
   * 
   * 将 key 所储存的值加上增量 increment 。  
   *  
   * @param {string} key
   * @param {number} increment
   * @returns {Promise<number>} 加上 increment 之后， key 的值。
   */
  async incrby(key: string, increment: number): Promise<number>;
  /**
   * #### INCRBYFLOAT   
   * INCRBYFLOAT key increment
   * 
   * 将 key 所储存的值加上增量 increment 。  
   *  
   * @param {string} key
   * @param {number} increment
   * @returns {Promise<number>} 加上 increment 之后， key 的值。
   */
  async incrbyfloat(key: string, increment: number): Promise<number>;
  /**
   * #### MGET   
   * MGET key [key ...]
   * 
   * 返回所有(一个或多个)给定 key 的值。
   * 如果给定的 key 里面，有某个 key 不存在，那么这个 key 返回特殊值 nil 。因此，该命令永不失败。   
   * 
   * @param {string} key
   * @returns {Promise<Array<any>>} 一个包含所有给定 key 的值的列表。
   */
  async mget(...key: string): Promise<Array<any>>;
  /**
   * #### MSET   
   * MSET key value [key value ...]
   * 
   * 同时设置一个或多个 key-value 对。  
   * 如果某个给定 key 已经存在，那么 MSET 会用新值覆盖原来的旧值，如果这不是你所希望的效果，请考虑使用 MSETNX 命令：它只会在所有给定 key 都不存在的情况下进行设置操作。   
   * MSET 是一个原子性(atomic)操作，所有给定 key 都会在同一时间内被设置，某些给定 key 被更新而另一些给定 key 没有改变的情况，不可能发生。  
   * 
   * @param {string|Object} key 为 Object 时，仅接受该参数。键为 key，值为 value
   * @param {any}    value
   * @param {Array<any>} key_value 成对出现的键值对列表 [key value ...]
   * @returns {Promise<string>} 总是返回 OK (因为 MSET 不可能失败)
   */
  async mset(key: string|Object, value: string, [...key_value]: Array<any>): Promise<string>;
  /**
   * #### MSETNX   
   * MSETNX key value [key value ...]
   * 
   * 同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在。  
   * 即使只有一个给定 key 已存在， MSETNX 也会拒绝执行所有给定 key 的设置操作。     
   * MSETNX 是原子性的，因此它可以用作设置多个不同 key 表示不同字段(field)的唯一性逻辑对象(unique logic object)，所有字段要么全被设置，要么全不被设置    
   * 
   * @param {string|Object} key 为 Object 时，仅接受该参数。键为 key，值为 value
   * @param {any}    value
   * @param {Array<any>} key_value 成对出现的键值对列表 [key value ...]
   * @returns {Promise<number>} 当所有 key 都成功设置，返回 1 。如果所有给定 key 都设置失败(至少有一个 key 已经存在)，那么返回 0 。
   */
  async msetnx(key: string|Object, value: string, [...key_value]: Array<any>): Promise<number>;
  /**
   * #### PSETEX   
   * PSETEX key milliseconds value
   * 
   * 这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位。  
   * 
   * @param {string} key
   * @param {number} milliseconds
   * @param {any}    value
   * @returns {Promise<string>} 设置成功时返回 OK 。
   */
  async psetex(key: string, milliseconds : number, value: any): Promise<string>;
  /**
   * #### SET   
   * SET key value [EX seconds] [PX milliseconds] [NX|XX]
   * 
   * 将字符串值 value 关联到 key 。  
   * 如果 key 已经持有其他值， SET 就覆写旧值，无视类型。  
   * 对于某个原本带有生存时间（TTL）的键来说， 当 SET 命令成功在这个键上执行时， 这个键原有的 TTL 将被清除。
   * 
   * @param {string} key
   * @param {any}    value
   * @param {Array<any>} [args]
   * @returns {Promise<string>} 设置成功时返回 OK 。
   */
  async set(key: string, value: any, [...args]: Array<any>): Promise<string>;  
  /**
   * #### SETBIT   
   * SETBIT key offset value
   * 
   * 对 key 所储存的字符串值，设置或清除指定偏移量上的位(bit)。  
   * 位的设置或清除取决于 value 参数，可以是 0 也可以是 1 。    
   * 当 key 不存在时，自动生成一个新的字符串值。  
   * 字符串会进行伸展(grown)以确保它可以将 value 保存在指定的偏移量上。当字符串值进行伸展时，空白位置以 0 填充。  
   * offset 参数必须大于或等于 0 ，小于 2^32 (bit 映射被限制在 512 MB 之内)。
   * 
   * @param {string} key
   * @param {number} offset
   * @param {number} value
   * @returns {Promise<number>} 指定偏移量原来储存的位。 
   */
  async setbit(key: string, offset: number, value: number): Promise<number>;
  /**
   * #### SETEX   
   * SETEX key seconds value
   * 
   * 将值 value 关联到 key ，并将 key 的生存时间设为 seconds (以秒为单位)。  
   * 如果 key 已经持有其他值， SET 就覆写旧值.    
   * 
   * @param {string} key
   * @param {number} seconds
   * @param {any}    value
   * @returns {Promise<string>} 设置成功时返回 OK 。当 seconds 参数不合法时，返回一个错误。
   */
  async setex(key: string, seconds: number, value: any): Promise<string>;
  /**
   * #### SETNX   
   * SETNX key value
   * 
   * 将 key 的值设为 value ，当且仅当 key 不存在。  
   * 若给定的 key 已经存在，则 SETNX 不做任何动作。  
   * SETNX 是『SET if Not eXists』(如果不存在，则 SET)的简写。
   * 
   * @param {string} key
   * @param {any}    value
   * @returns {Promise<number>} 设置成功，返回 1 。设置失败，返回 0 。
   */
  async setnx(key: string, value: any): Promise<number>;
  /**
   * #### SETRANGE   
   * SETRANGE key offset value
   * 
   * 用 value 参数覆写(overwrite)给定 key 所储存的字符串值，从偏移量 offset 开始。  
   * 不存在的 key 当作空白字符串处理。  
   * SETRANGE 命令会确保字符串足够长以便将 value 设置在指定的偏移量上，如果给定 key 原来储存的字符串长度比偏移量小(比如字符串只有 5 个字符长，但你设置的 offset 是 10 )，那么原字符和偏移量之间的空白将用零字节(zerobytes, "\x00" )来填充。
   * 
   * @param {string} key
   * @param {number} offset
   * @param {any} value
   * @returns {Promise<number>} 被 SETRANGE 修改之后，字符串的长度。
   */
  async setrange(key: string, offset: number, value: any): Promise<number>;
  /**
   * #### STRLEN   
   * STRLEN key
   * 
   * 返回 key 所储存的字符串值的长度。  
   * 当 key 储存的不是字符串值时，返回一个错误。  
   * 
   * @param {string} key
   * @returns {Promise<number>} 字符串值的长度。当 key 不存在时，返回 0   
   */
  async strlen(key: string): Promise<number>;
  // Hash =====
  /**
   * #### HDEL   
   * HDEL key field [field ...]
   * 
   * 删除哈希表 key 中的一个或多个指定域，不存在的域将被忽略。  
   * 
   * @param {string} key 
   * @param {Array<string>} field
   * @returns {Promise<number>} 被成功移除的域的数量，不包括被忽略的域。
   */
  async hdel(key: string, ...field: Array<string>): Promise<number>;
  /**
   * #### HEXISTS   
   * HEXISTS key field
   * 
   * 查看哈希表 key 中，给定域 field 是否存在。  
   *   
   * @param {string} key
   * @param {string} field
   * @returns {Promise<number>} 如果哈希表含有给定域，返回 1 。  
   *                   如果哈希表不含有给定域，或 key 不存在，返回 0 。
   */
  async hexists(key: string, field: string): Promise<number>;
  /**
   * #### HGET   
   * HGET key field
   * 
   * 返回哈希表 key 中给定域 field 的值。  
   *   
   * @param {string} key
   * @param {string} field
   * @returns {Promise<any>} 给定域的值。  
   *                当给定域不存在或是给定 key 不存在时，返回 nil 。
   */
  async hget(key: string, field: string): Promise<any>;
  /**
   * #### HGETALL   
   * HGETALL key
   * 
   * 返回哈希表 key 中，所有的域和值。
   *   
   * @param {string} key
   * @returns {Promise<Object>} 以键值对形式（ioredis）返回哈希表的域和域的值。
   */
  async hgetall(key: string): Promise<Object>;
  /**
   * #### HINCRBY   
   * HINCRBY key field increment
   * 
   * 为哈希表 key 中的域 field 的值加上增量 increment 。   
   *  
   * @param {string} key
   * @param {string} field
   * @param {number} increment
   * @returns {Promise<number>} 执行加法操作之后 field 域的值。
   */
  async hincrby(key: string, field: string, increment: number): Promise<number>;
  /**
   * #### HINCRBYFLOAT   
   * HINCRBYFLOAT key field increment
   * 
   * 为哈希表 key 中的域 field 加上浮点数增量 increment 。  
   *  
   * @param {string} key
   * @param {string} field
   * @param {number} increment
   * @returns {Promise<number>} 执行加法操作之后 field 域的值。
   */
  async hincrbyfloat(key: string, field: string, increment: number): Promise<number>;
  /**
   * #### HKEYS   
   * HKEYS key
   * 
   * 返回哈希表 key 中的所有域。  
   *  
   * @param {string} key
   * @returns {Promise<Array<string>>} 一个包含哈希表中所有域的表。  
   *                          当 key 不存在时，返回一个空表。
   */
  async hkeys(key: string): Promise<Array<string>>;
  /**
   * #### HLEN   
   * HLEN key
   * 
   * 返回哈希表 key 中域的数量。  
   *  
   * @param {string} key
   * @returns {Promise<number>} 哈希表中域的数量。  
   *                   当 key 不存在时，返回 0 
   */
  async hlen(key: string): Promise<number>;
  /**
   * #### HMGET   
   * HMGET key field [field ...]
   * 
   * 返回哈希表 key 中给定域 field 的值。  
   *   
   * @param {string} key
   * @param {Array<string>} field
   * @returns {Promise<Array<any>>} 一个包含多个给定域的关联值的表，表值的排列顺序和给定域参数的请求顺序一样。
   */
  async hmget(key: string, ...field: Array<string>): Promise<Array<any>>;
  /**
   * #### HMSET   
   * HMSET key field value [field value ...]
   * 
   * 同时将多个 field-value (域-值)对设置到哈希表 key 中。 
   *   
   * @param {string} key
   * @param {string|Object} field 为 Object 时，后续参数将无效。键为 field，值为 value
   * @param {any} value
   * @param {Array<any>} field_value 成对出现的键值对列表 [field value ...]
   * @returns {Promise<string>} 如果命令执行成功，返回 OK 。  
   *                       当 key 不是哈希表(hash)类型时，返回一个错误。
   */
  async hmset(key: string, field: string|Object, value: any, [...field_value]: Array<any>): Promise<string>;
  /**
   * #### HSET   
   * HSET key field value
   * 
   * 将哈希表 key 中的域 field 的值设为 value 。 
   *   
   * @param {string} key
   * @param {string} field
   * @param {any} value
   * @returns {Promise<number>} 如果 field 是哈希表中的一个新建域，并且值设置成功，返回 1 。  
   *                   如果哈希表中域 field 已经存在且旧值已被新值覆盖，返回 0 。
   */
  async hset(key: string, field: string, value: any): Promise<number>;
  /**
   * #### HSETNX   
   * HSETNX key field value
   * 
   * 将哈希表 key 中的域 field 的值设置为 value ，当且仅当域 field 不存在。  
   * 若域 field 已经存在，该操作无效。
   *   
   * @param {string} key
   * @param {string} field
   * @param {any} value
   * @returns {Promise<number>} 设置成功，返回 1 。  
   *                   如果给定域已经存在且没有操作被执行，返回 0 。  
   */
  async hsetnx(key: string, field: string, value: any): Promise<number>;
  /**
   * #### HVALS   
   * HVALS key
   * 
   * 返回哈希表 key 中所有域的值。
   *  
   * @param {string} key
   * @returns {Promise<Array<string>>} 一个包含哈希表中所有值的表。
   *                          当 key 不存在时，返回一个空表。
   */
  async hvals(key: string): Promise<Array<string>>;
  /**
   * #### HSCAN
   * HSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {Promise<any>}
   */
  async hscan(key: string, cursor: string, [...args]: Array<any>): Promise<any>;

  // List =====
  /**
   * #### BLPOP   
   * BLPOP key [key ...] timeout
   * 
   * LPOP 命令的阻塞版本，当给定列表内没有任何元素可供弹出的时候，连接将被 BLPOP 命令阻塞，直到等待超时或发现可弹出元素为止。  
   * 当给定多个 key 参数时，按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的头元素。  
   * 
   * @param {Array<string>} key
   * @param {number} timeout 
   * @returns {Promise<Array<any>>} 弹出元素列表。
   */
  async blpop(...key: string, timeout: number): Promise<Array<any>>;
  /**
   * #### BRPOP   
   * BRPOP key [key ...] timeout
   * 
   * RPOP 命令的阻塞版本，当给定列表内没有任何元素可供弹出的时候，连接将被 BRPOP 命令阻塞，直到等待超时或发现可弹出元素为止。  
   * 当给定多个 key 参数时，按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的头元素。  
   * 
   * @param {Array<string>} key
   * @param {number} timeout 
   * @returns {Promise<Array<any>>} 弹出元素列表。
   */
  async brpop(...key: string, timeout: number): Promise<Array<any>>;
  /**
   * #### BRPOPLPUSH   
   * BRPOPLPUSH source destination timeout
   * 
   * BRPOPLPUSH 是 RPOPLPUSH 的阻塞版本，当给定列表 source 不为空时， BRPOPLPUSH 的表现和 RPOPLPUSH 一样。  
   * 当列表 source 为空时， BRPOPLPUSH 命令将阻塞连接，直到等待超时，或有另一个客户端对 source 执行 LPUSH 或 RPUSH 命令为止。  
   * 超时参数 timeout 接受一个以秒为单位的数字作为值。超时参数设为 0 表示阻塞时间可以无限期延长(block indefinitely) 。  
   * 
   * @param {string} source
   * @param {string} destination
   * @param {number} timeout 
   * @returns {Promise<any>} 假如在指定时间内没有任何元素被弹出，则返回一个 nil 和等待时长。  
   *     反之，返回一个含有两个元素的列表，第一个元素是被弹出元素的值，第二个元素是等待时长。      
   */
  async brpoplpush(source: string, destination: string, timeout: number): Promise<any>;
  /**
   * #### LINDEX   
   * LINDEX key index
   * 
   * 返回列表 key 中，下标为 index 的元素。  
   * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。   
   * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。   
   * 如果 key 不是列表类型，返回一个错误。  
   * 
   * @param {string} key
   * @param {number} index
   * @returns {Promise<any>} 列表中下标为 index 的元素。  
   *     如果 index 参数的值不在列表的区间范围内(out of range)，返回 nil 。   
   */
  async lindex(key: string, index: number): Promise<any>;
  /**
   * #### LINSERT   
   * LINSERT key BEFORE|AFTER pivot value
   * 
   * 将值 value 插入到列表 key 当中，位于值 pivot 之前或之后。  
   * 当 pivot 不存在于列表 key 时，不执行任何操作。   
   * 当 key 不存在时， key 被视为空列表，不执行任何操作。     
   * 如果 key 不是列表类型，返回一个错误。  
   * 
   * @param {string} key
   * @param {'BEFORE'|'AFTER'} direction
   * @param {any}    pivot
   * @param {any}    value
   * @returns {Promise<number>} 如果命令执行成功，返回插入操作完成之后，列表的长度。  
   *                   如果没有找到 pivot ，返回 -1 。   
   *                   如果 key 不存在或为空列表，返回 0 。   
   */
  async linsert(key: string, direction: 'BEFORE'|'AFTER', pivot: any, value: any): Promise<number>;
  /**
   * #### LLEN   
   * LLEN key
   * 
   * 返回列表 key 的长度。
   * 
   * @param {string} key
   * @returns {Promise<number>} 列表 key 的长度。   
   */
  async llen(key: string): Promise<number>;
  /**
   * #### LPOP    
   * LPOP key
   * 
   * 移除并返回列表 key 的头元素。
   * 
   * @param {string} key
   * @returns {Promise<any>} 列表的头元素。当 key 不存在时，返回 nil 。
   */
  async lpop(key: string): Promise<any>;
  /**
   * #### LPUSH    
   * LPUSH key value [value ...]
   * 
   * 将一个或多个值 value 插入到列表 key 的表头  
   * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表头： 比如说，对空列表 mylist 执行命令 LPUSH mylist a b c ，列表的值将是 c b a ，这等同于原子性地执行 LPUSH mylist a 、 LPUSH mylist b 和 LPUSH mylist c 三个命令。  
   * 
   * @param {string} key
   * @param {Array<any>} value
   * @returns {Promise<number>} 执行 LPUSH 命令后，列表的长度。
   */
  async lpush(key: string, ...value: Array<any>): Promise<number>;
  /**
   * #### LPUSHX    
   * LPUSHX key value
   * 
   * 将值 value 插入到列表 key 的表头，当且仅当 key 存在并且是一个列表。  
   * 和 LPUSH 命令相反，当 key 不存在时， LPUSHX 命令什么也不做。   
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {Promise<number>} LPUSHX 命令执行之后，表的长度。
   */
  async lpushx(key: string, value: any): Promise<number>;
  /**
   * #### LRANGE    
   * LRANGE key start stop
   * 
   * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。   
   * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。  
   * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} stop 
   * @returns {Promise<Array<any>>} 一个列表，包含指定区间内的元素。
   */
  async lrange(key: string, start: number, stop: number): Promise<Array<any>>;
  /**
   * #### LREM    
   * LREM key count value
   * 
   * 根据参数 count 的值，移除列表中与参数 value 相等的元素。  
   * count 的值可以是以下几种：  
   * - count > 0 : 从表头开始向表尾搜索，移除与 value 相等的元素，数量为 count 。
   * - count < 0 : 从表尾开始向表头搜索，移除与 value 相等的元素，数量为 count 的绝对值。
   * - count = 0 : 移除表中所有与 value 相等的值。
   * 
   * @param {string} key
   * @param {number} count
   * @param {any}    value 
   * @returns {Promise<number>} 被移除元素的数量。
   *   因为不存在的 key 被视作空表(empty list)，所以当 key 不存在时， LREM 命令总是返回 0 。
   */
  async lrem(key: string, count: number, value: any): Promise<number>;
  /**
   * #### LSET   
   * LSET key index value
   * 
   * 将列表 key 下标为 index 的元素的值设置为 value 。  
   * 当 index 参数超出范围，或对一个空列表( key 不存在)进行 LSET 时，返回一个错误。   
   * 
   * @param {string} key
   * @param {number} index
   * @param {any}    value
   * @returns {Promise<string>} 操作成功返回 ok ，否则返回错误信息。  
   */
  async lset(key: string, index: number, value: any): Promise<string>;
  /**
   * #### LTRIM   
   * LTRIM key start stop
   * 
   * 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} stop 
   * @returns {Promise<string>} 命令执行成功时，返回 ok 。
   */
  async ltrim(key: string, start: number, stop: number): Promise<string>;
  /**
   * #### RPOP    
   * RPOP key
   * 
   * 移除并返回列表 key 的尾元素。
   * 
   * @param {string} key
   * @returns {Promise<any>} 列表的尾元素。当 key 不存在时，返回 nil 。
   */
  async rpop(key: string): Promise<any>;
  /**
   * #### RPOPLPUSH   
   * RPOPLPUSH source destination
   * 
   * 命令 RPOPLPUSH 在一个原子时间内，执行以下两个动作：  
   * - 将列表 source 中的最后一个元素(尾元素)弹出，并返回给客户端。
   * - 将 source 弹出的元素插入到列表 destination ，作为 destination 列表的的头元素。
   * 
   *  
   * @param {string} source
   * @param {string} destination
   * @param {number} timeout 
   * @returns {Promise<any>} 假如在指定时间内没有任何元素被弹出，则返回一个 nil 和等待时长。  
   *     反之，返回一个含有两个元素的列表，第一个元素是被弹出元素的值，第二个元素是等待时长。      
   */
  async rpoplpush(source: string, destination: string): Promise<any>;
  /**
   * #### RPUSH    
   * RPUSH key value [value ...]
   * 
   * 将一个或多个值 value 插入到列表 key 的表尾(最右边)。  
   * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表尾：比如对一个空列表 mylist 执行 RPUSH mylist a b c ，得出的结果列表为 a b c ，等同于执行命令 RPUSH mylist a 、 RPUSH mylist b 、 RPUSH mylist c 。  
   * 
   * @param {string} key
   * @param {Array<any>} value
   * @returns {Promise<number>} 执行 RPUSH 命令后，列表的长度。
   */
  async rpush(key: string, ...value: Array<any>): Promise<number>;
  /**
   * #### RPUSHX    
   * RPUSHX key value
   * 
   * 将值 value 插入到列表 key 的表尾，当且仅当 key 存在并且是一个列表。  
   * 和 RPUSH 命令相反，当 key 不存在时， RPUSHX 命令什么也不做。   
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {Promise<number>} RPUSHX 命令执行之后，表的长度。
   */
  async rpushx(key: string, value: any): Promise<number>;

  // Set =====
  /**
   * #### SADD    
   * SADD key member [member ...]
   * 
   * 将一个或多个 member 元素加入到集合 key 当中，已经存在于集合的 member 元素将被忽略。  
   * 假如 key 不存在，则创建一个只包含 member 元素作成员的集合。  
   * 
   * @param {string} key
   * @param {Array<any>} member
   * @returns {Promise<number>} 被添加到集合中的新元素的数量，不包括被忽略的元素。
   */
  async sadd(key: string, ...member: Array<any>): Promise<number>;
  /**
   * #### SCARD    
   * SCARD key
   * 
   * 返回集合 key 的基数(集合中元素的数量)。  
   * 
   * @param {string} key
   * @returns {Promise<number>} 集合的基数。当 key 不存在时，返回 0 。
   */
  async scard(key: string): Promise<number>;
  /**
   * #### SDIFF    
   * SDIFF key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合之间的差集。   
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<Array<any>>} 差集成员的列表。
   */
  async sdiff(...key: Array<string>): Promise<Array<any>>;
  /**
   * #### SDIFFSTORE    
   * SDIFFSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SDIFF 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {Promise<number>} 结果集中的元素数量。
   */
  async sdiffstore(destination: string, ...key: Array<string>): Promise<number>;
  /**
   * #### SINTER    
   * SINTER key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合的交集。    
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<Array<any>>} 交集成员的列表。
   */
  async sinter(...key: Array<string>): Promise<Array<any>>;
  /**
   * #### SINTERSTORE    
   * SINTERSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SINTER 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {Promise<number>} 结果集中的元素数量。
   */
  async sinterstore(destination: string, ...key: Array<string>): Promise<number>;
  /**
   * #### SISMEMBER    
   * SISMEMBER key member
   * 
   * 判断 member 元素是否集合 key 的成员。      
   * 
   * @param {string} key 
   * @param {any}    member
   * @returns {Promise<number>} 如果 member 元素是集合的成员，返回 1 。  
   *                   如果 member 元素不是集合的成员，或 key 不存在，返回 0 。
   */
  async sismember(key: string, member: any): Promise<number>;
  /**
   * #### SMEMBERS    
   * SMEMBERS key
   * 
   * 返回集合 key 中的所有成员。     
   * 不存在的 key 被视为空集合。  
   * 
   * @param {string} key
   * @returns {Promise<Array<any>>} 集合中的所有成员。
   */
  async smembers(key: string): Promise<Array<any>>;
  /**
   * #### SMOVE    
   * SMOVE source destination member
   * 
   * 将 member 元素从 source 集合移动到 destination 集合。   
   * 
   * @param {string} key
   * @param {string} destination
   * @param {any}    member
   * @returns {Promise<number>} 如果 member 元素被成功移除，返回 1 。  
   *   如果 member 元素不是 source 集合的成员，并且没有任何操作对 destination 集合执行，那么返回 0 。
   */
  async smove(source: string, destination: string, member: any): Promise<number>;
  /**
   * #### SPOP   
   * SPOP key
   * 
   * 移除并返回集合中的一个随机元素。       
   * 如果只想获取一个随机元素，但不想该元素从集合中被移除的话，可以使用 SRANDMEMBER 命令。  
   * 
   * @param {string} key
   * @returns {Promise<any>} 被移除的随机元素。  
   *   当 key 不存在或 key 是空集时，返回 nil 。
   */
  async spop(key: string): Promise<any>;
  /**
   * #### SRANDMEMBER   
   * SRANDMEMBER key [count]
   * 
   * 如果命令执行时，只提供了 key 参数，那么返回集合中的一个随机元素。    
   * 该操作和 SPOP 相似，但 SPOP 将随机元素从集合中移除并返回，而 SRANDMEMBER 则仅仅返回随机元素，而不对集合进行任何改动。  
   *  
   * @param {string} key
   * @param {number} [count]
   * @returns {Promise<Array<any>|any>} 只提供 key 参数时，返回一个元素；如果集合为空，返回 nil 。    
   *   如果提供了 count 参数，那么返回一个数组；如果集合为空，返回空数组。
   */
  async srandmember(key: string, [count]: number): Promise<Array<any>|any>;
  /**
   * #### SREM    
   * SREM key member [member ...]
   * 
   * 移除集合 key 中的一个或多个 member 元素，不存在的 member 元素会被忽略。      
   * 
   * @param {string} key
   * @param {Array<any>} member
   * @returns {Promise<number>} 被成功移除的元素的数量，不包括被忽略的元素。
   */
  async srem(key: string, ...member: Array<any>): Promise<number>;
  /**
   * #### SUNION    
   * SUNION key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合的并集。    
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<Array<any>>} 并集成员的列表。
   */
  async sunion(...key: Array<string>): Promise<Array<any>>;
  /**
   * #### SUNIONSTORE    
   * SUNIONSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SUNION 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {Promise<number>} 结果集中的元素数量。
   */
  async sunionstore(destination: string, ...key: Array<string>): Promise<number>;
  /**
   * #### SSCAN
   * SSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {Promise<any>}
   */
  async sscan(key: string, cursor: string, [...args]: Array<any>): Promise<any>;
  
  // SortedSet =====
  /**
   * #### ZADD   
   * ZADD key score member [[score member] [score member] ...]
   * 
   * 将一个或多个 member 元素及其 score 值加入到有序集 key 当中。   
   * 如果某个 member 已经是有序集的成员，那么更新这个 member 的 score 值，并通过重新插入这个 member 元素，来保证该 member 在正确的位置上。  
   * score 值可以是整数值或双精度浮点数。  
   * 如果 key 不存在，则创建一个空的有序集并执行 ZADD 操作。  
   *   
   * @param {string} key
   * @param {number} score
   * @param {any}    member
   * @param {Array<any>} score_member 成对出现的键值对列表 [[score member] [score member] ...]
   * @returns {Promise<number>} 被成功添加的新成员的数量，不包括那些被更新的、已经存在的成员。
   */
  async zadd(key: string, score: number, member: any, [...score_member]: Array<any>): Promise<number>;
  /**
   * #### ZCOUNT   
   * ZCOUNT key min max
   * 
   * 返回有序集 key 中， score 值在 min 和 max 之间(默认包括 score 值等于 min 或 max )的成员的数量。  
   * 关于参数 min 和 max 的详细使用方法，请参考 ZRANGEBYSCORE 命令。 
   * 
   * @param {string} key
   * @param {number} min
   * @param {number} max
   * @returns {Promise<number>} score 值在 min 和 max 之间的成员的数量。
   */
  async zcount(key: string, min: number, max: number): Promise<number>;
  /**
   * #### ZINCRBY   
   * ZINCRBY key increment member
   * 
   * 为有序集 key 的成员 member 的 score 值加上增量 increment 。  
   * 可以通过传递一个负数值 increment ，让 score 减去相应的值，比如 ZINCRBY key -5 member ，就是让 member 的 score 值减去 5 。  
   * 当 key 不存在，或 member 不是 key 的成员时， ZINCRBY key increment member 等同于 ZADD key increment member 。  
   * 
   * @param {string} key
   * @param {number} increment
   * @param {any}    member
   * @returns {Promise<string>} member 成员的新 score 值，以字符串形式表示。
   */
  async zincrby(key: string, increment: number, member: any): Promise<string>;
  /**
   * #### ZRANGE   
   * ZRANGE key start stop [WITHSCORES]
   * 
   * 返回有序集 key 中，指定区间内的成员。   
   * 其中成员的位置按 score 值递增(从小到大)来排序。    
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列。    
   * 如果你需要成员按 score 值递减(从大到小)来排列，请使用 ZREVRANGE 命令。
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @param {'WITHSCORES'} [WITHSCORES]
   * @returns {Promise<Array<any>>} 指定区间内，带有 score 值(可选)的有序集成员的列表。
   */
  async zrange(key: string, start: number, stop: number, [WITHSCORES]: 'WITHSCORES'): Promise<Array<any>>;
  /**
   * #### ZRANGEBYSCORE   
   * ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
   * 
   * 返回有序集 key 中，所有 score 值介于 min 和 max 之间(包括等于 min 或 max )的成员。有序集成员按 score 值递增(从小到大)次序排列。   
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列(该属性是有序集提供的，不需要额外的计算)。     
   * 可选的 LIMIT 参数指定返回结果的数量及区间(就像SQL中的 SELECT LIMIT offset, count )，注意当 offset 很大时，定位 offset 的操作可能需要遍历整个有序集，此过程最坏复杂度为 O(N) 时间。  
   * 可选的 WITHSCORES 参数决定结果集是单单返回有序集的成员，还是将有序集成员及其 score 值一起返回。  
   * 
   * 默认情况下，区间的取值使用闭区间 (小于等于或大于等于)，你也可以通过给参数前增加 ( 符号来使用可选的开区间 (小于或大于)。  
   * 如 `ZRANGEBYSCORE zset (5 (10` 所有符合条件 5 < score < 10 的成员。  
   * 
   * @param {string} key
   * @param {string} min
   * @param {string} max
   * @param {'WITHSCORES'} [WITHSCORES]
   * @param {'LIMIT'} [LIMIT]
   * @param {number} [offset]
   * @param {number} [count]
   * @returns {Promise<Array<any>>} 指定区间内，带有 score 值(可选)的有序集成员的列表。
   */
  async zrangebyscore(key: string, min: string, max: string, [WITHSCORES]: 'WITHSCORES', [LIMIT]: 'LIMIT', [offset]: number, [count]: number): Promise<Array<any>>;
  /**
   * #### ZRANK   
   * ZRANK key member
   * 
   * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递增(从小到大)顺序排列。     
   * 排名以 0 为底，也就是说， score 值最小的成员排名为 0 。  
   * 使用 ZREVRANK 命令可以获得成员按 score 值递减(从大到小)排列的排名。  
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {Promise<number>} 如果 member 是有序集 key 的成员，返回 member 的排名。  
   *                   如果 member 不是有序集 key 的成员，返回 nil 。
   */
  async zrank(key: string, member: any): Promise<number>;
  /**
   * #### ZREM   
   * ZREM key member [member ...]
   * 
   * 移除有序集 key 中的一个或多个成员，不存在的成员将被忽略。   
   *   
   * @param {string} key
   * @param {Array<any>} member
   * @returns {Promise<number>} 被成功移除的成员的数量，不包括被忽略的成员。
   */
  async zrem(key: string, ...member: Array<any>): Promise<number>;
  /**
   * #### ZREMRANGEBYRANK   
   * ZREMRANGEBYRANK key start stop
   * 
   * 移除有序集 key 中，指定排名(rank)区间内的所有成员。    
   * 区间分别以下标参数 start 和 stop 指出，包含 start 和 stop 在内。    
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @returns {Promise<number>} 被移除成员的数量。
   */
  async zremrangebyrank(key: string, start: number, stop: number): Promise<number>;
  /**
   * #### ZREMRANGEBYSCORE   
   * ZREMRANGEBYSCORE key min max
   * 
   * 移除有序集 key 中，所有 score 值介于 min 和 max 之间(包括等于 min 或 max )的成员。     
   * score 值等于 min 或 max 的成员也可以不包括在内，详情请参见 ZRANGEBYSCORE 命令。    
   * 
   * @param {string} key
   * @param {string} min
   * @param {string} max
   * @returns {Promise<number>} 被移除成员的数量。
   */
  async zremrangebyscore(key: string, min: string, max: string): Promise<number>;
  /**
   * #### ZREVRANGE   
   * ZREVRANGE key start stop [WITHSCORES]
   * 
   * 返回有序集 key 中，指定区间内的成员。   
   * 其中成员的位置按 score 值递减(从大到小)来排列。    
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列。    
   * 除了成员按 score 值递减的次序排列这一点外， ZREVRANGE 命令的其他方面和 ZRANGE 命令一样。 
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @param {'WITHSCORES'} [WITHSCORES]
   * @returns {Promise<Array<any>>} 指定区间内，带有 score 值(可选)的有序集成员的列表。
   */
  async zrevrange(key: string, start: number, stop: number, [WITHSCORES]: 'WITHSCORES'): Promise<Array<any>>;
  /**
   * #### ZREVRANGEBYSCORE   
   * ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
   * 
   * 返回有序集 key 中， score 值介于 max 和 min 之间(默认包括等于 max 或 min )的所有的成员。有序集成员按 score 值递减(从大到小)的次序排列。   
   * 具有相同 score 值的成员按字典序的逆序(reverse lexicographical order )排列。  
   * 除了成员按 score 值递减的次序排列这一点外， ZREVRANGEBYSCORE 命令的其他方面和 ZRANGEBYSCORE 命令一样。   
   * （注意：max、min 参数位置跟 ZRANGEBYSCORE 是反过来的） 
   * 
   * @param {string} key
   * @param {string} max
   * @param {string} min
   * @param {'WITHSCORES'} [WITHSCORES]
   * @param {'LIMIT'} [LIMIT]
   * @param {number} [offset]
   * @param {number} [count]
   * @returns {Promise<Array<any>>} 指定区间内，带有 score 值(可选)的有序集成员的列表。
   */
  async zrevrangebyscore(key: string, max: string, min: string, [WITHSCORES]: 'WITHSCORES', [LIMIT]: 'LIMIT', [offset]: number, [count]: number): Promise<Array<any>>;
  /**
   * #### ZREVRANK   
   * ZREVRANK key member
   * 
   * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递减(从大到小)排序。     
   * 排名以 0 为底，也就是说， score 值最大的成员排名为 0 。   
   * 使用 ZRANK 命令可以获得成员按 score 值递增(从小到大)排列的排名。   
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {Promise<number>} 如果 member 是有序集 key 的成员，返回 member 的排名。  
   *                   如果 member 不是有序集 key 的成员，返回 nil 。
   */
  async zrevrank(key: string, member: any): Promise<number>;
  /**
   * #### ZSCORE   
   * ZSCORE key member
   * 
   * 返回有序集 key 中，成员 member 的 score 值。     
   * 如果 member 元素不是有序集 key 的成员，或 key 不存在，返回 nil 。   
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {Promise<string>} member 成员的 score 值，以字符串形式表示。
   */
  async zscore(key: string, member: any): Promise<string>;
  /**
   * #### ZUNIONSTORE   
   * ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
   * 
   * 计算给定的一个或多个有序集的并集，其中给定 key 的数量必须以 numkeys 参数指定，并将该并集(结果集)储存到 destination 。      
   * 默认情况下，结果集中某个成员的 score 值是所有给定集下该成员 score 值之 和 。   
   * 
   * WEIGHTS
   * > 使用 WEIGHTS 选项，你可以为 每个 给定有序集 分别 指定一个乘法因子(multiplication factor)，每个给定有序集的所有成员的 score 值在传递给聚合函数(aggregation function)之前都要先乘以该有序集的因子。
   * 
   * AGGREGATE  
   * > 使用 AGGREGATE 选项，你可以指定并集的结果集的聚合方式。  
   * > 默认使用的参数 SUM ，可以将所有集合中某个成员的 score 值之 和 作为结果集中该成员的 score 值；使用参数 MIN ，可以将所有集合中某个成员的 最小 score 值作为结果集中该成员的 score 值；而参数 MAX 则是将所有集合中某个成员的 最大 score 值作为结果集中该成员的 score 值。  
   * 
   * 
   * @param {string} destination
   * @param {number} numkeys
   * @param {Array<string>} key
   * @param {'WEIGHTS'} [WEIGHTS]
   * @param {Array<number>} [weight]
   * @param {'AGGREGATE'} [AGGREGATE] 
   * @param {'SUM'|'MIN'|'MAX'} [aggregateFunc] 
   * @returns {Promise<number>} 保存到 destination 的结果集的基数。
   */
  async zunionstore(destination: string, numkeys: number, ...key: Array<string>, [WEIGHTS]: 'WEIGHTS', [...weight]: Array<number>, [AGGREGATE]: 'AGGREGATE', aggregateFunc: 'SUM'|'MIN'|'MAX'): Promise<number>;
  /**
   * #### ZINTERSTORE   
   * ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
   * 
   * 计算给定的一个或多个有序集的交集，其中给定 key 的数量必须以 numkeys 参数指定，并将该交集(结果集)储存到 destination 。      
   * 默认情况下，结果集中某个成员的 score 值是所有给定集下该成员 score 值之 和 。   
   * 
   * WEIGHTS
   * > 使用 WEIGHTS 选项，你可以为 每个 给定有序集 分别 指定一个乘法因子(multiplication factor)，每个给定有序集的所有成员的 score 值在传递给聚合函数(aggregation function)之前都要先乘以该有序集的因子。
   * 
   * AGGREGATE  
   * > 使用 AGGREGATE 选项，你可以指定并集的结果集的聚合方式。  
   * > 默认使用的参数 SUM ，可以将所有集合中某个成员的 score 值之 和 作为结果集中该成员的 score 值；使用参数 MIN ，可以将所有集合中某个成员的 最小 score 值作为结果集中该成员的 score 值；而参数 MAX 则是将所有集合中某个成员的 最大 score 值作为结果集中该成员的 score 值。  
   * 
   * 
   * @param {string} destination
   * @param {number} numkeys
   * @param {Array<string>} key
   * @param {'WEIGHTS'} [WEIGHTS]
   * @param {Array<number>} [weight]
   * @param {'AGGREGATE'} [AGGREGATE] 
   * @param {'SUM'|'MIN'|'MAX'} [aggregateFunc] 
   * @returns {Promise<number>} 保存到 destination 的结果集的基数。
   */
  async zinterstore(destination: string, numkeys: number, ...key: Array<string>, [WEIGHTS]: 'WEIGHTS', [...weight]: Array<number>, [AGGREGATE]: 'AGGREGATE', aggregateFunc: 'SUM'|'MIN'|'MAX'): Promise<number>;
  /**
   * #### ZSCAN
   * ZSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {Promise<any>}
   */
  async zscan(key: string, cursor: string, [...args]: Array<any>): Promise<any>;

  /**
   * #### DISCARD   
   * DISCARD
   * 
   * 取消事务，放弃执行事务块内的所有命令。  
   * 如果正在使用 WATCH 命令监视某个(或某些) key，那么取消所有监视，等同于执行命令 UNWATCH 。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<string>} 总是返回 OK 。
   */
  async discard(...key: Array<string>): Promise<string>;
  /**
   * #### WATCH   
   * WATCH key [key ...]
   * 
   * 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。  
   * 
   * @param {Array<string>} key
   * @returns {Promise<string>} 总是返回 OK 。
   */
  async watch(...key: Array<string>): Promise<string>;
  /**
   * #### UNWATCH   
   * UNWATCH
   * 
   * 取消 WATCH 命令对所有 key 的监视。  
   * 如果在执行 WATCH 命令之后， EXEC 命令或 DISCARD 命令先被执行了的话，那么就不需要再执行 UNWATCH 了。  
   * 因为 EXEC 命令会执行事务，因此 WATCH 命令的效果已经产生了；而 DISCARD 命令在取消事务的同时也会取消所有对 key 的监视，因此这两个命令执行之后，就没有必要执行 UNWATCH 了。  
   * 
   * @returns {Promise<string>} 总是返回 OK 。
   */
  async unwatch(): Promise<string>;
  /**
   * #### MDEL   
   * MDEL pattern
   * 
   * 根据 patten 删除 key 。  
   * 不存在的 key 会被忽略。  
   * 
   * @param {string} pattern 模式 
   * @returns {Promise<number>}
   */
  async mdel(pattern: string): Promise<number>;
  /**
   * #### HGETSET   
   * HGETSET hash field value
   * 
   * hash 版的 GETSET  
   *
   * @param {string} hash  键名
   * @param {string} field 键名
   * @param {any}    value 键值
   * @returns {Promise<any>} 返回给定域的旧值。
   */
  async hgetset(hash: string, field: string, value: any): Promise<any>;

  /** 
   * 启用事务
   * 
   * @returns {CacheMulti} CacheMulti
   */
  multi(): CacheMulti;
}

// ================================================================================
// ================================================================================
// ================================================================================

// redis cache 事务类型
class CacheMulti extends IORedis {
  new(client: IORedis.Redis): CacheMulti;  
  // Key =====
  /**
   * #### DEL
   * DEL key [key ...]
   * 
   * 删除给定的一个或多个 key 。  
   * 不存在的 key 会被忽略。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  del(...key: Array<string>): CacheMulti;
  /**
   * #### DUMP
   * DUMP key
   * 
   * 序列化给定 key ，并返回被序列化的值，使用 RESTORE 命令可以将这个值反序列化为 Redis 键。  
   * 序列化的值不包括任何生存时间信息。 
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                    否则，返回序列化之后的值。
   */
  dump(key: string): CacheMulti;
  /**
   * #### EXISTS
   * EXISTS key
   * 
   * 检查给定 key 是否存在。  
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  exists(key: string): CacheMulti;
  /**
   * #### EXPIRE
   * EXPIRE key seconds
   * 
   * 为给定 key 设置生存时间，当 key 过期时(生存时间为 0 )，它会被自动删除。    
   * 
   * @param {string} key
   * @param {number} seconds
   * @returns {CacheMulti} CacheMulti
   */
  expire(key: string, seconds: number): CacheMulti;
  /**
   * #### EXPIREAT
   * EXPIREAT key timestamp
   * 
   * EXPIREAT 的作用和 EXPIRE 类似，都用于为 key 设置生存时间。  
   * 不同在于 EXPIREAT 命令接受的时间参数是 UNIX 时间戳(unix timestamp)。  
   * 
   * @param {string} key
   * @param {number} timestamp
   * @returns {CacheMulti} CacheMulti
   */
  expireat(key: string, timestamp: number): CacheMulti;
  /**
   * #### KEYS
   * KEYS pattern
   * 
   * 查找所有符合给定模式 pattern 的 key ， 比如说：  
   * KEYS * 匹配数据库中所有 key 。  
   * KEYS h?llo 匹配 hello ， hallo 和 hxllo 等。  
   * KEYS h*llo 匹配 hllo 和 heeeeello 等。  
   * KEYS h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。  
   * 特殊符号用 \ 隔开。  
   * 
   * @param {string} pattern 模式 
   * @returns {CacheMulti} CacheMulti
   */
  keys(pattern: string): CacheMulti;
  /**
   * #### MIGRATE
   * MIGRATE host port key destination-db timeout [COPY] [REPLACE]
   * 
   * 将 key 原子性地从当前实例传送到目标实例的指定数据库上，一旦传送成功， key 保证会出现在目标实例上，而当前实例上的 key 会被删除。
   * 
   * @param {string} host 
   * @param {string} port 
   * @param {string} key 
   * @param {string} db 
   * @param {string} timeout 
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  migrate(host: string, port: string, key: string, db: string, timeout: string, [...args]: Array<any>): CacheMulti;
  /**
   * #### MOVE
   * MOVE key db
   * 
   * 将当前数据库的 key 移动到给定的数据库 db 当中。
   * 如果当前数据库(源数据库)和给定数据库(目标数据库)有相同名字的给定 key ，或者 key 不存在于当前数据库，那么 MOVE 没有任何效果。
   * 因此，也可以利用这一特性，将 MOVE 当作锁(locking)原语(primitive)。
   * 
   * @param {string} key 
   * @param {string} db 
   * @returns {CacheMulti} CacheMulti
   */
  move(key: string, db: string): CacheMulti;
  /**
   * #### OBJECT
   * OBJECT subcommand [arguments [arguments]]
   * 
   * OBJECT 命令允许从内部察看给定 key 的 Redis 对象。  
   * OBJECT 命令有多个子命令：  
   * - OBJECT REFCOUNT <key> 返回给定 key 引用所储存的值的次数。此命令主要用于除错。
   * - OBJECT ENCODING <key> 返回给定 key 锁储存的值所使用的内部表示(representation)。
   * - OBJECT IDLETIME <key> 返回给定 key 自储存以来的空转时间(idle， 没有被读取也没有被写入)，以秒为单位。
   * 
   * @param {'REFCOUNT'|'IDLETIME'|'ENCODING'} subcommand
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   *                ENCODING 返回相应的编码类型。  
   */
  object(subcommand: 'REFCOUNT'|'IDLETIME'|'ENCODING', [...args]: Array<any>): CacheMulti;
  /**
   * #### PERSIST
   * PERSIST key
   * 
   * 移除给定 key 的生存时间，将这个 key 从『易失的』(带生存时间 key )转换成『持久的』(一个不带生存时间、永不过期的 key )。
   * 
   * @param {string} key 
   * @returns {CacheMulti} CacheMulti
   */
  persist(key: string): CacheMulti;
  /**
   * #### PEXPIRE
   * PEXPIRE key milliseconds
   * 
   * 这个命令和 EXPIRE 命令的作用类似，但是它以毫秒为单位设置 key 的生存时间，而不像 EXPIRE 命令那样，以秒为单位。 
   * 
   * @param {string} key
   * @param {number} seconds
   * @returns {CacheMulti} CacheMulti
   */
  pexpire(key: string, seconds: number): CacheMulti;
  /**
   * #### PEXPIREAT
   * PEXPIREAT key milliseconds-timestamp
   * 
   * 这个命令和 EXPIREAT 命令类似，但它以毫秒为单位设置 key 的过期 unix 时间戳，而不是像 EXPIREAT 那样，以秒为单位。
   * 
   * @param {string} key
   * @param {number} mtimestamp
   * @returns {CacheMulti} CacheMulti
   */
  pexpireat(key: string, mtimestamp: number): CacheMulti;
  /**
   * #### PTTL
   * PTTL key 
   * 
   * 这个命令类似于 TTL 命令，但它以毫秒为单位返回 key 的剩余生存时间，而不是像 TTL 命令那样，以秒为单位。
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *   当 key 存在但没有设置剩余生存时间时，返回 -1 。
   *   否则，以毫秒为单位，返回 key 的剩余生存时间。
   */
  pttl(key: string): CacheMulti;
  /**
   * #### RANDOMKEY
   * RANDOMKEY
   * 
   * 从当前数据库中随机返回(不删除)一个 key 。 
   *  
   * @returns {CacheMulti} CacheMulti
   *   当数据库为空时，返回 nil 。
   */
  randomkey(): CacheMulti;
  /**
   * #### RENAME
   * RENAME key newkey
   * 
   * 将 key 改名为 newkey 。
   * 当 key 和 newkey 相同，或者 key 不存在时，返回一个错误。  
   * 当 newkey 已经存在时， RENAME 命令将覆盖旧值。  
   * 
   * @param {string} key
   * @param {string} newkey
   * @returns {CacheMulti} CacheMulti
   */
  rename(key: string, newkey: string): CacheMulti;
  /**
   * #### RENAMENX
   * RENAMENX key newkey
   * 
   * 当且仅当 newkey 不存在时，将 key 改名为 newkey 。  
   * 当 key 不存在时，返回一个错误。  
   * 
   * @param {string} key
   * @param {string} newkey
   * @returns {CacheMulti} CacheMulti
   */
  renamenx(key: string, newkey: string): CacheMulti;
  /**
   * #### SORT
   * SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern ...]] [ASC | DESC] [ALPHA] [STORE destination]
   * 
   * 返回或保存给定列表、集合、有序集合 key 中经过排序的元素。  
   * 排序默认以数字作为对象，值被解释为双精度浮点数，然后进行比较。  
   * 最简单的 SORT 使用方法是 SORT key 和 SORT key DESC ：  
   * 
   * 
   * @param {string} key
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  sort(key: string, [...args]: Array<any>): CacheMulti;  
  /**
   * #### TTL
   * TTL key 
   * 
   * 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。  
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *   当 key 存在但没有设置剩余生存时间时，返回 -1 。
   *   否则，以秒为单位，返回 key 的剩余生存时间。
   */
  ttl(key: string): CacheMulti;
  /**
   * #### TYPE
   * TYPE key 
   * 
   * 返回 key 所储存的值的类型。   
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                   string (字符串)  
   *                   list (列表)  
   *                   set (集合)  
   *                   zset (有序集)  
   *                   hash (哈希表)  
   */
  type(key: string): CacheMulti;
  /**
   * #### SCAN
   * SCAN cursor [MATCH pattern] [COUNT count]
   * 
   * SCAN 命令及其相关的 SSCAN 命令、 HSCAN 命令和 ZSCAN 命令都用于增量地迭代（incrementally iterate）一集元素（a collection of elements）：
   * 
   * - SCAN 命令用于迭代当前数据库中的数据库键。 
   * - SSCAN 命令用于迭代集合键中的元素。
   * - HSCAN 命令用于迭代哈希键中的键值对。
   * - ZSCAN 命令用于迭代有序集合中的元素（包括元素成员和元素分值）。
   * 
   * - SSCAN 命令、 HSCAN 命令和 ZSCAN 命令的第一个参数总是一个数据库键。 
   * - 而 SCAN 命令则不需要在第一个参数提供任何数据库键 —— 因为它迭代的是当前数据库中的所有数据库键。
   *  
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  scan(cursor: string, [...args]: Array<any>): CacheMulti;

  // String =====

  /**
   * #### APPEND   
   * APPEND key value
   * 
   * 如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。  
   * 如果 key 不存在， APPEND 就简单地将给定 key 设为 value ，就像执行 SET key value 一样。  
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  append(key: string, value: any): CacheMulti;
  /**
   * #### BITCOUNT   
   * BITCOUNT key [start] [end]
   * 
   * 计算给定字符串中，被设置为 1 的比特位的数量。  
   * 一般情况下，给定的整个字符串都会被进行计数，通过指定额外的 start 或 end 参数，可以让计数只在特定的位上进行。  
   * start 和 end 参数的设置和 GETRANGE 命令类似，都可以使用负数值：比如 -1 表示最后一个位，而 -2 表示倒数第二个位，以此类推。  
   * 不存在的 key 被当成是空字符串来处理，因此对一个不存在的 key 进行 BITCOUNT 操作，结果为 0 。  
   *  
   * @param {string} key
   * @param {number} [start]
   * @param {number} [end]
   * @returns {CacheMulti} CacheMulti
   */
  bitcount(key: string, [start]: string, [end]: string): CacheMulti;
  /**
   * #### BITOP   
   * BITOP operation destkey key [key ...]
   * 
   * 对一个或多个保存二进制位的字符串 key 进行位元操作，并将结果保存到 destkey 上。  
   * operation 可以是 AND 、 OR 、 NOT 、 XOR 这四种操作中的任意一种：  
   * - BITOP AND destkey key [key ...] ，对一个或多个 key 求逻辑并，并将结果保存到 destkey 。
   * - BITOP OR destkey key [key ...] ，对一个或多个 key 求逻辑或，并将结果保存到 destkey 。
   * - BITOP XOR destkey key [key ...] ，对一个或多个 key 求逻辑异或，并将结果保存到 destkey 。
   * - BITOP NOT destkey key ，对给定 key 求逻辑非，并将结果保存到 destkey 。
   * 
   * 除了 NOT 操作之外，其他操作都可以接受一个或多个 key 作为输入。    
   *  
   * @param {string} operation
   * @param {string} destkey 
   * @param {Array<string>} key 
   * @returns {CacheMulti} CacheMulti
   */
  bitop(operation: string, destkey: string, ...key: Array<string>): CacheMulti;
  /**
   * #### DECR   
   * DECR key
   * 
   * 将 key 中储存的数字值减一。   
   * 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 DECR 操作。   
   * 如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。  
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  decr(key: string): CacheMulti;
  /**
   * #### DECRBY   
   * DECRBY key decrement
   * 
   * 将 key 所储存的值减去减量 decrement 。  
   *  
   * @param {string} key
   * @param {number} decrement
   * @returns {CacheMulti} CacheMulti
   */
  decrby(key: string, decrement: number): CacheMulti;
  /**
   * #### GET   
   * GET key
   * 
   * 返回 key 所关联的字符串值。  
   * 如果 key 不存在那么返回特殊值 nil 。  
   * 假如 key 储存的值不是字符串类型，返回一个错误，因为 GET 只能用于处理字符串值。   
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                如果 key 不是字符串类型，那么返回一个错误。  
   */
  get(key: string): CacheMulti;
  /**
   * #### GETBIT   
   * GETBIT key offset
   * 
   * 对 key 所储存的字符串值，获取指定偏移量上的位(bit)。  
   * 当 offset 比字符串值的长度大，或者 key 不存在时，返回 0 。    
   * 
   * @param {string} key
   * @param {number} offset
   * @returns {CacheMulti} CacheMulti
   */
  getbit(key: string, offset: number): CacheMulti;
  /**
   * #### GETRANGE   
   * GETRANGE key start end
   * 
   * 返回 key 中字符串值的子字符串，字符串的截取范围由 start 和 end 两个偏移量决定(包括 start 和 end 在内)。  
   * 负数偏移量表示从字符串最后开始计数， -1 表示最后一个字符， -2 表示倒数第二个，以此类推。      
   * GETRANGE 通过保证子字符串的值域(range)不超过实际字符串的值域来处理超出范围的值域请求。 
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} end
   * @returns {CacheMulti} CacheMulti
   */
  getrange(key: string, start: number, end: number): CacheMulti;
  /**
   * #### GETSET   
   * GETSET key value
   * 
   * 将给定 key 的值设为 value ，并返回 key 的旧值(old value)。  
   * 当 key 存在但不是字符串类型时，返回一个错误。  
   * 
   * @param {string} key
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  getset(key: string, value: any): CacheMulti;
  /**
   * #### INCR   
   * INCR key
   * 
   * 将 key 中储存的数字值增一。  
   * 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCR 操作。  
   * 如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。  
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  incr(key: string): CacheMulti;
  /**
   * #### INCRBY   
   * INCRBY key increment
   * 
   * 将 key 所储存的值加上增量 increment 。  
   *  
   * @param {string} key
   * @param {number} increment
   * @returns {CacheMulti} CacheMulti
   */
  incrby(key: string, increment: number): CacheMulti;
  /**
   * #### INCRBYFLOAT   
   * INCRBYFLOAT key increment
   * 
   * 将 key 所储存的值加上增量 increment 。  
   *  
   * @param {string} key
   * @param {number} increment
   * @returns {CacheMulti} CacheMulti
   */
  incrbyfloat(key: string, increment: number): CacheMulti;
  /**
   * #### MGET   
   * MGET key [key ...]
   * 
   * 返回所有(一个或多个)给定 key 的值。
   * 如果给定的 key 里面，有某个 key 不存在，那么这个 key 返回特殊值 nil 。因此，该命令永不失败。   
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  mget(...key: string): CacheMulti;
  /**
   * #### MSET   
   * MSET key value [key value ...]
   * 
   * 同时设置一个或多个 key-value 对。  
   * 如果某个给定 key 已经存在，那么 MSET 会用新值覆盖原来的旧值，如果这不是你所希望的效果，请考虑使用 MSETNX 命令：它只会在所有给定 key 都不存在的情况下进行设置操作。   
   * MSET 是一个原子性(atomic)操作，所有给定 key 都会在同一时间内被设置，某些给定 key 被更新而另一些给定 key 没有改变的情况，不可能发生。  
   * 
   * @param {string|Object} key 为 Object 时，仅接受该参数。键为 key，值为 value
   * @param {any}    value
   * @param {Array<any>} key_value 成对出现的键值对列表 [key value ...]
   * @returns {CacheMulti} CacheMulti
   */
  mset(key: string|Object, value: string, [...key_value]: Array<any>): CacheMulti;
  /**
   * #### MSETNX   
   * MSETNX key value [key value ...]
   * 
   * 同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在。  
   * 即使只有一个给定 key 已存在， MSETNX 也会拒绝执行所有给定 key 的设置操作。     
   * MSETNX 是原子性的，因此它可以用作设置多个不同 key 表示不同字段(field)的唯一性逻辑对象(unique logic object)，所有字段要么全被设置，要么全不被设置    
   * 
   * @param {string|Object} key 为 Object 时，仅接受该参数。键为 key，值为 value
   * @param {any}    value
   * @param {Array<any>} key_value 成对出现的键值对列表 [key value ...]
   * @returns {CacheMulti} CacheMulti
   */
  msetnx(key: string|Object, value: string, [...key_value]: Array<any>): CacheMulti;
  /**
   * #### PSETEX   
   * PSETEX key milliseconds value
   * 
   * 这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位。  
   * 
   * @param {string} key
   * @param {number} milliseconds
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  psetex(key: string, milliseconds : number, value: any): CacheMulti;
  /**
   * #### SET   
   * SET key value [EX seconds] [PX milliseconds] [NX|XX]
   * 
   * 将字符串值 value 关联到 key 。  
   * 如果 key 已经持有其他值， SET 就覆写旧值，无视类型。  
   * 对于某个原本带有生存时间（TTL）的键来说， 当 SET 命令成功在这个键上执行时， 这个键原有的 TTL 将被清除。
   * 
   * @param {string} key
   * @param {any}    value
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  set(key: string, value: any, [...args]: Array<any>): CacheMulti;  
  /**
   * #### SETBIT   
   * SETBIT key offset value
   * 
   * 对 key 所储存的字符串值，设置或清除指定偏移量上的位(bit)。  
   * 位的设置或清除取决于 value 参数，可以是 0 也可以是 1 。    
   * 当 key 不存在时，自动生成一个新的字符串值。  
   * 字符串会进行伸展(grown)以确保它可以将 value 保存在指定的偏移量上。当字符串值进行伸展时，空白位置以 0 填充。  
   * offset 参数必须大于或等于 0 ，小于 2^32 (bit 映射被限制在 512 MB 之内)。
   * 
   * @param {string} key
   * @param {number} offset
   * @param {number} value
   * @returns {CacheMulti} CacheMulti
   */
  setbit(key: string, offset: number, value: number): CacheMulti;
  /**
   * #### SETEX   
   * SETEX key seconds value
   * 
   * 将值 value 关联到 key ，并将 key 的生存时间设为 seconds (以秒为单位)。  
   * 如果 key 已经持有其他值， SET 就覆写旧值.    
   * 
   * @param {string} key
   * @param {number} seconds
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  setex(key: string, seconds: number, value: any): CacheMulti;
  /**
   * #### SETNX   
   * SETNX key value
   * 
   * 将 key 的值设为 value ，当且仅当 key 不存在。  
   * 若给定的 key 已经存在，则 SETNX 不做任何动作。  
   * SETNX 是『SET if Not eXists』(如果不存在，则 SET)的简写。
   * 
   * @param {string} key
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  setnx(key: string, value: any): CacheMulti;
  /**
   * #### SETRANGE   
   * SETRANGE key offset value
   * 
   * 用 value 参数覆写(overwrite)给定 key 所储存的字符串值，从偏移量 offset 开始。  
   * 不存在的 key 当作空白字符串处理。  
   * SETRANGE 命令会确保字符串足够长以便将 value 设置在指定的偏移量上，如果给定 key 原来储存的字符串长度比偏移量小(比如字符串只有 5 个字符长，但你设置的 offset 是 10 )，那么原字符和偏移量之间的空白将用零字节(zerobytes, "\x00" )来填充。
   * 
   * @param {string} key
   * @param {number} offset
   * @param {any} value
   * @returns {CacheMulti} CacheMulti
   */
  setrange(key: string, offset: number, value: any): CacheMulti;
  /**
   * #### STRLEN   
   * STRLEN key
   * 
   * 返回 key 所储存的字符串值的长度。  
   * 当 key 储存的不是字符串值时，返回一个错误。  
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  strlen(key: string): CacheMulti;
  // Hash =====
  /**
   * #### HDEL   
   * HDEL key field [field ...]
   * 
   * 删除哈希表 key 中的一个或多个指定域，不存在的域将被忽略。  
   * 
   * @param {string} key 
   * @param {Array<string>} field
   * @returns {CacheMulti} CacheMulti
   */
  hdel(key: string, ...field: Array<string>): CacheMulti;
  /**
   * #### HEXISTS   
   * HEXISTS key field
   * 
   * 查看哈希表 key 中，给定域 field 是否存在。  
   *   
   * @param {string} key
   * @param {string} field
   * @returns {CacheMulti} CacheMulti
   *                   如果哈希表不含有给定域，或 key 不存在，返回 0 。
   */
  hexists(key: string, field: string): CacheMulti;
  /**
   * #### HGET   
   * HGET key field
   * 
   * 返回哈希表 key 中给定域 field 的值。  
   *   
   * @param {string} key
   * @param {string} field
   * @returns {CacheMulti} CacheMulti
   *                当给定域不存在或是给定 key 不存在时，返回 nil 。
   */
  hget(key: string, field: string): CacheMulti;
  /**
   * #### HGETALL   
   * HGETALL key
   * 
   * 返回哈希表 key 中，所有的域和值。
   *   
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  hgetall(key: string): CacheMulti;
  /**
   * #### HINCRBY   
   * HINCRBY key field increment
   * 
   * 为哈希表 key 中的域 field 的值加上增量 increment 。   
   *  
   * @param {string} key
   * @param {string} field
   * @param {number} increment
   * @returns {CacheMulti} CacheMulti
   */
  hincrby(key: string, field: string, increment: number): CacheMulti;
  /**
   * #### HINCRBYFLOAT   
   * HINCRBYFLOAT key field increment
   * 
   * 为哈希表 key 中的域 field 加上浮点数增量 increment 。  
   *  
   * @param {string} key
   * @param {string} field
   * @param {number} increment
   * @returns {CacheMulti} CacheMulti
   */
  hincrbyfloat(key: string, field: string, increment: number): CacheMulti;
  /**
   * #### HKEYS   
   * HKEYS key
   * 
   * 返回哈希表 key 中的所有域。  
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                          当 key 不存在时，返回一个空表。
   */
  hkeys(key: string): CacheMulti;
  /**
   * #### HLEN   
   * HLEN key
   * 
   * 返回哈希表 key 中域的数量。  
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                   当 key 不存在时，返回 0 
   */
  hlen(key: string): CacheMulti;
  /**
   * #### HMGET   
   * HMGET key field [field ...]
   * 
   * 返回哈希表 key 中给定域 field 的值。  
   *   
   * @param {string} key
   * @param {Array<string>} field
   * @returns {CacheMulti} CacheMulti
   */
  hmget(key: string, ...field: Array<string>): CacheMulti;
  /**
   * #### HMSET   
   * HMSET key field value [field value ...]
   * 
   * 同时将多个 field-value (域-值)对设置到哈希表 key 中。 
   *   
   * @param {string} key
   * @param {string|Object} field 为 Object 时，后续参数将无效。键为 field，值为 value
   * @param {any} value
   * @param {Array<any>} field_value 成对出现的键值对列表 [field value ...]
   * @returns {CacheMulti} CacheMulti
   *                       当 key 不是哈希表(hash)类型时，返回一个错误。
   */
  hmset(key: string, field: string|Object, value: any, [...field_value]: Array<any>): CacheMulti;
  /**
   * #### HSET   
   * HSET key field value
   * 
   * 将哈希表 key 中的域 field 的值设为 value 。 
   *   
   * @param {string} key
   * @param {string} field
   * @param {any} value
   * @returns {CacheMulti} CacheMulti
   *                   如果哈希表中域 field 已经存在且旧值已被新值覆盖，返回 0 。
   */
  hset(key: string, field: string, value: any): CacheMulti;
  /**
   * #### HSETNX   
   * HSETNX key field value
   * 
   * 将哈希表 key 中的域 field 的值设置为 value ，当且仅当域 field 不存在。  
   * 若域 field 已经存在，该操作无效。
   *   
   * @param {string} key
   * @param {string} field
   * @param {any} value
   * @returns {CacheMulti} CacheMulti
   *                   如果给定域已经存在且没有操作被执行，返回 0 。  
   */
  hsetnx(key: string, field: string, value: any): CacheMulti;
  /**
   * #### HVALS   
   * HVALS key
   * 
   * 返回哈希表 key 中所有域的值。
   *  
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *                          当 key 不存在时，返回一个空表。
   */
  hvals(key: string): CacheMulti;
  /**
   * #### HSCAN
   * HSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  hscan(key: string, cursor: string, [...args]: Array<any>): CacheMulti;

  // List =====
  /**
   * #### BLPOP   
   * BLPOP key [key ...] timeout
   * 
   * LPOP 命令的阻塞版本，当给定列表内没有任何元素可供弹出的时候，连接将被 BLPOP 命令阻塞，直到等待超时或发现可弹出元素为止。  
   * 当给定多个 key 参数时，按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的头元素。  
   * 
   * @param {Array<string>} key
   * @param {number} timeout 
   * @returns {CacheMulti} CacheMulti
   */
  blpop(...key: string, timeout: number): CacheMulti;
  /**
   * #### BRPOP   
   * BRPOP key [key ...] timeout
   * 
   * RPOP 命令的阻塞版本，当给定列表内没有任何元素可供弹出的时候，连接将被 BRPOP 命令阻塞，直到等待超时或发现可弹出元素为止。  
   * 当给定多个 key 参数时，按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的头元素。  
   * 
   * @param {Array<string>} key
   * @param {number} timeout 
   * @returns {CacheMulti} CacheMulti
   */
  brpop(...key: string, timeout: number): CacheMulti;
  /**
   * #### BRPOPLPUSH   
   * BRPOPLPUSH source destination timeout
   * 
   * BRPOPLPUSH 是 RPOPLPUSH 的阻塞版本，当给定列表 source 不为空时， BRPOPLPUSH 的表现和 RPOPLPUSH 一样。  
   * 当列表 source 为空时， BRPOPLPUSH 命令将阻塞连接，直到等待超时，或有另一个客户端对 source 执行 LPUSH 或 RPUSH 命令为止。  
   * 超时参数 timeout 接受一个以秒为单位的数字作为值。超时参数设为 0 表示阻塞时间可以无限期延长(block indefinitely) 。  
   * 
   * @param {string} source
   * @param {string} destination
   * @param {number} timeout 
   * @returns {CacheMulti} CacheMulti
   *     反之，返回一个含有两个元素的列表，第一个元素是被弹出元素的值，第二个元素是等待时长。      
   */
  brpoplpush(source: string, destination: string, timeout: number): CacheMulti;
  /**
   * #### LINDEX   
   * LINDEX key index
   * 
   * 返回列表 key 中，下标为 index 的元素。  
   * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。   
   * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。   
   * 如果 key 不是列表类型，返回一个错误。  
   * 
   * @param {string} key
   * @param {number} index
   * @returns {CacheMulti} CacheMulti
   *     如果 index 参数的值不在列表的区间范围内(out of range)，返回 nil 。   
   */
  lindex(key: string, index: number): CacheMulti;
  /**
   * #### LINSERT   
   * LINSERT key BEFORE|AFTER pivot value
   * 
   * 将值 value 插入到列表 key 当中，位于值 pivot 之前或之后。  
   * 当 pivot 不存在于列表 key 时，不执行任何操作。   
   * 当 key 不存在时， key 被视为空列表，不执行任何操作。     
   * 如果 key 不是列表类型，返回一个错误。  
   * 
   * @param {string} key
   * @param {'BEFORE'|'AFTER'} direction
   * @param {any}    pivot
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   *                   如果没有找到 pivot ，返回 -1 。   
   *                   如果 key 不存在或为空列表，返回 0 。   
   */
  linsert(key: string, direction: 'BEFORE'|'AFTER', pivot: any, value: any): CacheMulti;
  /**
   * #### LLEN   
   * LLEN key
   * 
   * 返回列表 key 的长度。
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  llen(key: string): CacheMulti;
  /**
   * #### LPOP    
   * LPOP key
   * 
   * 移除并返回列表 key 的头元素。
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  lpop(key: string): CacheMulti;
  /**
   * #### LPUSH    
   * LPUSH key value [value ...]
   * 
   * 将一个或多个值 value 插入到列表 key 的表头  
   * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表头： 比如说，对空列表 mylist 执行命令 LPUSH mylist a b c ，列表的值将是 c b a ，这等同于原子性地执行 LPUSH mylist a 、 LPUSH mylist b 和 LPUSH mylist c 三个命令。  
   * 
   * @param {string} key
   * @param {Array<any>} value
   * @returns {CacheMulti} CacheMulti
   */
  lpush(key: string, ...value: Array<any>): CacheMulti;
  /**
   * #### LPUSHX    
   * LPUSHX key value
   * 
   * 将值 value 插入到列表 key 的表头，当且仅当 key 存在并且是一个列表。  
   * 和 LPUSH 命令相反，当 key 不存在时， LPUSHX 命令什么也不做。   
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  lpushx(key: string, value: any): CacheMulti;
  /**
   * #### LRANGE    
   * LRANGE key start stop
   * 
   * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。   
   * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。  
   * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} stop 
   * @returns {CacheMulti} CacheMulti
   */
  lrange(key: string, start: number, stop: number): CacheMulti;
  /**
   * #### LREM    
   * LREM key count value
   * 
   * 根据参数 count 的值，移除列表中与参数 value 相等的元素。  
   * count 的值可以是以下几种：  
   * - count > 0 : 从表头开始向表尾搜索，移除与 value 相等的元素，数量为 count 。
   * - count < 0 : 从表尾开始向表头搜索，移除与 value 相等的元素，数量为 count 的绝对值。
   * - count = 0 : 移除表中所有与 value 相等的值。
   * 
   * @param {string} key
   * @param {number} count
   * @param {any}    value 
   * @returns {CacheMulti} CacheMulti
   *   因为不存在的 key 被视作空表(empty list)，所以当 key 不存在时， LREM 命令总是返回 0 。
   */
  lrem(key: string, count: number, value: any): CacheMulti;
  /**
   * #### LSET   
   * LSET key index value
   * 
   * 将列表 key 下标为 index 的元素的值设置为 value 。  
   * 当 index 参数超出范围，或对一个空列表( key 不存在)进行 LSET 时，返回一个错误。   
   * 
   * @param {string} key
   * @param {number} index
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  lset(key: string, index: number, value: any): CacheMulti;
  /**
   * #### LTRIM   
   * LTRIM key start stop
   * 
   * 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。
   * 
   * @param {string} key
   * @param {number} start 
   * @param {number} stop 
   * @returns {CacheMulti} CacheMulti
   */
  ltrim(key: string, start: number, stop: number): CacheMulti;
  /**
   * #### RPOP    
   * RPOP key
   * 
   * 移除并返回列表 key 的尾元素。
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  rpop(key: string): CacheMulti;
  /**
   * #### RPOPLPUSH   
   * RPOPLPUSH source destination
   * 
   * 命令 RPOPLPUSH 在一个原子时间内，执行以下两个动作：  
   * - 将列表 source 中的最后一个元素(尾元素)弹出，并返回给客户端。
   * - 将 source 弹出的元素插入到列表 destination ，作为 destination 列表的的头元素。
   * 
   *  
   * @param {string} source
   * @param {string} destination
   * @param {number} timeout 
   * @returns {CacheMulti} CacheMulti
   *     反之，返回一个含有两个元素的列表，第一个元素是被弹出元素的值，第二个元素是等待时长。      
   */
  rpoplpush(source: string, destination: string): CacheMulti;
  /**
   * #### RPUSH    
   * RPUSH key value [value ...]
   * 
   * 将一个或多个值 value 插入到列表 key 的表尾(最右边)。  
   * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表尾：比如对一个空列表 mylist 执行 RPUSH mylist a b c ，得出的结果列表为 a b c ，等同于执行命令 RPUSH mylist a 、 RPUSH mylist b 、 RPUSH mylist c 。  
   * 
   * @param {string} key
   * @param {Array<any>} value
   * @returns {CacheMulti} CacheMulti
   */
  rpush(key: string, ...value: Array<any>): CacheMulti;
  /**
   * #### RPUSHX    
   * RPUSHX key value
   * 
   * 将值 value 插入到列表 key 的表尾，当且仅当 key 存在并且是一个列表。  
   * 和 RPUSH 命令相反，当 key 不存在时， RPUSHX 命令什么也不做。   
   *  
   * @param {string} key
   * @param {any}    value
   * @returns {CacheMulti} CacheMulti
   */
  rpushx(key: string, value: any): CacheMulti;

  // Set =====
  /**
   * #### SADD    
   * SADD key member [member ...]
   * 
   * 将一个或多个 member 元素加入到集合 key 当中，已经存在于集合的 member 元素将被忽略。  
   * 假如 key 不存在，则创建一个只包含 member 元素作成员的集合。  
   * 
   * @param {string} key
   * @param {Array<any>} member
   * @returns {CacheMulti} CacheMulti
   */
  sadd(key: string, ...member: Array<any>): CacheMulti;
  /**
   * #### SCARD    
   * SCARD key
   * 
   * 返回集合 key 的基数(集合中元素的数量)。  
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  scard(key: string): CacheMulti;
  /**
   * #### SDIFF    
   * SDIFF key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合之间的差集。   
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sdiff(...key: Array<string>): CacheMulti;
  /**
   * #### SDIFFSTORE    
   * SDIFFSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SDIFF 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sdiffstore(destination: string, ...key: Array<string>): CacheMulti;
  /**
   * #### SINTER    
   * SINTER key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合的交集。    
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sinter(...key: Array<string>): CacheMulti;
  /**
   * #### SINTERSTORE    
   * SINTERSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SINTER 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sinterstore(destination: string, ...key: Array<string>): CacheMulti;
  /**
   * #### SISMEMBER    
   * SISMEMBER key member
   * 
   * 判断 member 元素是否集合 key 的成员。      
   * 
   * @param {string} key 
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   *                   如果 member 元素不是集合的成员，或 key 不存在，返回 0 。
   */
  sismember(key: string, member: any): CacheMulti;
  /**
   * #### SMEMBERS    
   * SMEMBERS key
   * 
   * 返回集合 key 中的所有成员。     
   * 不存在的 key 被视为空集合。  
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   */
  smembers(key: string): CacheMulti;
  /**
   * #### SMOVE    
   * SMOVE source destination member
   * 
   * 将 member 元素从 source 集合移动到 destination 集合。   
   * 
   * @param {string} key
   * @param {string} destination
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   *   如果 member 元素不是 source 集合的成员，并且没有任何操作对 destination 集合执行，那么返回 0 。
   */
  smove(source: string, destination: string, member: any): CacheMulti;
  /**
   * #### SPOP   
   * SPOP key
   * 
   * 移除并返回集合中的一个随机元素。       
   * 如果只想获取一个随机元素，但不想该元素从集合中被移除的话，可以使用 SRANDMEMBER 命令。  
   * 
   * @param {string} key
   * @returns {CacheMulti} CacheMulti
   *   当 key 不存在或 key 是空集时，返回 nil 。
   */
  spop(key: string): CacheMulti;
  /**
   * #### SRANDMEMBER   
   * SRANDMEMBER key [count]
   * 
   * 如果命令执行时，只提供了 key 参数，那么返回集合中的一个随机元素。    
   * 该操作和 SPOP 相似，但 SPOP 将随机元素从集合中移除并返回，而 SRANDMEMBER 则仅仅返回随机元素，而不对集合进行任何改动。  
   *  
   * @param {string} key
   * @param {number} [count]
   * @returns {CacheMulti} CacheMulti
   *   如果提供了 count 参数，那么返回一个数组；如果集合为空，返回空数组。
   */
  srandmember(key: string, [count]: number): CacheMulti;
  /**
   * #### SREM    
   * SREM key member [member ...]
   * 
   * 移除集合 key 中的一个或多个 member 元素，不存在的 member 元素会被忽略。      
   * 
   * @param {string} key
   * @param {Array<any>} member
   * @returns {CacheMulti} CacheMulti
   */
  srem(key: string, ...member: Array<any>): CacheMulti;
  /**
   * #### SUNION    
   * SUNION key [key ...]
   * 
   * 返回一个集合的全部成员，该集合是所有给定集合的并集。    
   * 不存在的 key 被视为空集。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sunion(...key: Array<string>): CacheMulti;
  /**
   * #### SUNIONSTORE    
   * SUNIONSTORE destination key [key ...]
   * 
   * 这个命令的作用和 SUNION 类似，但它将结果保存到 destination 集合，而不是简单地返回结果集。  
   * 如果 destination 集合已经存在，则将其覆盖。  
   * destination 可以是 key 本身。    
   * 
   * @param {string} destination 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  sunionstore(destination: string, ...key: Array<string>): CacheMulti;
  /**
   * #### SSCAN
   * SSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  sscan(key: string, cursor: string, [...args]: Array<any>): CacheMulti;
  
  // SortedSet =====
  /**
   * #### ZADD   
   * ZADD key score member [[score member] [score member] ...]
   * 
   * 将一个或多个 member 元素及其 score 值加入到有序集 key 当中。   
   * 如果某个 member 已经是有序集的成员，那么更新这个 member 的 score 值，并通过重新插入这个 member 元素，来保证该 member 在正确的位置上。  
   * score 值可以是整数值或双精度浮点数。  
   * 如果 key 不存在，则创建一个空的有序集并执行 ZADD 操作。  
   *   
   * @param {string} key
   * @param {number} score
   * @param {any}    member
   * @param {Array<any>} score_member 成对出现的键值对列表 [[score member] [score member] ...]
   * @returns {CacheMulti} CacheMulti
   */
  zadd(key: string, score: number, member: any, [...score_member]: Array<any>): CacheMulti;
  /**
   * #### ZCOUNT   
   * ZCOUNT key min max
   * 
   * 返回有序集 key 中， score 值在 min 和 max 之间(默认包括 score 值等于 min 或 max )的成员的数量。  
   * 关于参数 min 和 max 的详细使用方法，请参考 ZRANGEBYSCORE 命令。 
   * 
   * @param {string} key
   * @param {number} min
   * @param {number} max
   * @returns {CacheMulti} CacheMulti
   */
  zcount(key: string, min: number, max: number): CacheMulti;
  /**
   * #### ZINCRBY   
   * ZINCRBY key increment member
   * 
   * 为有序集 key 的成员 member 的 score 值加上增量 increment 。  
   * 可以通过传递一个负数值 increment ，让 score 减去相应的值，比如 ZINCRBY key -5 member ，就是让 member 的 score 值减去 5 。  
   * 当 key 不存在，或 member 不是 key 的成员时， ZINCRBY key increment member 等同于 ZADD key increment member 。  
   * 
   * @param {string} key
   * @param {number} increment
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   */
  zincrby(key: string, increment: number, member: any): CacheMulti;
  /**
   * #### ZRANGE   
   * ZRANGE key start stop [WITHSCORES]
   * 
   * 返回有序集 key 中，指定区间内的成员。   
   * 其中成员的位置按 score 值递增(从小到大)来排序。    
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列。    
   * 如果你需要成员按 score 值递减(从大到小)来排列，请使用 ZREVRANGE 命令。
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @param {'WITHSCORES'} [WITHSCORES]
   * @returns {CacheMulti} CacheMulti
   */
  zrange(key: string, start: number, stop: number, [WITHSCORES]: 'WITHSCORES'): CacheMulti;
  /**
   * #### ZRANGEBYSCORE   
   * ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
   * 
   * 返回有序集 key 中，所有 score 值介于 min 和 max 之间(包括等于 min 或 max )的成员。有序集成员按 score 值递增(从小到大)次序排列。   
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列(该属性是有序集提供的，不需要额外的计算)。     
   * 可选的 LIMIT 参数指定返回结果的数量及区间(就像SQL中的 SELECT LIMIT offset, count )，注意当 offset 很大时，定位 offset 的操作可能需要遍历整个有序集，此过程最坏复杂度为 O(N) 时间。  
   * 可选的 WITHSCORES 参数决定结果集是单单返回有序集的成员，还是将有序集成员及其 score 值一起返回。  
   * 
   * 默认情况下，区间的取值使用闭区间 (小于等于或大于等于)，你也可以通过给参数前增加 ( 符号来使用可选的开区间 (小于或大于)。  
   * 如 `ZRANGEBYSCORE zset (5 (10` 所有符合条件 5 < score < 10 的成员。  
   * 
   * @param {string} key
   * @param {string} min
   * @param {string} max
   * @param {'WITHSCORES'} [WITHSCORES]
   * @param {'LIMIT'} [LIMIT]
   * @param {number} [offset]
   * @param {number} [count]
   * @returns {CacheMulti} CacheMulti
   */
  zrangebyscore(key: string, min: string, max: string, [WITHSCORES]: 'WITHSCORES', [LIMIT]: 'LIMIT', [offset]: number, [count]: number): CacheMulti;
  /**
   * #### ZRANK   
   * ZRANK key member
   * 
   * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递增(从小到大)顺序排列。     
   * 排名以 0 为底，也就是说， score 值最小的成员排名为 0 。  
   * 使用 ZREVRANK 命令可以获得成员按 score 值递减(从大到小)排列的排名。  
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   *                   如果 member 不是有序集 key 的成员，返回 nil 。
   */
  zrank(key: string, member: any): CacheMulti;
  /**
   * #### ZREM   
   * ZREM key member [member ...]
   * 
   * 移除有序集 key 中的一个或多个成员，不存在的成员将被忽略。   
   *   
   * @param {string} key
   * @param {Array<any>} member
   * @returns {CacheMulti} CacheMulti
   */
  zrem(key: string, ...member: Array<any>): CacheMulti;
  /**
   * #### ZREMRANGEBYRANK   
   * ZREMRANGEBYRANK key start stop
   * 
   * 移除有序集 key 中，指定排名(rank)区间内的所有成员。    
   * 区间分别以下标参数 start 和 stop 指出，包含 start 和 stop 在内。    
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @returns {CacheMulti} CacheMulti
   */
  zremrangebyrank(key: string, start: number, stop: number): CacheMulti;
  /**
   * #### ZREMRANGEBYSCORE   
   * ZREMRANGEBYSCORE key min max
   * 
   * 移除有序集 key 中，所有 score 值介于 min 和 max 之间(包括等于 min 或 max )的成员。     
   * score 值等于 min 或 max 的成员也可以不包括在内，详情请参见 ZRANGEBYSCORE 命令。    
   * 
   * @param {string} key
   * @param {string} min
   * @param {string} max
   * @returns {CacheMulti} CacheMulti
   */
  zremrangebyscore(key: string, min: string, max: string): CacheMulti;
  /**
   * #### ZREVRANGE   
   * ZREVRANGE key start stop [WITHSCORES]
   * 
   * 返回有序集 key 中，指定区间内的成员。   
   * 其中成员的位置按 score 值递减(从大到小)来排列。    
   * 具有相同 score 值的成员按字典序(lexicographical order)来排列。    
   * 除了成员按 score 值递减的次序排列这一点外， ZREVRANGE 命令的其他方面和 ZRANGE 命令一样。 
   * 
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   * @param {'WITHSCORES'} [WITHSCORES]
   * @returns {CacheMulti} CacheMulti
   */
  zrevrange(key: string, start: number, stop: number, [WITHSCORES]: 'WITHSCORES'): CacheMulti;
  /**
   * #### ZREVRANGEBYSCORE   
   * ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
   * 
   * 返回有序集 key 中， score 值介于 max 和 min 之间(默认包括等于 max 或 min )的所有的成员。有序集成员按 score 值递减(从大到小)的次序排列。   
   * 具有相同 score 值的成员按字典序的逆序(reverse lexicographical order )排列。  
   * 除了成员按 score 值递减的次序排列这一点外， ZREVRANGEBYSCORE 命令的其他方面和 ZRANGEBYSCORE 命令一样。   
   * （注意：max、min 参数位置跟 ZRANGEBYSCORE 是反过来的） 
   * 
   * @param {string} key
   * @param {string} max
   * @param {string} min
   * @param {'WITHSCORES'} [WITHSCORES]
   * @param {'LIMIT'} [LIMIT]
   * @param {number} [offset]
   * @param {number} [count]
   * @returns {CacheMulti} CacheMulti
   */
  zrevrangebyscore(key: string, max: string, min: string, [WITHSCORES]: 'WITHSCORES', [LIMIT]: 'LIMIT', [offset]: number, [count]: number): CacheMulti;
  /**
   * #### ZREVRANK   
   * ZREVRANK key member
   * 
   * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递减(从大到小)排序。     
   * 排名以 0 为底，也就是说， score 值最大的成员排名为 0 。   
   * 使用 ZRANK 命令可以获得成员按 score 值递增(从小到大)排列的排名。   
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   *                   如果 member 不是有序集 key 的成员，返回 nil 。
   */
  zrevrank(key: string, member: any): CacheMulti;
  /**
   * #### ZSCORE   
   * ZSCORE key member
   * 
   * 返回有序集 key 中，成员 member 的 score 值。     
   * 如果 member 元素不是有序集 key 的成员，或 key 不存在，返回 nil 。   
   *   
   * @param {string} key
   * @param {any}    member
   * @returns {CacheMulti} CacheMulti
   */
  zscore(key: string, member: any): CacheMulti;
  /**
   * #### ZUNIONSTORE   
   * ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
   * 
   * 计算给定的一个或多个有序集的并集，其中给定 key 的数量必须以 numkeys 参数指定，并将该并集(结果集)储存到 destination 。      
   * 默认情况下，结果集中某个成员的 score 值是所有给定集下该成员 score 值之 和 。   
   * 
   * WEIGHTS
   * > 使用 WEIGHTS 选项，你可以为 每个 给定有序集 分别 指定一个乘法因子(multiplication factor)，每个给定有序集的所有成员的 score 值在传递给聚合函数(aggregation function)之前都要先乘以该有序集的因子。
   * 
   * AGGREGATE  
   * > 使用 AGGREGATE 选项，你可以指定并集的结果集的聚合方式。  
   * > 默认使用的参数 SUM ，可以将所有集合中某个成员的 score 值之 和 作为结果集中该成员的 score 值；使用参数 MIN ，可以将所有集合中某个成员的 最小 score 值作为结果集中该成员的 score 值；而参数 MAX 则是将所有集合中某个成员的 最大 score 值作为结果集中该成员的 score 值。  
   * 
   * 
   * @param {string} destination
   * @param {number} numkeys
   * @param {Array<string>} key
   * @param {'WEIGHTS'} [WEIGHTS]
   * @param {Array<number>} [weight]
   * @param {'AGGREGATE'} [AGGREGATE] 
   * @param {'SUM'|'MIN'|'MAX'} [aggregateFunc] 
   * @returns {CacheMulti} CacheMulti
   */
  zunionstore(destination: string, numkeys: number, ...key: Array<string>, [WEIGHTS]: 'WEIGHTS', [...weight]: Array<number>, [AGGREGATE]: 'AGGREGATE', aggregateFunc: 'SUM'|'MIN'|'MAX'): CacheMulti;
  /**
   * #### ZINTERSTORE   
   * ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
   * 
   * 计算给定的一个或多个有序集的交集，其中给定 key 的数量必须以 numkeys 参数指定，并将该交集(结果集)储存到 destination 。      
   * 默认情况下，结果集中某个成员的 score 值是所有给定集下该成员 score 值之 和 。   
   * 
   * WEIGHTS
   * > 使用 WEIGHTS 选项，你可以为 每个 给定有序集 分别 指定一个乘法因子(multiplication factor)，每个给定有序集的所有成员的 score 值在传递给聚合函数(aggregation function)之前都要先乘以该有序集的因子。
   * 
   * AGGREGATE  
   * > 使用 AGGREGATE 选项，你可以指定并集的结果集的聚合方式。  
   * > 默认使用的参数 SUM ，可以将所有集合中某个成员的 score 值之 和 作为结果集中该成员的 score 值；使用参数 MIN ，可以将所有集合中某个成员的 最小 score 值作为结果集中该成员的 score 值；而参数 MAX 则是将所有集合中某个成员的 最大 score 值作为结果集中该成员的 score 值。  
   * 
   * 
   * @param {string} destination
   * @param {number} numkeys
   * @param {Array<string>} key
   * @param {'WEIGHTS'} [WEIGHTS]
   * @param {Array<number>} [weight]
   * @param {'AGGREGATE'} [AGGREGATE] 
   * @param {'SUM'|'MIN'|'MAX'} [aggregateFunc] 
   * @returns {CacheMulti} CacheMulti
   */
  zinterstore(destination: string, numkeys: number, ...key: Array<string>, [WEIGHTS]: 'WEIGHTS', [...weight]: Array<number>, [AGGREGATE]: 'AGGREGATE', aggregateFunc: 'SUM'|'MIN'|'MAX'): CacheMulti;
  /**
   * #### ZSCAN
   * ZSCAN key cursor [MATCH pattern] [COUNT count]
   * 
   * 具体信息请参考 SCAN 命令。
   *  
   * @param {string} key
   * @param {string} cursor 
   * @param {Array<any>} [args]
   * @returns {CacheMulti} CacheMulti
   */
  zscan(key: string, cursor: string, [...args]: Array<any>): CacheMulti;

  /**
   * #### DISCARD   
   * DISCARD
   * 
   * 取消事务，放弃执行事务块内的所有命令。  
   * 如果正在使用 WATCH 命令监视某个(或某些) key，那么取消所有监视，等同于执行命令 UNWATCH 。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  discard(...key: Array<string>): CacheMulti;
  /**
   * #### WATCH   
   * WATCH key [key ...]
   * 
   * 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。  
   * 
   * @param {Array<string>} key
   * @returns {CacheMulti} CacheMulti
   */
  watch(...key: Array<string>): CacheMulti;
  /**
   * #### UNWATCH   
   * UNWATCH
   * 
   * 取消 WATCH 命令对所有 key 的监视。  
   * 如果在执行 WATCH 命令之后， EXEC 命令或 DISCARD 命令先被执行了的话，那么就不需要再执行 UNWATCH 了。  
   * 因为 EXEC 命令会执行事务，因此 WATCH 命令的效果已经产生了；而 DISCARD 命令在取消事务的同时也会取消所有对 key 的监视，因此这两个命令执行之后，就没有必要执行 UNWATCH 了。  
   * 
   * @returns {CacheMulti} CacheMulti
   */
  unwatch(): CacheMulti;
  /**
   * 执行事务
   * 
   * @returns {Array<any>} 执行事务结果
   */
  async exec(): Promise<Array<any>>;
}