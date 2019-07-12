'use strict';

/* eslint-disable no-shadow  */

module.exports = class NonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonError';
  }
};
