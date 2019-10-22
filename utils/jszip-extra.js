'use strict';
/* eslint-disable no-shadow */

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { Stream } = require('stream');
const request = require('request');

/**
 * JSZip 扩展
 * @class JSZipExtra
 * @extends {JSZip}
 */
class JSZipExtra extends JSZip {
  constructor() {
    super();
    this.clone = function() {
      const newObj = new JSZipExtra();
      for (const i in this) {
        if (typeof this[i] !== 'function') {
          newObj[i] = this[i];
        }
      }
      return newObj;
    };
  }

  /**
   * 以数组的方式 push [多个]文件进压缩包中
   * @param {string[] | string} filePathList 文件路径[列表]
   * @memberof JSZipExtra
   */
  async push(filePathList) {
    if (!Array.isArray(filePathList)) {
      filePathList = [filePathList];
    }
    for (let i = 0; i < filePathList.length; i++) {
      let filePath = filePathList[i];
      if (!(typeof filePath === 'object') || filePath instanceof Stream) {
        if (filePath instanceof Stream) {
          filePath = { name: path.pathname(filePath.path), path: filePath };
        } else {
          filePath = { name: path.pathname(filePath), path: filePath };
        }
      }
      if (filePath && filePath.name && filePath.path) {
        if (filePath.path instanceof Stream) {
          this.file(filePath.name, filePath.path);
        } else if (fs.existsSync(filePath.path)) {
          this.file(filePath.name, fs.createReadStream(filePath.path));
        }
      }
    }
  }

  /**
   * 以数组的方式 push [多个]远程文件进压缩包中
   * @param { (string|Stream)[]} urlPathList 文件路径[列表]
   * @memberof JSZipExtra
   */
  async pushUrl(urlPathList) {
    if (!Array.isArray(urlPathList)) {
      urlPathList = [urlPathList];
    }
    for (let i = 0; i < urlPathList.length; i++) {
      let urlPathInfo = urlPathList[i];
      if (!(typeof urlPathInfo === 'object') || urlPathInfo instanceof Stream) {
        if (urlPathInfo instanceof Stream) {
          urlPathInfo = { name: path.pathname(urlPathInfo.path), url: urlPathInfo };
        } else {
          urlPathInfo = { name: path.pathname(urlPathInfo), url: urlPathInfo };
        }
      }
      if (urlPathInfo && urlPathInfo.name && urlPathInfo.url) {
        if (!(urlPathInfo.url instanceof Stream)) {
          urlPathInfo.url = request(urlPathInfo.url);
        }
        this.file(urlPathInfo.name, urlPathInfo.url);
      }
    }
  }
}

module.exports = JSZipExtra;
