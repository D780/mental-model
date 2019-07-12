'use strict';

const moment = require('moment');

// 格式化时间
exports.formatTime = time => moment(time).format('YYYY-MM-DD hh:mm:ss');
