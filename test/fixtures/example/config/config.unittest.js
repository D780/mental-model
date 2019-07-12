'use strict';

exports.keys = '123456';

exports.sequelize = {
  dialect : 'mysql',
  database: '780',
  host    : 'localhost',
  port    : '3306',
  username: 'root',
  password: '123456',
};

exports.redis = {
  clients: {
    session: {
      host    : '10.32.64.232',
      port    : 6379,
      password: 'duoyi@2016',
      db      : 10,
    },
    cache: {
      host    : '10.32.64.232',
      port    : 6379,
      password: 'duoyi@2016',
      db      : 11,
    },
  },
};