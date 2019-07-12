'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const data = { id: 1, name: 'testman' };
    this.ctx.body = data.name;
  }
}

module.exports = HomeController;
