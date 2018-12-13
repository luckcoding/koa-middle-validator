var Koa = require('koa');
var bodyParser = require('koa-bodyparser');
var convert = require('koa-convert');
var Router = require('koa-router');
var _ = require('lodash')
var koaValidator = require('../../index');

var app = new Koa();
var router = new Router();

app.use(convert(bodyParser()));
app.use(koaValidator({
  customValidators: {
    isArray: function(value) {
      return _.isArray(value);
    },
    isAsyncTest: function(testparam) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          if (testparam === '42') { return resolve(); }
          reject();
        }, 200);
      });
    }
  },
  customSanitizers: {
    toTestSanitize: function() {
      return "!!!!";
    }
  }
}));

module.exports = function (validation) {
  router.get(/\/test(\d+)/, validation);
  router.get('/:testparam?', validation);
  router.post('/:testparam?', validation);
  app.use(router.routes())
  app.use(router.allowedMethods({
    throw: true
  }))

  return app;
};

