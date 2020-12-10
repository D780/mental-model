'use strict';

const SequelizeLogger = require('./utils/sequelize-logger');

class AgentBootHook {
  /**
   * @param {Egg.Agent} agent - agent
   */
  constructor(agent) {
    this.agent = agent;
  }

  configWillLoad() {
    const { agent } = this;

    if (agent.config.sequelize) {
      if (agent.config.sequelize.logging || agent.config.sequelize.logging === undefined) {
        agent.config.sequelize.logging = SequelizeLogger(agent, '[agent]');
      }
    }
  }

  async willReady() {
    const { agent } = this;
    await agent.model.sync({ force: agent.config.env === 'unittest' });
  }
}

module.exports = AgentBootHook;
