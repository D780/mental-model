/**
 * 基于 redis（cache） 的商品秒杀缓存管理类
 *
 */
'use strict';

const _ = require('lodash');

const SECKILLKEY = Symbol('Seckill#seckillKey');
const STOCKMAP = Symbol('Seckill#stockMap');
const SECKILLMANAGER = Symbol('Seckill#seckillManager');
const PUSHTIMEOUT = Symbol('Seckill#pushtimeout');

const CACHE = Symbol('SeckillManager#cache');
const CONFIG = Symbol('SeckillManager#config');
const ALLORDERMAP = Symbol('SeckillManager#allOrderMap');
const ALLORDERPAYEDMAP = Symbol('SeckillManager#allOrderPayedMap');
const SECKILLORDERLIST = Symbol('SeckillManager#seckillOrderList');
const PUSHSCHEDULE = Symbol('SeckillManager#pushSchedule');
const TIMEOUTCANCEL = Symbol('SeckillManager#timeoutCancel');

const ORDERNO = Symbol('SeckillOrder#orderNo');
const ORDERKEY = Symbol('SeckillOrder#orderKey');
const ORDERMAP = Symbol('SeckillOrder#orderMap');
const ORDERPAYEDMAP = Symbol('SeckillOrder#orderPayedMap');
const ALLGOODSORDERMAP = Symbol('SeckillOrder#allGoodsOrderMap');
const ALLGOODSORDERPAYEDMAP = Symbol('SeckillOrder#allGoodsOrderPayedMap');


class SeckillOrder {
  /**
   * Creates an instance of SeckillOrder.
   * @param {String} orderNo  订单号（标识）
   * @param {SeckillManager} seckillManager 秒杀管理器
   * @param {Number} timeout 自动取消订单超时时间
   * @memberof SeckillOrder
   */
  constructor(orderNo, seckillManager, timeout) {
    this[ORDERNO] = orderNo;
    const now = Date.now();
    this[ORDERKEY] = `${this[ORDERNO]}:${now}_${parseInt(Math.random() * 10000, 10)}`;
    this[SECKILLMANAGER] = seckillManager;
    // this[SECKILLKEY] = seckillKey;
    // this[STOCKMAP] = stockMap;
    seckillManager[ALLORDERMAP].order[this[ORDERKEY]] = {};
    seckillManager[ALLORDERPAYEDMAP].order[this[ORDERKEY]] = {};
    this[ORDERMAP] = seckillManager[ALLORDERMAP].order[this[ORDERKEY]];
    this[ORDERPAYEDMAP] = seckillManager[ALLORDERPAYEDMAP].order[this[ORDERKEY]];

    this[ALLGOODSORDERMAP] = seckillManager[ALLORDERMAP].goods;
    this[ALLGOODSORDERPAYEDMAP] = seckillManager[ALLORDERPAYEDMAP].goods;

    this[PUSHSCHEDULE] = [];
    this[PUSHTIMEOUT] = timeout || 1800000;
  }

  get orderNo() {
    return this[ORDERNO];
  }
  get orderKey() {
    return this[ORDERKEY];
  }
  get orderMap() {
    return this[ORDERMAP];
  }
  get orderPayedMap() {
    return this[ORDERPAYEDMAP];
  }

  /**
   * 下单
   *
   * @param {String} goods 商品（标识）
   * @param {Number} count 订购数量
   * @param {Boolean} [auto]  是否自适应下单，默认 false（如 剩余数量 5 件，需要购买 10 件，启用该值时会下单 5 件 而不是下单失败）
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功下单'
   *                   code: 10, msg: '商品不可用！'
   *                   code: 11, msg: '商品已售罄！'
   *                   code: 12, msg: '商品已抢完，但存在未付款的人！'
   *                   code: 13, msg: '订购数量超过了商品余量！'
   */
  async push(goods, count, auto) {
    const num = this[SECKILLMANAGER][STOCKMAP][goods] || 0;
    if (num <= 0) {
      return { success: false, code: 10, msg: '商品不可用！' };
    }
    const payedLen = await this[SECKILLMANAGER][CACHE].llen(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:orderPayed`);
    if (payedLen >= num) {
      return { success: false, code: 11, msg: '商品已售罄！' };
    }
    const orderLen = await this[SECKILLMANAGER][CACHE].llen(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`);
    if (orderLen >= num) {
      return { success: false, code: 12, msg: '商品已抢完，但存在未付款的人！' };
    }
    if (orderLen + count > num) {
      if (!auto) {
        return { success: false, code: 13, msg: '订购数量超过了商品余量！' };
      }
      count = num - orderLen;
    }
    const pushList = [];
    for (let i = 0; i < count; i++) {
      pushList.push(this[ORDERKEY]);
    }
    const oriOrderCount = this[ORDERMAP][goods] || 0;
    // 下单
    await this[SECKILLMANAGER][CACHE].rpush(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, ...pushList);
    const list = await this[SECKILLMANAGER][CACHE].lrange(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, 0, num - 1);
    let realCount = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i] === this[ORDERKEY]) {
        realCount++;
      }
    }
    realCount -= oriOrderCount;
    // 把多余的下单记录去除
    if (realCount < count) {
      await this[SECKILLMANAGER][CACHE].lrem(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, -(count - realCount), this[ORDERKEY]);
    }
    this[ORDERMAP][goods] = oriOrderCount + realCount;
    this[ALLGOODSORDERMAP][goods] += realCount;

    // 生成定时器清理超过 timeout 的未付款的商品的下单信息
    this[PUSHSCHEDULE].push(
      setTimeout(() => {
        return this[TIMEOUTCANCEL]({ [goods]: realCount });
      }, this[PUSHTIMEOUT])
    );
    return { success: true, code: 0, msg: `成功下单 ${realCount} 件商品`, data: { [goods]: realCount } };
  }

  /**
   * 付款
   * 为这次订单未付款的商品进行付款
   *
   * @param {Function} dealFunc 付款自定义处理方法（async），在确定可以付款的时候会调用该方法，提供参数 付款的商品及其数量的映射表
   *                            example :  pay(payMap => { ... console.log(payMap) ... });
   *                                           payMap = { '水果': 5, '饮料': 1 };
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功付款'
   */
  async pay(dealFunc) {
    let totalCount = 0;
    const payMap = {};
    _.map(this[ORDERMAP], (num, goods) => {
      if (num > (this[ORDERPAYEDMAP][goods] || 0)) {
        payMap[goods] = num - (this[ORDERPAYEDMAP][goods] || 0);
        totalCount += payMap[goods];
      }
    });
    if (totalCount) {
      if (dealFunc) {
        await dealFunc(payMap);
      }
      const retText = [];
      // 付款时清理所有超时定时器
      for (let i = 0; i < this[PUSHSCHEDULE].length; i++) {
        clearTimeout(this[PUSHSCHEDULE][i]);
      }
      for (const goods in payMap) {
        const pushList = [];
        for (let i = 0; i < payMap[goods]; i++) {
          pushList.push(this[ORDERKEY]);
        }
        this[ORDERPAYEDMAP][goods] = this[ORDERPAYEDMAP][goods] || 0 + payMap[goods];
        this[ALLGOODSORDERPAYEDMAP][goods] += payMap[goods];
        // 付款
        await this[SECKILLMANAGER][CACHE].rpush(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:orderPayed`, ...pushList);
        retText.push(`${goods} x ${payMap[goods]}`);
      }
      return { success: true, code: 0, msg: `成功付款： ${retText.join(', ')}`, data: payMap };
    }
    return { success: true, code: 0, msg: '没有需要付款的商品' };
  }

  /**
   * 取消商品的订购
   *
   * @param {String} goods 商品（标识）
   * @param {Number} count 取消数量，为 0 时取消全部
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功取消'
   */
  async cancel(goods, count) {
    count = count || 1;
    let cancelOrderCount = 0;
    if (this[ORDERMAP][goods]) {
      cancelOrderCount = this[ORDERMAP][goods] < count ? this[ORDERMAP][goods] : count;
      await this[SECKILLMANAGER][CACHE].lrem(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, -cancelOrderCount, this[ORDERKEY]);
      this[ORDERMAP][goods] -= cancelOrderCount;
      this[ALLGOODSORDERMAP][goods] -= cancelOrderCount;
    }
    return { success: true, code: 0, msg: `成功取消 ${cancelOrderCount} 件商品的订购`, data: { [goods]: cancelOrderCount } };
  }

  /**
   * 取消所有商品的订购
   *
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功取消所有商品的订购'
   */
  async cancelAll() {
    for (const goods in this[ORDERMAP]) {
      const cancelOrderCount = this[ORDERMAP][goods];
      await this[SECKILLMANAGER][CACHE].lrem(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, -cancelOrderCount, this[ORDERKEY]);
      delete this[ORDERMAP][goods];
      this[ALLGOODSORDERMAP][goods] -= cancelOrderCount;
    }
    return { success: true, code: 0, msg: '成功取消所有商品的订购' };
  }

  /**
   * 取消已付款的商品的订购
   *
   * @param {String} goods 商品（标识）
   * @param {Number} count 取消数量，为 0 时取消全部
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功取消'
   */
  async cancelPayed(goods, count) {
    count = count || 1;
    let cancelOrderPayedCount = 0;
    if (this[ORDERPAYEDMAP][goods]) {
      cancelOrderPayedCount = this[ORDERPAYEDMAP][goods] < count ? this[ORDERPAYEDMAP][goods] : count;
      await this[SECKILLMANAGER][CACHE].lrem(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:orderPayed`, -cancelOrderPayedCount, this[ORDERKEY]);
      this[ORDERPAYEDMAP][goods] -= cancelOrderPayedCount;
      this[ALLGOODSORDERPAYEDMAP][goods] -= cancelOrderPayedCount;
    }
    return { success: true, code: 0, msg: `成功取消 ${cancelOrderPayedCount} 件已付款商品的订购`, data: { [goods]: cancelOrderPayedCount } };
  }

  /**
   * 取消所有已付款的商品的订购
   *
   * @returns {Object} {success, code, msg, data}
   *                   code: 0, msg: '成功取消所有已付款的商品的订购'
   */
  async cancelPayedAll() {
    for (const goods in this[ORDERPAYEDMAP]) {
      const cancelOrderPayedCount = this[ORDERPAYEDMAP][goods];
      await this[SECKILLMANAGER][CACHE].lrem(`${this[SECKILLMANAGER][SECKILLKEY]}:${goods}:order`, -cancelOrderPayedCount, this[ORDERKEY]);
      delete this[ORDERPAYEDMAP][goods];
      this[ALLGOODSORDERPAYEDMAP][goods] -= cancelOrderPayedCount;
    }
    return { success: true, code: 0, msg: '成功取消所有已付款的商品的订购' };
  }

  /**
   * 重置并清理所有数据
   */
  async reset() {
    // 重置时，取消所有超时付款定时器
    for (let i = 0; i < this[PUSHSCHEDULE].length; i++) {
      clearTimeout(this[PUSHSCHEDULE][i]);
    }
    await this.cancelAll();
    await this.cancelPayedAll();
  }

  /**
   * 超时清理相应订单信息定时处理方法
   *
   * @param {String} orderMap 订单信息
   * @returns {Array} [{success, code, msg, data}]
   *                   code: 0, msg: '成功取消'
   */
  async [TIMEOUTCANCEL](orderMap) {
    const ret = [];
    for (const goods in orderMap) {
      ret.push(await this.cancel(goods, orderMap[goods]));
    }
    return ret;
  }
}

class SeckillManager {
  /**
   * Creates an instance of SeckillManager.
   * @param {Cache} cache  使用的缓存对象
   * @param {Object} [config] 配置
   * @param {String} [config.seckillKey] 默认 seckill，使用的缓存的键的统一前缀
   * @param {Object} [config.stockMap]   秒杀库存，如： { '水果': 5 }，表示水果参与秒杀，有 5 份，可以通过 [set|add|sub]Stock 方法动态更新库存
   * @param {Object} [config.timeout]    付款超时时间， 超时时间未付款则自动取消订单 默认 30分钟，即 1800000
   * @memberof SeckillManager
   */
  constructor(cache, config) {
    this[CACHE] = cache;
    this[CONFIG] = config || {};
    this[SECKILLKEY] = this[CONFIG].seckillKey || 'seckill';
    this[STOCKMAP] = this[CONFIG].stockMap || {};
    this[ALLORDERMAP] = { goods: {}, order: {} };
    this[ALLORDERPAYEDMAP] = { goods: {}, order: {} };
    this[SECKILLORDERLIST] = [];
    this[PUSHTIMEOUT] = this[CONFIG].timeout || 1800000;
    // this.init();
  }

  get config() {
    return this[CONFIG];
  }

  // set config(config) {
  //   this[CONFIG] = config;
  // }

  get stockMap() {
    return this[STOCKMAP];
  }
  get allOrderMap() {
    return this[ALLORDERMAP];
  }
  get allOrderPayedMap() {
    return this[ALLORDERPAYEDMAP];
  }

  /**
   * 重新置所有商品库存（进行中的所有订单均会取消）
   * @param {String} stockMap 秒杀库存，如： { '水果': 5 }，表示水果参与秒杀，有 5 份，可以通过 [set|add|sub]Stock 方法动态更新库存
   * @memberof Seckill
   */
  async setStockMap(stockMap) {
    this[STOCKMAP] = stockMap || {};
    await this.init();
  }

  async init() {
    await this[CACHE].mdel(`${this[SECKILLKEY]}:*`);
    this[ALLORDERMAP] = { goods: {}, order: {} };
    this[ALLORDERPAYEDMAP] = { goods: {}, order: {} };
    _.map(this[SECKILLORDERLIST], seckillOrder => {
      seckillOrder.cancelAll();
      seckillOrder.cancelPayedAll();
    });
    this[SECKILLORDERLIST] = [];
    _.map(this[STOCKMAP], (num, goods) => {
      this[ALLORDERMAP].goods[goods] = 0;
      this[ALLORDERPAYEDMAP].goods[goods] = 0;
    });
  }

  /**
   * 设置某商品库存
   * 不会影响已下的单
   * @param {String} goods 商品（标识）
   * @param {Number} count 数量
   * @memberof Seckill
   */
  setStock(goods, count) {
    this[STOCKMAP][goods] = count;
    if (_.isUndefined(this[ALLORDERMAP].goods[goods])) {
      this[ALLORDERMAP].goods[goods] = 0;
      this[ALLORDERPAYEDMAP].goods[goods] = 0;
    }
  }

  /**
   * 增加某商品库存
   * 不会影响已下的单
   * @param {String} goods 商品（标识）
   * @param {Number} count 数量
   * @memberof Seckill
   */
  addStock(goods, count) {
    this[STOCKMAP][goods] = this[STOCKMAP][goods] || 0 + count;
    if (_.isUndefined(this[ALLORDERMAP].goods[goods])) {
      this[ALLORDERMAP].goods[goods] = 0;
      this[ALLORDERPAYEDMAP].goods[goods] = 0;
    }
  }

  /**
   * 减少某商品库存
   * 不会影响已下的单
   * @param {String} goods 商品（标识）
   * @param {Number} count 数量
   * @memberof Seckill
   */
  subStock(goods, count) {
    this[STOCKMAP][goods] = (this[STOCKMAP][goods] || 0) < count ? 0 : this[STOCKMAP][goods] - count;
    if (_.isUndefined(this[ALLORDERMAP].goods[goods])) {
      this[ALLORDERMAP].goods[goods] = 0;
      this[ALLORDERPAYEDMAP].goods[goods] = 0;
    }
  }

  /**
   * 获取秒杀订单对象
   *
   * @param {*} orderNo 订单号
   * @param {*} timeout 超时时间，如果无则取初始化时设置的超时时间
   * @returns
   * @memberof SeckillManager
   */
  getSeckillOrder(orderNo, timeout) {
    const seckillOrder = new SeckillOrder(orderNo, this, timeout || this[PUSHTIMEOUT]);
    this[SECKILLORDERLIST].push(seckillOrder);
    return seckillOrder;
  }
}

module.exports = SeckillManager;
