/**
 * 基于 sequelize 和 redis（cache） 的数据库查询缓存类
 * redis 客户端需要用我们这里定制的 cache
 */
'use strict';

const crypto = require('crypto');
const _ = require('lodash');

const KEYPREFIX = 'SequelizeCache';
const funcMap = {
  get     : ['findAll', 'count', 'findAndCountAll', 'findByPk', 'findCreateFind', 'findOne', 'findOrBuild', 'findOrCreate', 'max', 'min', 'sum', 'aggregate'],
  save    : ['bulkCreate', 'create', 'decrement', 'destroy', 'drop', 'increment', 'update', 'upsert'],
  instance: ['decrement', 'destroy', 'increment', 'reload', 'restore', 'save', 'set', 'setDataValue', 'update'],
};

module.exports = (Sequelize, client) => {
  Sequelize.Model.cache = function(ttl) {
    return bulidClassMethod(this, client, _.isUndefined(ttl) ? 3600 : ttl);
  };
  Sequelize.Model.prototype.cache = function(ttl) {
    return buildInstanceMethod(this, client, _.isUndefined(ttl) ? 3600 : ttl);
  };
  client.mdel(`${KEYPREFIX}:*`);
};

function bulidClassMethod(Model, client, ttl) {
  const retFunc = { ...Model };
  retFunc.name = Model.name;

  _.map(funcMap.get, func => {
    retFunc[func] = (async function() {
      const optMD5 = md5(`${func}${JSON.stringify(symbolStringify(_.omit(arguments[0], ['transaction', 'lock'])))}`);
      const cacheKey = `${KEYPREFIX}:${this.name}:${associateModels(_.omit(arguments[0], ['transaction', 'lock']))}:${optMD5}`;
      let ret = await client.get(cacheKey);
      if (ret) {
        if (ret.rows) {
          ret.rows = toInstances(this, ret.rows);
        } else if (Array.isArray(ret)) {
          ret = toInstances(this, ret);
        } else {
          ret = toInstance(this, ret);
        }
      } else {
        ret = await Model[func](...arguments);
        if (ttl && Number(ttl) > 0) {
          await client.set(cacheKey, ret, 'EX', ttl);
        } else {
          await client.set(cacheKey, ret);
        }
      }
      return ret;
    }).bind(Model);
  });

  _.map(funcMap.save, func => {
    retFunc[func] = (async function() {
      await client.mdel(`${KEYPREFIX}:*${this.options.name.singular}*`);
      return await Model[func](...arguments);
    }).bind(Model);
  });
  return retFunc;
}

function buildInstanceMethod(Instance, client, ttl) {
  const retFunc = { ...Instance };
  _.map(funcMap.instance, func => {
    retFunc[func] = (async function() {
      await client.mdel(`${KEYPREFIX}:*${this.options.name.singular}*`);
      return await Instance[func](...arguments);
    }).bind(Instance);
  });
  return retFunc;
}

function associateModels(options) {
  let models = [];
  if (options.include) {
    _.map(options.include, includeInfo => {
      models.push(includeInfo.model.name || includeInfo.model);
      if (includeInfo.through) {
        models.push(includeInfo.through.model.name || includeInfo.through.model);
      }
      if (includeInfo.include) {
        models = models.concat(associateModels(includeInfo));
      }
    });
  }
  return _.uniq(models);
}

function md5(content) {
  const md5Func = crypto.createHash('md5');
  md5Func.update(content);
  return md5Func.digest('hex');
}

function symbolStringify(obj) {
  if (obj && typeof obj === 'object') {
    const keys = Reflect.ownKeys(obj);
    const ret = _.cloneDeep(obj);
    _.map(keys, key => {
      if (typeof key === 'symbol') {
        ret[key.toString()] = symbolStringify(ret[key]);
        delete ret[key];
      } else {
        ret[key] = symbolStringify(ret[key]);
      }
    });
    return ret;
  }
  return obj;
}

function toJSON(data) {
  if (Array.isArray(data)) {
    return data.map(item => item.toJSON());
  }
  return data.toJSON();
}

function toInstances(model, data) {
  if (Array.isArray(data)) {
    return data.map(item => toInstance(model, item));
  }
  return toInstance(model, data);
}

function toInstance(model, data) {
  if (!data) {
    return data;
  }
  let include = [];
  if (model.associations) {
    include = loadAssociations(model);
  }
  const instance = model.build(data, { isNewRecord: false, include });
  if (data.updatedAt) {
    instance.setDataValue('updatedAt', data.updatedAt);
  }
  if (data.createdAt) {
    instance.setDataValue('createdAt', data.createdAt);
  }
  if (data.deletedAt) {
    instance.setDataValue('deletedAt', data.deletedAt);
  }
  return instance;
}

function loadAssociations(model) {
  const associations = [];
  Object.keys(model.associations).forEach(key => {
    //  model.associations[key] does not work on include, we grab it from sequelize.model()
    if (model.associations[key].hasOwnProperty('options')) {
      const modelName = model.associations[key].target.name;
      associations.push({
        model: model.sequelize.model(modelName),
        as   : key,
      });
    }
  });
  return associations;
}
