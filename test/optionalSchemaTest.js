var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
var errorMessage = 'Parameter is not an integer';

function validation(ctx) {
  ctx.assert({
    'optional_param': {
      isInt: {
        errorMessage: errorMessage
      },
      optional: true
    }
  });

  ctx.assert({
    'optional_falsy_param': {
      optional: {
        options: [{ checkFalsy: true }]
      },
      isInt: {
        errorMessage: errorMessage
      }
    }
  });

  ctx.assert({
    'optional_falsy_param_array': {
      optional: {
        options: { checkFalsy: true }
      },
      isInt: {
        errorMessage: errorMessage
      }
    }
  });

  var errors = ctx.validationErrors();
  if (errors) {
    return ctx.body = errors;
  }
  ctx.body = { result: 'OK' };
}

function fail(body) {
  expect(body).to.have.length(1);
  expect(body[0]).to.have.property('msg', errorMessage);
}

function pass(body) {
  expect(body).to.have.property('result', 'OK');
}

function testRoute(path, test, done) {
  request(app)
    .get(path)
    .end(function(err, res) {
      test(res.body);
      done();
    });
}

// This before() is required in each set of tests in
// order to use a new validation function in each file
before(function() {
  delete require.cache[require.resolve('./helpers/app')];
  app = require('./helpers/app')(validation).listen();
});

// TODO: Don't know if all of these are necessary, but we do need to test body and header
describe('#optionalSchema()', function() {
  it('should return a success when there is an empty route', function(done) {
    testRoute('/', pass, done);
  });

  it('should return a success when there are no params on a route', function(done) {
    testRoute('/path', pass, done);
  });

  it('should return a success when the non-optional param is present', function(done) {
    testRoute('/path?other_param=test', pass, done);
  });

  it('should return an error when param is provided, but empty', function(done) {
    testRoute('/path?optional_param', fail, done);
  });

  it('should return an error when param is provided with equals sign, but empty', function(done) {
    testRoute('/path?optional_param=', fail, done);
  });

  it('should return an error when param is provided, but fails validation', function(done) {
    testRoute('/path?optional_param=test', fail, done);
  });

  it('should return a success when param is provided and validated', function(done) {
    testRoute('/path?optional_param=123', pass, done);
  });

  it('should return a success when the optional falsy param is present, but false, defined via options array', function(done) {
    testRoute('/path?optional_falsy_param_array=', pass, done);
  });

  it('should return an error when the optional falsy param is present, but does not pass, defined via options array', function(done) {
    testRoute('/path?optional_falsy_param_array=hello', fail, done);
  });

  it('should return a success when the optional falsy param is present, but false', function(done) {
    testRoute('/path?optional_falsy_param=', pass, done);
  });

  it('should return an error when the optional falsy param is present, but does not pass', function(done) {
    testRoute('/path?optional_falsy_param=hello', fail, done);
  });
});
