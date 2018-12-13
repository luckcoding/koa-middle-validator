var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
var emailErrorMessage = '%0 is not a valid email';
var dateErrorMessage = '%0 is not before %1';
var beforeDate = '2016-01-01';

function validation(ctx) {
  ctx.assert('email', emailErrorMessage).isEmail();
  ctx.assert('date', dateErrorMessage).isBefore(beforeDate);

  var errors = ctx.validationErrors(true);
  if (errors) {
    return ctx.body = errors;
  }
  ctx.body = {
    email: ctx.request.query.email || ctx.request.body.email,
    date: ctx.request.query.date || ctx.request.body.date
  };
}

function fail(body) {
  expect(body).to.have.deep.property('email.msg', emailErrorMessage.replace('%0', body.email.value));
  expect(body).to.have.deep.property('date.msg', dateErrorMessage.replace('%0', body.date.value).replace('%1', beforeDate));
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

describe('Error message string formatting', function() {
  it('should return a mapped error object with a properly formatted error message', function(done) {
    testRoute('/path', { email: 'incorrect', date: '2016-12-31' }, fail, done);
  });
});