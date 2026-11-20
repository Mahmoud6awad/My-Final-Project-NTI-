import test from 'node:test';
import assert from 'node:assert/strict';
import { login } from '../controllers/authController.js';

function makeResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };
}

test('login rejects a blank email before looking up a manager', async () => {
  const req = { body: { email: '   ', password: 'secret' } };
  const res = makeResponse();

  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: 'Enter a valid email address and password.'
  });
});

test('login rejects a non-string password', async () => {
  const req = { body: { email: 'manager@example.com', password: 12345 } };
  const res = makeResponse();

  await login(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Enter a valid email address and password.');
});
