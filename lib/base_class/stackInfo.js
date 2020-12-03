/**
 * 堆栈信息工具
 */
'use strict';

module.exports = {
  /**
   * 获取堆栈信息
   * @param {number} stackIndex 指定下表，不传则返回堆栈信息列表
   * @returns {Array<Object>|Object} { fileName, lineNumber, columnNumber }
   */
  get(stackIndex) {
    const limit = Error.stackTraceLimit;
    const prep = Error.prepareStackTrace;

    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = 10;

    // capture the stack
    const obj = {};
    Error.captureStackTrace(obj);
    let ret;
    if (stackIndex && stackIndex >= 0) {
      const callSite = obj.stack[stackIndex];
      if (callSite) {
        ret = {
          fileName    : callSite.getFileName(),
          lineNumber  : callSite.getLineNumber(),
          columnNumber: callSite.getColumnNumber(),
        };
      }
    } else {
      ret = [];
      for (let i = 0; i < obj.stack.length; i++) {
        const callSite = obj.stack[i];
        ret.push({
          fileName    : callSite.getFileName(),
          lineNumber  : callSite.getLineNumber(),
          columnNumber: callSite.getColumnNumber(),
        });
      }
    }
    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;

    return ret;
  },

  /**
   * 查找符合条件的堆栈信息
   * @param {RegExp} reg 正则表达式(条件)
   * @returns {Object} { fileName, lineNumber, columnNumber }
   */
  find(reg) {
    const stackInfoList = this.get();
    let ret;
    for (let i = 0; i < stackInfoList.length; i++) {
      if (reg.test(stackInfoList[i].fileName)) {
        ret = stackInfoList[i];
        break;
      }
    }
    return ret;
  },

  /**
   * 查找所有符合条件的堆栈信息
   * @param {RegExp} reg 正则表达式(条件)
   * @returns {Array<Object>} [{ fileName, lineNumber, columnNumber }]
   */
  findAll(reg) {
    const stackInfoList = this.get();
    const ret = [];
    for (let i = 0; i < stackInfoList.length; i++) {
      if (reg.test(stackInfoList[i].fileName)) {
        ret.push(stackInfoList[i]);
      }
    }
    return ret;
  },
};

/**
 * Capture call site stack from v8.
 * https://github.com/v8/v8/wiki/Stack-Trace-API
 */

function prepareObjectStackTrace(obj, stack) {
  return stack;
}
