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
      host    : '*****',
      port    : 6379,
      password: '*****',
      db      : 10,
    },
    cache: {
      host    : '*****',
      port    : 6379,
      password: '*****',
      db      : 11,
    },
  },
};