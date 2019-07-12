/**
 * Cache 方法定义
*/
'use strict';

// stringify 的值 表示这个位置的参数需要进行 JSON.stringify
// 含有 parse 表示结果需要 JSON.parse； 具体值有 value 和 list

module.exports = {
  // string: {
  set       : { stringify: 2 },
  setnx     : { stringify: 2 },
  getset    : { stringify: 2, parse: 'value' },
  get       : { parse: 'value' },
  // },
  // hash: {
  hset      : { stringify: 3 },
  hsetnx    : { stringify: 3 },
  hget      : { parse: 'value' },
  hlen      : {},
  hkeys     : {},
  hvals     : { parse: 'list' },
  hdel      : {},
  // },
  // list: {
  lpush     : { stringify: 2, multi: true },
  rpush     : { stringify: 2, multi: true },
  lpop      : { parse: 'value' },
  rpop      : { parse: 'value' },
  rpoplpush : { parse: 'value' },
  brpoplpush: { parse: 'value' },
  lset      : { stringify: 3 },
  llen      : {},
  lrange    : { parse: 'list' },
  lrem      : { stringify: 3 },
  lindex    : { parse: 'value' },
  // },
  // common: {
  expire    : {},
  ttl       : {},
  keys      : {},
  del       : {},
  exists    : {},
  // },
  // other: {
  watch     : {},
  unwatch   : {},
  // },
};
