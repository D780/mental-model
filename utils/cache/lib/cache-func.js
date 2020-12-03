/**
 * Cache 方法定义
*/
'use strict';

const redisCommands = require('redis-commands');

// stringify 的值 表示这个位置的参数需要进行 JSON.stringify
// multi 表示需要 stringify 的值有多个，从 stringify 位置开始往后搜索参数进行转换，step 表示搜索时的步长，默认为 1
// 比如 hmset 的配置，则会从第三位开始每隔 2 个参数会进行 JSON 化处理，如下 value1、value2、value3 均会转成 JSON 字符串
// cache.hmset(hashkey, field1, value1, field2, value2, field3, value3)
// convertObject、convertMap 则是一个兼容化的处理方式
// 在 ioredis 中是支持 hmset(hashkey, { field1: value1 }) 这种对象行使的写法的，这两种配置就是为了激活将该写法转成标准写法的一个处理逻辑
// hmset(hashkey, { field1: value1, field2: value2 }) => hmset(hashkey, field1, value1, field2, value2)
// 含有 parse 表示结果需要 JSON.parse； 具体值有 value 和 list

const commands = {};
for (const comm of redisCommands.list) {
  if (['multi', 'exec'].indexOf(comm) === -1) {
    commands[comm] = {};
  }
}

module.exports = Object.assign(commands, {
  // Key: {
  sort            : { parse: 'list' },
  // },
  // String: {
  append          : { stringify: 2 },
  set             : { stringify: 2 },
  setex           : { stringify: 3 },
  psetex          : { stringify: 3 },
  setnx           : { stringify: 2 },
  setrange        : { stringify: 3 },
  mset            : { stringify: 2, multi: true, step: 2, convertObject: 1, convertMap: 1 },
  msetnx          : { stringify: 2, multi: true, step: 2, convertObject: 1, convertMap: 1 },
  getset          : { stringify: 2, parse: 'value' },
  get             : { parse: 'value' },
  mget            : { parse: 'list' },
  // },
  // Hash: {
  hset            : { stringify: 3 },
  hsetnx          : { stringify: 3 },
  hmset           : { stringify: 3, multi: true, step: 2, convertObject: 2, convertMap: 2 },
  hget            : { parse: 'value' },
  // ioredis 对 hgetall 有单独的转换逻辑，将其转换成了对象返回
  hgetall         : { parse: 'object' },
  hmget           : { parse: 'list' },
  hvals           : { parse: 'list' },
  // },
  // List: {
  lpush           : { stringify: 2, multi: true },
  lpushx          : { stringify: 2, multi: true },
  rpush           : { stringify: 2, multi: true },
  rpushx          : { stringify: 2, multi: true },
  lpop            : { parse: 'value' },
  blpop           : { parse: 'list' },
  rpop            : { parse: 'value' },
  brpop           : { parse: 'list' },
  rpoplpush       : { parse: 'value' },
  brpoplpush      : { parse: 'value' },
  lset            : { stringify: 3 },
  lrange          : { parse: 'list' },
  lrem            : { stringify: 3 },
  lindex          : { parse: 'value' },
  linsert         : { stringify: [3, 4] },
  // },
  // Set: {
  sadd            : { stringify: 2, multi: true },
  sdiff           : { parse: 'list' },
  sinter          : { parse: 'list' },
  sunion          : { parse: 'list' },
  sismember       : { stringify: 2 },
  smembers        : { parse: 'list' },
  smove           : { stringify: 3 },
  spop            : { parse: 'value' },
  srandmember     : { parse: 'list' },
  srem            : { stringify: 2, multi: true },
  // },
  // SortedSet: {
  zadd            : { stringify: 3, multi: true, step: 2 },
  zincrby         : { stringify: 3 },
  zrange          : { parse: 'list', defaultParseOffset: 0, defaultParseStep: 1, parseCheck: 'WITHSCORES', parseOffset: 0, parseStep: 2 },
  zrangebyscore   : { parse: 'list', defaultParseOffset: 0, defaultParseStep: 1, parseCheck: 'WITHSCORES', parseOffset: 0, parseStep: 2 },
  zrevrange       : { parse: 'list', defaultParseOffset: 0, defaultParseStep: 1, parseCheck: 'WITHSCORES', parseOffset: 0, parseStep: 2 },
  zrevrangebyscore: { parse: 'list', defaultParseOffset: 0, defaultParseStep: 1, parseCheck: 'WITHSCORES', parseOffset: 0, parseStep: 2 },
  zrank           : { stringify: 2 },
  zrevrank        : { stringify: 2 },
  zscore          : { stringify: 2 },
  zrem            : { stringify: 2, multi: true },
  // },
});
