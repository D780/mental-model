# mental-model

自用 egg.js 框架

## QuickStart

```bash
$ npm install
$ npm test
```

publish your framework to npm, then change app's dependencies:

```js
// {app_root}/index.js
require('../').startCluster({
  baseDir: __dirname,
  // port: 9000, // default to 9000
});

```
