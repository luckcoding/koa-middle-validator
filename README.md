# koa-middle-validator

[![npm version](https://img.shields.io/npm/v/koa-middle-validator.svg)](https://www.npmjs.com/package/koa-middle-validator)

Koa middleware for the validator module. Support v1 and v2.


## Installation

```
npm install koa-middle-validator
```

## Usage

```javascript
const util = require('util'),
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const convert = require('koa-convert');
const koaValidator = require('koa-middle-validator');
const Router = require('koa-router');
const _ = require('lodash');

const app = new Koa();
const router = new Router();

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
})); // this line must be immediately after any of the bodyParser middlewares!

router.get(/\/test(\d+)/, validation);
router.get('/:testparam?', validation);
router.post('/:testparam?', validation);
app.use(router.routes())
app.use(router.allowedMethods({
  throw: true
}))

function validation (ctx) {
  ctx.checkBody('postparam', 'Invalid postparam').notEmpty().isInt();
  //ctx.checkParams('urlparam', 'Invalid urlparam').isAlpha();
  ctx.checkQuery('getparam', 'Invalid getparam').isInt();


  ctx.sanitizeBody('postparam').toBoolean();
  //ctx.sanitizeParams('urlparam').toBoolean();
  ctx.sanitizeQuery('getparam').toBoolean();

  ctx.sanitize('postparam').toBoolean();

  return ctx.getValidationResult().then(function(result) {
    ctx.body = {
      //
    }
  });
}

app.listen(8888);
```

## Middleware Options

#### `errorFormatter`

_function(param,msg,value)_


#### `customValidators`

_{ "validatorName": function(value, [additional arguments]), ... }_


#### `customSanitizers`

_{ "sanitizerName": function(value, [additional arguments]), ... }_


## Validation

#### ctx.check();
```javascript
   ctx.check('testparam', 'Error Message').notEmpty().isInt();
   ctx.check('testparam.child', 'Error Message').isInt(); // find nested params
   ctx.check(['testparam', 'child'], 'Error Message').isInt(); // find nested params
```

#### ctx.assert();
Alias for [ctx.check()](#reqcheck).

#### ctx.validate();
Alias for [ctx.check()](#reqcheck).

#### ctx.checkBody();
Same as [ctx.check()](#reqcheck), but only looks in `ctx.body`.

#### ctx.checkQuery();
Same as [ctx.check()](#reqcheck), but only looks in `ctx.query`.

#### ctx.checkParams();
Same as [ctx.check()](#reqcheck), but only looks in `ctx.params`.

#### ctx.checkHeaders();
Only checks `ctx.headers`. This method is not covered by the general `ctx.check()`.

#### ~~ctx.checkCookies();~~
~~Only checks `ctx.cookies`. This method is not covered by the general `ctx.check()`.~~

## Validation by Schema

```javascript
ctx.checkBody({
 'email': {
    optional: {
      options: { checkFalsy: true } // or: [{ checkFalsy: true }]
    },
    isEmail: {
      errorMessage: 'Invalid Email'
    }
  },
  'password': {
    notEmpty: true,
    matches: {
      options: ['example', 'i'] // pass options to the validator with the options property as an array
      // options: [/example/i] // matches also accepts the full expression in the first parameter
    },
    errorMessage: 'Invalid Password' // Error message for the parameter
  },
  'name.first': { //
    optional: true, // won't validate if field is empty
    isLength: {
      options: [{ min: 2, max: 10 }],
      errorMessage: 'Must be between 2 and 10 chars long' // Error message for the validator, takes precedent over parameter message
    },
    errorMessage: 'Invalid First Name'
  }
});
```

You can also define a specific location to validate against in the schema by adding `in` parameter as shown below:

```javascript
ctx.check({
 'email': {
    in: 'query',
    notEmpty: true,
    isEmail: {
      errorMessage: 'Invalid Email'
    }
  }
});
```

ctx.check(schema);        // will check 'password' no matter where it is but 'email' in query params

ctx.checkQuery(schema);   // will check 'password' and 'email' in query params

ctx.checkBody(schema);    // will check 'password' in body but 'email' in query params

ctx.checkParams(schema);

ctx.checkHeaders(schema);  // will check 'password' in headers but 'email' in query params


## Validation result

### getValidationResult

Runs all validations and returns a validation result object for the errors gathered, for both sync and async validators.

```js
ctx.assert('email', 'required').notEmpty();
ctx.assert('email', 'valid email required').isEmail();
ctx.assert('password', '6 to 20 characters required').len(6, 20);

ctx.getValidationResult().then(function(result) {
  // do something with the validation result
  if (!errors.isEmpty()) {
    ctx.body = errors.array();
  } else {
    // ctx.body = {};
  }
});
```

### getValidationLegalResult (v1.1.0)

Runs all validations and return the validated values;

```js
  try {
    ctx.checkBody({})

    const values = await ctx.getValidationLegalResult()

    mongoose.model.save(values)
  } catch (e) {
    // $$emit error
  }
```

## Optional input

```javascript
ctx.checkBody('email').optional().isEmail();
//if there is no error, ctx.request.body.email is either undefined or a valid mail.
```

## Sanitizer

#### ctx.sanitize();
```javascript

ctx.request.body.comment = 'a <span>comment</span>';
ctx.request.body.username = '   a user    ';

ctx.sanitize('comment').escape(); // returns 'a &lt;span&gt;comment&lt;/span&gt;'
ctx.sanitize('username').trim(); // returns 'a user'

console.log(ctx.request.body.comment); // 'a &lt;span&gt;comment&lt;/span&gt;'
console.log(ctx.request.body.username); // 'a user'

```

#### ctx.filter();
Alias for [ctx.sanitize()](#reqsanitize).

#### ctx.sanitizeBody();
Same as [ctx.sanitize()](#reqsanitize), but only looks in `ctx.request.body`.

#### ctx.sanitizeQuery();
Same as [ctx.sanitize()](#reqsanitize), but only looks in `ctx.request.query`.

#### ctx.sanitizeParams();
Same as [ctx.sanitize()](#reqsanitize), but only looks in `ctx.params`.

#### ctx.sanitizeHeaders();
Only sanitizes `ctx.headers`. This method is not covered by the general `ctx.sanitize()`.

#### ~~ctx.sanitizeCookies();~~
~~Only sanitizes `ctx.cookies`. This method is not covered by the general `ctx.sanitize()`.~~

## Sanitizer result

### getSanitizerLegalResult (v1.1.0)

Runs all sanitizer and return the sanitized values;

```js
  try {
    ctx.sanitizeQuery('page').toInt()

    const values = await ctx.getSanitizerLegalResult()

    mongoose.model.save(values)
  } catch (e) {
    // $$emit error
  }
```