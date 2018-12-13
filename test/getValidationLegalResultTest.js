var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;

var bodyErrorMessage = 'body is not 42';
var queryErrorMessage = 'query is not 42';
var paramErrorMessage = 'param is not 42';

var invalidOptionalValue = 'aa';

function validation(ctx) {
  ctx.checkBody({
    testbody: {
      optional: true,
      isInt: true,
      errorMessage: bodyErrorMessage
    },
  });
  ctx.checkQuery({
    testquery: {
      optional: true,
      isInt: true,
      errorMessage: queryErrorMessage
    },
  });
  ctx.checkParams({
    testparam: {
      optional: true,
      isInt: true,
      errorMessage: paramErrorMessage
    },
  });

  return ctx.getValidationLegalResult().then(function(input) {
    ctx.body = input;
  }).catch(function(errors) {
    ctx.body = errors;
  });
}

function fail(body, names) {
  names.forEach(function (name) {
    switch (name) {
      case 'testbody':
        expect(body).to.deep.include({ msg: bodyErrorMessage, param: 'testbody', value: invalidOptionalValue });
        break;
      case 'testquery':
        expect(body).to.deep.include({ msg: queryErrorMessage, param: 'testquery', value: invalidOptionalValue });
        break;
      case 'testparam':
        expect(body).to.deep.include({ msg: paramErrorMessage, param: 'testparam', value: invalidOptionalValue });
        break;
      default:
        return;
    }
  })
}

function pass(body, names) {
  names.forEach(function (name) {
    switch (name) {
      case 'testbody':
        expect(body).to.have.property('testbody', '42');
        break;
      case 'testquery':
        expect(body).to.have.property('testquery', '42');
        break;
      case 'testparam':
        expect(body).to.have.property('testparam', '42');
        break;
      default:
        return;
    }
  })
}


function postRoute(path, data, test, names, done) {
  request(app)
    .post(path)
    .send(data)
    .end(function(err, res) {
      test(res.body, names);
      done();
    });
}

before(function() {
  delete require.cache[require.resolve('./helpers/app')];
  app = require('./helpers/app')(validation).listen();
});

describe('#getValidationLegalResultTest()', function() {
  it('should return a success whit all parameters empty', function(done) {
    postRoute('/', {}, fail, [], done);
  });

  it('should return an error when unrelated param', function(done) {
    postRoute('/' + invalidOptionalValue, {}, fail, ['testparam'], done);
  });

  it('should return an error when unrelated body', function(done) {
    postRoute('/42?testquery=42', { testbody: invalidOptionalValue }, fail, ['testbody'], done);
  });

  it('should return a success whit all parameters sent', function(done) {
    postRoute('/42?testquery=42', { testbody: '42' }, pass, ['testbody','testquery','testparam'], done);
  });
});
