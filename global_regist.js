'use strict';

// 注册全局变量
/* eslint-disable */

global._        = require('lodash');
global.NonError = require('./lib/non-error');

const Sequelzie  = require('sequelize');
global.Sequelzie = Sequelzie;
global.Op        = Sequelzie.Op;
