'use strict';

const path = require('path');
const egg = require('egg');
const EGG_PATH = Symbol.for('egg#eggPath');

const BaseController = require('./base_class/base_controller');
const BaseService = require('./base_class/base_service');

class Application extends egg.Application {
  get [EGG_PATH]() {
    return path.dirname(__dirname);
  }
}

class Agent extends egg.Agent {
  get [EGG_PATH]() {
    return path.dirname(__dirname);
  }
}

module.exports = Object.assign(egg, {
  Application,
  Agent,
  BaseController,
  BaseService,
});
