var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
function validation(ctx) {
  var body = ctx.sanitizeBody('testparam').whitelist(['a', 'b', 'c']);
  var query = ctx.sanitizeQuery('testparam').whitelist(['a', 'b', 'c']);

  ctx.body = { query: query, body: body };
}

function pass(body) {

  if (body.query) {
    expect(body).to.have.property('query', 'abc');
  }

  if (body.body) {
    expect(body).to.have.property('body', 'abc');
  }

}
function fail(body) {
  expect(body).not.to.have.deep.property('params.testparam');
  expect(body).not.to.have.deep.property('query.testparam');
}

function getRoute(path, test, done) {
  request(app)
    .get(path)
    .end(function(err, res) {
      test(res.body);
      done();
    });
}

function postRoute(path, data, test, done) {
  request(app)
    .post(path)
    .send(data)
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

describe('#sanitizers (check results)', function() {
  describe('GET tests', function() {
    it('should return property and sanitized value when param is present', function(done) {
      getRoute('/abcdef', pass, done);
    });
    it('should not return property when query and param is missing', function(done) {
      getRoute('/', fail, done);
    });

    it('should return both query and param and sanitized values when they are both present', function(done) {
      getRoute('/abcdef?testparam=abcdef', pass, done);
    });

  });
  describe('POST tests', function() {
    it('should return property and sanitized value when param is present', function(done) {
      postRoute('/abcdef', null, pass, done);
    });

    it('should return both query and param and sanitized values when they are both present', function(done) {
      postRoute('/abcdef?testparam=abcdef', { testparam: '    abcdef     ' }, pass, done);
    });

    it('should return property and sanitized value when body is present', function(done) {
      postRoute('/', { testparam: '     abcdef     ' }, pass, done);
    });

  });
});
