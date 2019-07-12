'use strict';


const Cache = require('./cache');
const SeckillManager = require('./seckill');
const Redis = require('ioredis');

async function main(){
  let cache = new Cache(new Redis({
    host:'10.32.64.232',
    port:6379,
    password:'duoyi@2016',
    db:20
  }))

  // console.log('cache.set',await cache.set('test','sss','EX',10002000));
  // console.log('cache.get',await cache.get('test'));
  // console.log('cache.set',await cache.set('tes3',{a:2},'EX',10002000));
  // console.log('cache.hset',await cache.hset('testdd','sss',{a:2}));
  // console.log('cache.hget',await cache.hget('testdd','sss'));
  // console.log('cache.del',await cache.del('gggggggg'));
  // console.log('cache.lpush',await cache.lpush('gggggggg',{a:1}));
  
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
//   multi.set('ssssssss','test').hget('testdd','sss').set('testestes:12',{a:1}).ttl('test')
//   console.log('multi.exec',await multi.exec());

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
  let seckillManager = new SeckillManager(cache, {
    stockMap : {
      '沙拉':1,
    }
  });
  console.log('>>>>',seckillManager.stockMap)
  console.log('seckillManager.setStockMap',await seckillManager.setStockMap( {
    '水果':20,
    '鳗鱼饭':2,
    '牛肉饭':5,
  }))
  console.log('>>>>',seckillManager.stockMap)
  console.log('seckillManager.setStock',seckillManager.setStock('糯米鸡',4))
  console.log('>>>>',seckillManager.stockMap)
  console.log('seckillManager.setStock',seckillManager.addStock('鳗鱼饭',3))
  console.log('>>>>',seckillManager.stockMap)
  console.log('seckillManager.subStock',seckillManager.subStock('水果',2))
  console.log('>>>>',seckillManager.stockMap)
  console.log('>>>>',seckillManager.allOrderMap)
  console.log('>>>>',seckillManager.allOrderPayedMap)
  let order1 = seckillManager.getSeckillOrder('No.9527',5000);
  let order2 = seckillManager.getSeckillOrder('No.9528');
  
  console.log('1111111','order1.push', await order1.push('糯米鸡',2))
  console.log('2222222','order2.push', await order2.push('糯米鸡',1))
  console.log('1111111','order1.push', await order1.push('鳗鱼饭',2))
  console.log('2222222','order2.push', await order2.push('糯米鸡',4))
  console.log('2222222','order2.push', await order2.push('糯米鸡',4,true))
  console.log('>>>>>>>>>>>>>1111111','order1.orderMap',  order1.orderMap)
  console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap',  order1.orderPayedMap)
  console.log('>>>>>>>>>>>>>1111111','order1.pay', await order1.pay())
  console.log('>>>>>>>>>>>>>1111111','order1.orderMap',  order1.orderMap)
  console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap',  order1.orderPayedMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderMap',  order2.orderMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap',  order2.orderPayedMap)
  console.log('>>>>>>>>>>>>>2222222','order2.pay', await order2.pay())
  console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  console.log('>>>>',seckillManager.allOrderMap)
  console.log('>>>>',seckillManager.allOrderPayedMap)
  console.log('------------------------------------------')
  console.log('2222222','order2.push', await order2.push('鳗鱼饭',1))
  console.log('1111111','order1.push', await order1.push('水果',5,true))
  console.log('2222222','order2.push', await order2.push('牛肉饭',1))
  console.log('1111111','order1.push', await order1.push('水果',5,true))
  console.log('1111111','order2.push', await order2.push('水果',5,true))
  console.log('1111111','order1.cancel', await order1.cancel('水果',2))


  console.log('>>>>>>>>>>>>>1111111','order1.orderMap', await order1.orderMap)
  console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap', await order1.orderPayedMap)
  // console.log('>>>>>>>>>>>>>1111111','order1.pay', await order1.pay())
  console.log('>>>>>>>>>>>>>1111111','order1.orderMap', await order1.orderMap)
  console.log('>>>>>>>>>>>>>1111111','order1.orderPayedMap', await order1.orderPayedMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  // console.log('>>>>>>>>>>>>>2222222','order2.pay', await order2.pay())
  console.log('>>>>>>>>>>>>>2222222','order2.orderMap', await order2.orderMap)
  console.log('>>>>>>>>>>>>>2222222','order2.orderPayedMap', await order2.orderPayedMap)
  console.log('>>>>',seckillManager.allOrderMap)
  console.log('>>>>',seckillManager.allOrderPayedMap)

  // console.log(order1)
}
setTimeout(main,1);