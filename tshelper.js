'use strict';
/* eslint-disable no-shadow */
const path = require('path');
const os = require('os');
const fs = require('fs');

module.exports = {
  watchDirs: {
    config: {
      directory: 'config',
      interface: 'EggAppConfig',
      generator: configGenerator,
    },
    controller: {
      directory: 'app/controller',
      interface: 'IController',
      generator: baseGenerator('Controller'),
    },
    service: {
      directory: 'app/service',
      interface: 'IService',
      generator: baseGenerator('service'),
    },
    model: {
      directory: 'app/model',
      interface: 'IModel',
      generator: baseGenerator('model', 'ReturnType<typeof {{ 0 }}>'),
    },
    middleware: {
      directory: 'app/middleware',
      interface: 'IMiddleware',
      generator: baseGenerator('middleware', 'typeof {{ 0 }}'),
    },
    IOController: {
      directory: 'app/io/controller',
      interface: 'CustomController',
      generator: baseGenerator('IOController'),
    },
    IOMiddleware: {
      directory: 'app/io/middleware',
      interface: 'CustomMiddleware',
      generator: baseGenerator('IOMiddleware', 'typeof {{ 0 }}'),
    },
  },
};

// generator for controller service
function baseGenerator(type, interfaceHandle) {
  interfaceHandle = strToFn(interfaceHandle);
  return function generator(config, baseConfig) {
    if (!config.fileList.length) {
      return { dist: path.join(config.dtsDir, 'index.d.ts') };
    }

    let importStr = '';
    const map = {};

    config.fileList.forEach(f => {
      const { props, moduleName: sModuleName } = getModuleObjByPath(f);
      const moduleName = `Export${sModuleName}`;
      const importContext = getImportStr(
        config.dtsDir,
        path.join(config.dir, f),
        moduleName
      );

      importStr += `${importContext}\n`;

      const fileNameSplit = f.split('/');
      let mapTemp = map;
      fileNameSplit.forEach((fns, idx) => {
        const docIdx = fns.lastIndexOf('.');
        let key = docIdx > 0 ? fns.substring(0, docIdx) : fns;
        key = camelProp(key, config.caseStyle || baseConfig.caseStyle);
        if (idx === fileNameSplit.length - 1) {
          mapTemp[key] = interfaceHandle ? interfaceHandle(moduleName) : moduleName;
        } else {
          if (!mapTemp[key]) {
            mapTemp[key] = {};
          }
          if (typeof mapTemp[key] === 'string') {
            mapTemp[key] = {
              __this: mapTemp[key],
            };
          }
          mapTemp = mapTemp[key];
        }
      });
    });
    const interfaceStr = getInterfaceStr(type, 'i', config.interface, map);

    return {
      dist   : path.join(config.dtsDir, 'index.d.ts'),
      content:
      `${`${importStr}\n`
      + `declare module '${config.framework || baseConfig.framework}' {\n`}${
        interfaceStr ? `${interfaceStr}` : ''
      }}\n`,
    };
  };
}

// generator for config
function configGenerator(config, baseConfig) {
  if (!config.fileList.length) {
    return { dist: path.join(config.dtsDir, 'index.d.ts') };
  }
  const cwd = baseConfig.cwd;

  const localFullConfig = {};
  // eslint-disable-next-line global-require
  const projectPackageInfo = require(path.join(cwd, './package.json'));

  let importStr = '';
  let typeStr = '';
  const sModuleNameList = [];
  config.fileList.forEach((file, idx) => {
    if (path.extname(file) !== '.js' || file.indexOf('config.') === -1) {
      return;
    }

    const { props, moduleName: sModuleName } = getModuleObjByPath(file);
    const moduleName = `Export${sModuleName}`;
    const importContext = getImportStr(
      config.dtsDir,
      path.join(config.dir, file),
      moduleName
    );
    sModuleNameList.push(sModuleName);

    importStr += `${importContext}\n`;

    let type = 'EXPORT';

    const p = path.join(config.dir, file);
    let conf = {};
    if (fs.existsSync(p)) {
      // eslint-disable-next-line global-require
      const confModule = require(p);
      conf = confModule;
      if (typeof confModule === 'function') {
        type = 'EXPORT_DEFAULT_FUNCTION';
        conf = confModule({
          pkg    : projectPackageInfo,
          name   : projectPackageInfo.name,
          baseDir: cwd,
          env    : 'local',
          HOME   : os.homedir(),
          root   : cwd,
        });
      }
    }
    defaultDeep(localFullConfig, conf);

    let tds = `type ${sModuleName} = `;
    if (type === 'EXPORT_DEFAULT_FUNCTION') {
      tds += `ReturnType<typeof ${moduleName}>;`;
    } else if (type === 'EXPORT') {
      tds += `typeof ${moduleName};`;
    }
    typeStr += `${tds}\n`;
  });
  typeStr += `type Config = ${sModuleNameList.join(' & ')};\n`;
  mapValue2Type(localFullConfig);
  const interfaceStr = getInterfaceStr('Config', 'i', config.interface, localFullConfig);

  return {
    dist   : path.join(config.dtsDir, 'index.d.ts'),
    content:
    `${`${importStr}\n`
    + `${typeStr}\n`
    + `declare module '${config.framework || baseConfig.framework}' {\n`}${
      interfaceStr ? `${interfaceStr}` : ''
    }}\n`,
  };

  function mapValue2Type(map, prefix) {
    prefix = prefix || [];
    for (const k in map) {
      const keyPath = prefix.concat(k);
      const v = map[k];
      if (v && isNode(v)) {
        mapValue2Type(v, keyPath);
      } else if (typeof v === 'function') {
        const func = v.toString();
        // const match = func.match(/^\s*(?:function)?\s*\(([^\)]*)\)\s*(?:=>)?|^\s*(\w+)\s*=>/);
        // let args = [];
        // if (match) {
        //   args = (match[1] || match[2] || '').split(',');
        // }
        map[k] = {
          // __this   : `function(${args})`,
          __this   : `Config['${keyPath.join('\'][\'')}']`,
          __comment: func,
        };
      } else {
        map[k] = {
          // __this   : typeof v,
          __this   : `Config['${keyPath.join('\'][\'')}']`,
          __comment: JSON.stringify(v),
        };
      }
    }
  }
}

// get import context
function getImportStr(from, to, moduleName, importStar) {
  const extname = path.extname(to);
  const toPathWithoutExt = to.substring(0, to.length - extname.length);
  const importPath = path.relative(from, toPathWithoutExt).replace(/\/|\\/g, '/');
  const isTS = extname === '.ts' || fs.existsSync(`${toPathWithoutExt}.d.ts`);
  const importStartStr = isTS && importStar ? '* as ' : '';
  const fromStr = isTS ? `from '${importPath}'` : `= require('${importPath}')`;
  return `import ${importStartStr}${moduleName} ${fromStr};`;
}

// get interface context
function getInterfaceStr(type, namePrefix, interfaceName, interfaceMapData) {
  let ret = `  interface ${interfaceName} {\n`;

  for (let key in interfaceMapData) {
    const data = interfaceMapData[key];
    if (!/^\w+$/.test(key)) {
      key = `'${key}'`;
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataInterfaceName = [namePrefix, key, type].map(prop => camelProp(prop, 'upper')).join('');
      if (data.__this) {
        if (data.__comment) {
          ret += `    /** ${data.__comment} */\n`;
        }
        delete data.__comment;
        const __this = data.__this;
        delete data.__this;
        if (Object.keys(data).length) {
          ret += `    ${key}: ${dataInterfaceName} & ${__this};\n`;
        } else {
          ret += `    ${key}: ${__this};\n`;
        }
      } else {
        ret += `    ${key}: ${dataInterfaceName};\n`;
      }
    } else {
      // typeof data === string
      ret += `    ${key}: ${data};\n`;
    }
  }
  ret += '  }\n';

  for (const key in interfaceMapData) {
    const data = interfaceMapData[key];
    if (isNode(data)) {
      const prefix = [namePrefix, key].map(prop => camelProp(prop, 'upper')).join('');
      const dataInterfaceName = [namePrefix, key, type].map(prop => camelProp(prop, 'upper')).join('');
      ret += `\n${getInterfaceStr(type, prefix, dataInterfaceName, data)}`;
    }
  }

  return ret;
}

// get moduleName by file path
function getModuleObjByPath(f) {
  const props = f.substring(0, f.lastIndexOf('.')).split('/');

  // composing moduleName
  const moduleName = props.map(prop => camelProp(prop, 'upper')).join('');

  return {
    props,
    moduleName,
  };
}

// format property
function formatProp(prop) {
  return prop.replace(/[._-][a-z]/gi, s => s.substring(1).toUpperCase());
}

// like egg-core/file-loader
function camelProp(property, caseStyle) {
  if (typeof caseStyle === 'function') {
    return caseStyle(property);
  }

  // camel transfer
  property = formatProp(property);
  let first = property[0];
  // istanbul ignore next
  switch (caseStyle) {
    case 'lower':
      first = first.toLowerCase();
      break;
    case 'upper':
      first = first.toUpperCase();
      break;
    case 'camel':
      break;
    default:
      break;
  }

  return first + property.substring(1);
}

// convert string to function
function strToFn(fn) {
  if (typeof fn === 'string') {
    return (...args) => fn.replace(/{{\s*(\d+)\s*}}/g, (_, index) => args[index]);
  }
  return fn;
}

function defaultDeep(target, ...args) {
  let i = 0;
  if (isPrimitive(target)) target = args[i++];
  if (!target) target = {};
  for (; i < args.length; i++) {
    if (isObject(args[i])) {
      for (const key of Object.keys(args[i])) {
        if (isValidKey(key)) {
          // eslint-disable-next-line max-depth
          if (isObject(target[key]) && isObject(args[i][key])) {
            defaultDeep(target[key], args[i][key]);
          } else if (target[key] === undefined) {
            target[key] = args[i][key];
          }
        }
      }
    }
  }
  return target;
}

function isNode(data) {
  return typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length;
}

function isValidKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}
function isObject(val) {
  return typeof val === 'function' || toString.call(val) === '[object Object]';
}
function isPrimitive(val) {
  return typeof val === 'object' ? val === null : typeof val !== 'function';
}
