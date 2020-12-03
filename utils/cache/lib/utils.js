'use strict';

module.exports = {
  convertObjectToArray,
  convertMapToArray,
  isJSON,
};

/**
 * Convert an object to an array
 *
 * @param {Object} obj -
 * @returns {Array}
 * @example
 * ```js
 * > convertObjectToArray({ a: '1' })
 * ['a', '1']
 * ```
 */
function convertObjectToArray(obj) {
  const result = [];
  const keys = Object.keys(obj);
  for (let i = 0, l = keys.length; i < l; i++) {
    result.push(keys[i], obj[keys[i]]);
  }
  return result;
}

/**
 * Convert a map to an array
 *
 * @param {Map} map -
 * @returns {Array}
 * @example
 * ```js
 * > convertObjectToArray(new Map([[1, '2']]))
 * [1, '2']
 * ```
 */
function convertMapToArray(map) {
  const result = [];
  let pos = 0;
  map.forEach(function(value, key) {
    result[pos] = key;
    result[pos + 1] = value;
    pos += 2;
  });
  return result;
}

/**
 * Check json string
 *
 * @param {string} str -
 * @returns {boolean}
 * ```
 */
function isJSON(str) {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      if (typeof obj === 'object' && obj) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  return false;
}
