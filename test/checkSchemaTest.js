var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
var errorMsg = 'Parameter is not an integer.';
var errorMsgOutOfRange = 'Parameter is out of range or not int.';

// There are three ways to pass parameters to express:
// - as part of the URL
// - as GET parameter in the querystring
// - as POST parameter in the body
// These test show that req.checkParams are only interested in req.params values, all other
// parameters will be ignored.

var schema = {
  testparam: {
    in: 'params',
    notEmpty: true,
    isInt: {
      errorMessage: errorMsg
    }
  },
  testheader: {
    in: 'headers',
    notEmpty: true,
    isInt: {
      errorMessage: errorMsg
    }
  },
  testquery: {
    in: 'query',
    notEmpty: true,
    isInt: {
      options: [{
        min: 2,
        max: 10
      }],
      errorMessage: errorMsgOutOfRange
    }
  },
  'skipped': {
    // this validator is a fake validator which cannot raise any error, should be always skipped
    in: 'notSupportedOne',
    notEmpty: true,
    isInt: {
      options: [{
        min: 2,
        max: 10
      }],
      errorMessage: errorMsgOutOfRange
    }
  },
  'numInQuery': {
    notEmpty: true,
    isInt: {
      options: [{
        min: 0,
        max: 665
      }],
      errorMessage: errorMsgOutOfRange
    }
  }
};

function validationSendResponse(ctx) {
  var errors = ctx.validationErrors();
  if (errors) {
    return ctx.body = errors;
  }

  ctx.body = {
    testheader: ctx.headers.testheader,
    testparam: ctx.params.testparam,
    testquery: ctx.request.query.testquery,
    skipped: ctx.request.query.skipped,
    numInQuery: ctx.request.query.numInQuery
  };
}

function validation(req, res) {

  req.check(schema);
  validationSendResponse(req, res);
}

function validationQuery(req, res) {

  req.checkQuery(schema);
  validationSendResponse(req, res);
}

function validationParams(req, res) {

  req.checkParams(schema);
  validationSendResponse(req, res);
}

function validationBody(req, res) {

  req.checkBody(schema);
  validationSendResponse(req, res);
}

function validationHeaders(req, res) {

  req.checkHeaders(schema);
  validationSendResponse(req, res);
}

function failParams(body, length) {
  expect(body).to.have.length(length);
  expect(body[0]).to.have.property('msg', errorMsg);
}

function failQuery(body, length) {
  expect(body).to.have.length(length);
  expect(body[0]).to.have.property('msg', errorMsgOutOfRange);
}

function failAll(body, length) {
  expect(body).to.have.length(length);
  expect(body[0]).to.have.property('msg', errorMsg);
  expect(body[1]).to.have.property('msg', errorMsgOutOfRange);
}

function pass(params) {
  expect(params).to.have.property('testheader', '45');
  expect(params).to.have.property('testparam', '25');
  expect(params).to.have.property('testquery', '6');
  expect(params).to.have.property('skipped', '34');
  expect(params).to.have.property('numInQuery', '0');
}

function failQueryParams(params, length) {
  expect(params).to.have.length(length);
  expect(params[0]).to.have.property('msg', 'Invalid param');
  expect(params[1]).to.have.property('msg', errorMsgOutOfRange);
}

function getRoute(path, headers, test, length, done) {
  request(app)
    .get(path)
    .set(headers || {})
    .end(function(err, res) {
      test(res.body, length);
      done();
    });
}

describe('Check defining validator location inside schema validators', function() {

  // This before() is required in each set of tests in
  // order to use a new validation function in each file
  before(function() {
    delete require.cache[require.resolve('./helpers/app')];
    app = require('./helpers/app')(validation).listen();
  });

  it('should validate against schema with query and params locations', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=0', { testheader: 45 }, pass, 1, done);
  });

  it('should fail when param is not integer', function(done) {
    getRoute('/ImNot?testquery=6&skipped=34&numInQuery=0', { testheader: 45 }, failParams, 1, done);
  });

  it('should fail when query param is out of range', function(done) {
    getRoute('/25?testquery=20&skipped=34&numInQuery=0', { testheader: 45 }, failQuery, 1, done);
  });

  it('should fail when non of params are valid', function(done) {
    getRoute('/ImNot?testquery=20&skipped=34&numInQuery=0', { testheader: 45 }, failAll, 2, done);
  });

});

describe('Check defining validator location inside schema validators by checkQuery()', function() {

  // This before() is required in each set of tests in
  // order to use a new validation function in each file
  before(function() {
    delete require.cache[require.resolve('./helpers/app')];
    app = require('./helpers/app')(validationQuery).listen();
  });

  it('should validate against schema with query and params locations', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=0', { testheader: 45 }, pass, 1, done);
  });

  it('should fail when query param is out of range', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=666', { testheader: 45 }, failQuery, 1, done);
  });

});

describe('Check defining validator location inside schema validators by checkParams()', function() {

  // This before() is required in each set of tests in
  // order to use a new validation function in each file
  before(function() {
    delete require.cache[require.resolve('./helpers/app')];
    app = require('./helpers/app')(validationParams).listen();
  });

  it('should fail when searching for query param in the path params', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=666', { testheader: 45 }, failQueryParams, 2, done);
  });

});

describe('Check defining validator location inside schema validators by checkBody()', function() {

  // This before() is required in each set of tests in
  // order to use a new validation function in each file
  before(function() {
    delete require.cache[require.resolve('./helpers/app')];
    app = require('./helpers/app')(validationBody).listen();
  });

  it('should fail when searching for query param in the body', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=666', { testheader: 45 }, failQueryParams, 2, done);
  });

});

describe('Check defining validator location inside schema validators by checkHeaders()', function() {

  // This before() is required in each set of tests in
  // order to use a new validation function in each file
  before(function() {
    delete require.cache[require.resolve('./helpers/app')];
    app = require('./helpers/app')(validationHeaders).listen();
  });

  it('should fail when searching for query param in the headers', function(done) {
    getRoute('/25?testquery=6&skipped=34&numInQuery=1', { testheader: 45 }, failQueryParams, 2, done);
  });

});