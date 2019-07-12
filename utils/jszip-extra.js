/**
 * JSZip 扩展
 */
'use strict';
/* eslint-disable no-shadow */

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { Stream } = require('stream');
const request = require('request');

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
