const _ = require('lodash')
const app = require('./app')(function validation(ctx) {
  ctx.sanitizeParams('testparam').whitelist(['a', 'b', 'c']);
  ctx.body = { params: ctx.params };
}).listen(8888);

module.exports = app;