'use strict';

// had enabled by egg
exports.static = true;

// nunjucks
exports.nunjucks = {
  enable : true,
  package: 'egg-view-nunjucks',
};

// router
exports.routerPlus = {
  enable : true,
  package: 'egg-router-plus',
};

// sequelize
exports.sequelize = {
  enable : true,
  package: 'egg-sequelize',
};

exports.sessionRedis = {
  enable : true,
  package: 'egg-session-redis',
};

exports.redis = {
  enable : true,
  package: 'egg-redis',
};

exports.cors = {
  enable : true,
  package: 'egg-cors',
};

exports.passport = {
  enable : true,
  package: 'egg-passport',
};

exports.bcrypt = {
  enable : true,
  package: 'egg-bcrypt',
};

exports.valparams = {
  enable : true,
  package: 'egg-valparams',
};
