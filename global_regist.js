'use strict';

// 注册全局变量
/* eslint-disable */

global.Promise  = require('bluebird');
global.fs       = require('fs-extra');
global._        = require('lodash');
global.NonError = require('./lib/non-error');

const Sequelzie  = require('sequelize');
global.Sequelzie = Sequelzie;
global.Op        = Sequelzie.Op;
