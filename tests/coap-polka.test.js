const coap = require('coap');
const axios = require('axios');
const coapPolka = require('../libs/coap-polka');
const { test, sleep, listen } = require('./util');

const { METHODS } = require('../libs/coap-helper');

test('coapPolka', t => {
	t.is(typeof coapPolka, 'function', 'exports a function');
	t.end();
});

test('coapPolka::internals', async t => {
	let app = coapPolka();
	let proto = app.__proto__;

	t.isObject(app.opts, 'app.opts is an object');
	t.isEmpty(app.opts, 'app.opts is empty');

	t.isObject(app.apps, 'app.apps is an object');
	t.isEmpty(app.apps, 'app.apps is empty');

	t.isArray(app.wares, 'app.wares is an array');
	t.isEmpty(app.wares, 'app.wares is empty');

	t.isObject(app.bwares, 'app.bwares is an object');
	t.isEmpty(app.bwares, 'app.bwares is empty');

	t.is(app.server, undefined, 'app.server is `undefined` initially (pre-listen)');
	await app.listen();
	t.ok(app.server instanceof coap.createServer, '~> app.server becomes coap server (post-listen)');
	app.server.close();

	t.isFunction(app.onError, 'app.onError is a function');
	t.isFunction(app.onNoMatch, 'app.onNoMatch is a function');

	['parse', 'handler'].forEach(k => {
		t.isFunction(app[k], `app.${k} is a function`);
	});

	['use', 'listen', 'handler'].forEach(k => {
		t.isFunction(proto[k], `app.${k} is a prototype method`);
	});

	t.isObject(app.routes, 'app.routes is an object tree');
	t.isObject(app.handlers, 'app.handlers is an object tree');

	METHODS.forEach(k => {
		t.isFunction(app[k.toLowerCase()], `app.${k.toLowerCase()} is a function`);
		t.is(app.handlers[k], undefined, `~> handlers.${k} is empty`);
		t.is(app.routes[k], undefined, `~> routes.${k} is empty`);
	});

	t.end();
});

test('coapPolka::usage::basic', t => {
	t.plan(9);

	let app = coapPolka();
	let arr = [['GET','/'], ['POST','/users'], ['PUT','/users/:id']];

	arr.forEach(([m,p]) => {
		app.add(m, p, _ => t.pass(`~> matched ${m}(${p}) route`));
		t.is(app.routes[m].length, 1, 'added a new `app.route` definition');
		t.isFunction(app.handlers[m][p], 'added a new `app.handler` function');
	});

	arr.forEach(([m, p]) => {
		app.find(m, p).handler();
	});
});

test('coapPolka::usage::middleware', async t => {
	t.plan(1);

	let app = coapPolka().use((req, res, next) => {
		(req.one='hello') && next();
	}).use((req, res, next) => {
		(req.two='world') && next();
	}).get('/', (req, res) => {
		t.pass('~> matches the GET(/) route');
		t.is(req.one, 'hello', '~> route handler runs after first middleware');
		t.is(req.two, 'world', '~> route handler runs after both middlewares!');
		res.setHeader('x-type', 'text/foo');
		res.end('Hello');
	});

	t.is(app.wares.length, 2, 'added 2 middleware functions');
});