var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
var errorMessage = 'valid email required';

function validation(ctx) {
  ctx.assert('email', 'required').notEmpty();
  ctx.assert('email', errorMessage).isEmail();

  var errors = ctx.validationErrors(true);
  if (errors) {
    return ctx.body = errors;
  }
  ctx.body = { email: ctx.request.query.email || ctx.request.body.email };
}

function fail(body) {
  expect(body).to.have.deep.property('email.msg', errorMessage);
}

function pass(body) {
  expect(body).to.have.property('email', 'test@example.com');
}

function testRoute(path, data, test, done) {
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

describe('#validationErrors(true)', function() {
  it('should return a success when the correct data is passed on the body', function(done) {
    testRoute('/', { email: 'test@example.com' }, pass, done);
  });

  it('should return a mapped error object with each failing param as a property data is invalid', function(done) {
    testRoute('/path', { email: 'incorrect' }, fail, done);
  });
});