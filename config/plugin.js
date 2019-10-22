'use strict';

/** @type {Egg.EggPlugin} */
const plugins = {
  // had enabled by egg
  static: true,

  // nunjucks
  nunjucks: {
    enable : true,
    package: 'egg-view-nunjucks',
  },

  // routerPlus
  routerPlus: {
    enable : true,
    package: 'egg-router-plus',
  },

  // sequelize
  sequelize: {
    enable : true,
    package: 'egg-sequelize',
  },

  // sessionRedis
  sessionRedis: {
    enable : true,
    package: 'egg-session-redis',
  },

  // redis
  redis: {
    enable : true,
    package: 'egg-redis',
  },

  // cors
  cors: {
    enable : true,
    package: 'egg-cors',
  },

  // passport
  passport: {
    enable : true,
    package: 'egg-passport',
  },

  // bcrypt
  bcrypt: {
    enable : true,
    package: 'egg-bcrypt',
  },

  // valparams
  valparams: {
    enable : true,
    package: 'egg-valparams',
  },
};

module.exports = plugins;
