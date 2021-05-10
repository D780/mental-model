
'use strict';

const Cache = require('./cache/index');
const SeckillManager = require('./seckill');
const Redis = require('ioredis');
const redisCommands = require('redis-commands');
async function main(){
  const client =new Redis({
    host:'*****',
    port:6379,
    password:'*****',
    db:20
  })

  let cache = new Cache(client)

  // let cache = new Cache(client)
  cache.getset
  // console.log(redisCommands);
  // console.log(redisCommands.getKeyIndexes('mset',[ 'key1',1,'key2',2,'key4',2]));
  // console.log(redisCommands.getKeyIndexes('mget', ['key2', 'key1', 'key5']) );
  // console.log(redisCommands.getKeyIndexes('hmset',[ 'hash','hash1','hash1','hash2','hash2' ]));
  
  // console.log('cache.set',await cache.set('testlen','12345'));
  // console.log('cache.set',await cache.set('testlen2',{a:1}));
  // console.log('cache.set',await cache.set('testlen3',[1,2,3,{a:1}]));
  // console.log('cache.set',await cache.set('testlen4',222));
  // // console.log('cache.mset',await cache.mset('mset1',[1,2,3,{a:1}],'mset2',{a:1},'mset23',{a:3333},'mset2223',1,'mset3','[1,2,3,{a:1}]'));
  // // console.log('cache.mget',await cache.mget('mset2223','mset2','mset3'));
  // // console.log('cache.mget',await cache.mget('mset1','mset2','mset3'));
  // // console.log('cache.mset2',await cache.mset({'mset4':[1,2,3,{a:1}],'mset5':{a:1},'mset6':'[1,2,3,{a:1}]'}));
  // console.log('cache.mget2',await cache.mget('testlen','testlen2','testlen3','testlen4'));
  // console.log('cache.len',await cache.strlen('testlen'));
  // console.log('cache.len',await cache.strlen('testlen2'));
  // console.log('cache.len',await cache.strlen('testlen3'));
  // console.log('cache.len',await cache.strlen('testlen4'));
  // console.log('cache.set',await cache.get('testlen'));
  // console.log('cache.set',await cache.get('testlen2'));
  // console.log('cache.set',await cache.get('testlen3'));
  // console.log('cache.set',typeof await cache.get('testlen2'));
  // console.log('cache.set',typeof await cache.get('testlen3'));
  // console.log('cache.hgetall',await cache.hgetall('key1dd'));
  // console.log('cache.set',cache.hgetset('key1dd','f','sss'));
  // console.log('cache.set',cache.hgetset('key1dd','f','sss222'));
  // console.log('cache.mget',await cache.mget('testhash','key1','key2'));
  // console.log('cache.sadd',await cache.sadd('testset2','key1','key2',{a:7},[1,2,3]));
  // console.log('cache.get',await cache.get('test'));
  // console.log('cache.zadd',await cache.zadd('testsset',10,'baidu',20,'google',30,{object:2},1,{object:88}));
  // console.log('cache.zcard',await cache.zcard('testsset'));
  // console.log('cache.zrange',await cache.zrange('testsset',0,-1,));
  // console.log('cache.zrange',await cache.zrange('testsset',0,-1,'WITHSCORES'));
  // const multi = cache.multi();
  // // multi.zadd('testsset',10,'baidu',20,'google',30,{object:2},1,{object:88})
  // // multi.hgetall('key1dd')
  // //  multi.zrange('testsset',0,-1,)
  // //  multi.zrange('testsset',0,-1,'WITHSCORES')
  //  multi.set('testlen','12345')
  //  multi.set('testlen2',{a:1})
  //  multi.set('testlen3',[1,2,3,{a:1}])
  //  multi.mget('testlen','testlen2','testlen3')
  //  multi.mset('mset1',[1,2,39999,{a:1}],'mset2',{a:1},'mset23',{a:3333},'mset2223',1,'mset3','[1,2,3,{"a":1}]')
  //  multi.mget('mset2223','mset1','mset3')
  // //  multi.mset({'mset4':[1,2,'iii3',{a:1}],'mset5':{a:1},'mset6':'[1,2,3,{a:1}]'})
  // //  multi.mget('mset4','mset5','mset6')
  //    console.dir(await multi.exec(),{depth:5});
  // console.log('cache.get',await cache.get('test'));
  // console.log('cache.get',await cache.get('test'));
  // console.log('cache.set',await cache.set('tes3',{a:2},'EX',10002000));
  // console.log('cache.hset',await cache.hset('testdd','sss',{a:2}));
  // console.log('cache.hget',await cache.hget('testdd','sss'));
  // console.log('cache.del',await cache.del('gggggggg'));
  // console.log('cache.lpush',await cache.lpush('gggggggg',{a:1}));
  
  // console.log('cache.lpush',await cache.lpush('gggggggg',{b:1}));
  // console.log('cache.linsert',await cache.linsert('gggggggg','AFTER',{b:1},{XXXX:2}));
  // console.log('cache.lpush',await cache.lpush('gggggggg',{b:1}));
  // console.log('cache.lpush',await cache.lpush('gggggggg','eeeeee'));
  // console.log('cache.lpush',await cache.lpush('gggggggg','eeeeee'));
  // console.log('cache.lpop',await cache.lpop('gggggggg'));
  // console.log('cache.lrange',await cache.lrange('gggggggg',0,-1));

  // console.log('cache.lrem',await cache.lrem('gggggggg',100,{a:1}));
  // console.log('cache.ttl',await cache.ttl('gggggggg'));
  // console.log('cache.ttl',await cache.ttl('tes3'));
  // console.log('cache',cache);
  // console.log('cache.seckill.push',await cache.seckill('tes3',6));
  // console.log('cache.seckill.push',await cache.seckill().push('tes3',6));
// let multi = cache.multi();
// let multi2 = cache.multi();
//   multi.set('ssssssss','test').hget('testdd','sss').set('testestes:12',{a:1}).get('testestes:12')
//   multi2.set('tttttt','test').hget('fdfdfdf','sss').set('testestes:11',{a:1}).get('testestes:12')
//   console.log('before multi.exec',await cache.get('testestes:12'));
//   console.log('before multi.exec',await cache.set('testestes:12',{a:2}));
//   console.log('before multi.exec',await cache.get('testestes:12'));
//   console.log('multi.exec',await multi.exec());
//   console.log('in multi.exec',await cache.get('testestes:12'));
//   console.log('in multi.exec',await cache.set('testestes:12',{a:4}));
//   console.log('in multi.exec',await cache.get('testestes:12'));
//   console.log('multi2.exec',await multi2.exec());
//   console.log('in multi.exec',await cache.get('testestes:12'));
//   console.log('after multi.exec',await cache.set('testestes:12',{a:7}));
//   console.log('after multi.exec',await cache.get('testestes:12'));

  // console.log('cache.set',await cache.set('testestes:11',22));
  // console.log('cache.set',await cache.set('testestes:12',{a:1}));
  // console.log('cache.set',await cache.set('testestes:13',22));
  // console.log('cache.set',await cache.set('testestes:4',22));
  
  // console.log('cache.mdel',await cache.mdel('testestes:1*'));

  
  // let skm = cache.seckill('seckill','No.01234567890',{
  //   '水果':10,
  //   '鳗鱼饭':20,
  //   '牛肉饭':5,
  // },{auto: true});
  // console.log('seckill.push',await skm.push('牛肉饭',3));
  // console.log('seckill.push',await skm.push('水果',3));
  // console.log('seckill.push',await skm.push('鳗鱼饭',4));
  // console.log('seckill.push',await skm.cancel('水果',2));
  // console.log('seckill.push',await skm.orderMap);
  // console.log('seckill.push',await skm.pay());
  // let seckillManager = new SeckillManager(cache, {
  //   stockMap : {
  //     '沙拉':1,
  //   }
  // });
  // console.log('>>>>',seckillManager.stockMap)
  // console.log('seckillManager.setStockMap',await seckillManager.setStockMap( {
  //   '水果':20,
  //   '鳗鱼饭':2,
  //   '牛肉饭':5,
  // }))
  // console.log('>>>>',seckillManager.stockMap)
  // console.log('seckillManager.setStock',seckillManager.setStock('糯米鸡',4))
  // console.log('>>>>',seckillManager.stockMap)
  // console.log('seckillManager.setStock',seckillManager.addStock('鳗鱼饭',3))
  // console.log('>>>>',seckillManager.stockMap)
  // console.log('seckillManager.subStock',seckillManager.subStock('水果',2))
  // console.log('>>>>',seckillManager.stockMap)
  // console.log('>>>>',seckillManager.allOrderMap)
  // console.log('>>>>',seckillManager.allOrderPayedMap)
  // let order1 = seckillManager.getSeckillOrder('No.9527',5000);
  // let order2 = seckillManager.getSeckillOrder('No.9528');
  
  // console.log('1111111','order1.push', await order1.push('糯米鸡',2))
  // console.log('2222222','order2.push', await order2.push('糯米鸡',1))
  // console.log('1111111','order1.push', await order1.push('鳗鱼饭',2))
  // console.log('2222222','order2.push', await order2.push('糯米鸡',4))
  // console.log('2222222','order2.push', await order2.push('糯米鸡',4,true))
  // console.log('>>>>>>>>>>>>>1111111','order1.orderMap',  order1.orderMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap',  order1.orderPayedMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.pay', await order1.pay())
  // console.log('>>>>>>>>>>>>>1111111','order1.orderMap',  order1.orderMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap',  order1.orderPayedMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderMap',  order2.orderMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap',  order2.orderPayedMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.pay', await order2.pay())
  // console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  // console.log('>>>>',seckillManager.allOrderMap)
  // console.log('>>>>',seckillManager.allOrderPayedMap)
  // console.log('------------------------------------------')
  // console.log('2222222','order2.push', await order2.push('鳗鱼饭',1))
  // console.log('1111111','order1.push', await order1.push('水果',5,true))
  // console.log('2222222','order2.push', await order2.push('牛肉饭',1))
  // console.log('1111111','order1.push', await order1.push('水果',5,true))
  // console.log('1111111','order2.push', await order2.push('水果',5,true))
  // console.log('1111111','order1.cancel', await order1.cancel('水果',2))


  // console.log('>>>>>>>>>>>>>1111111','order1.orderMap', await order1.orderMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap', await order1.orderPayedMap)
  // // console.log('>>>>>>>>>>>>>1111111','order1.pay', await order1.pay())
  // console.log('>>>>>>>>>>>>>1111111','order1.orderMap', await order1.orderMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap', await order1.orderPayedMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  // // console.log('>>>>>>>>>>>>>2222222','order2.pay', await order2.pay())
  // console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  // console.log('>>>>',seckillManager.allOrderMap)
  // console.log('>>>>',seckillManager.allOrderPayedMap)

  // console.log(order1)
}
setTimeout(main,1);