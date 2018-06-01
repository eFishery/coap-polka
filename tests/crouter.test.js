const { METHODS } = require('../libs/coap-helper');
const { test, Test } = require('tape');
const Crouter = require('../libs/crouter');

const r = new Crouter();
const $ = Test.prototype;

$.isEmpty = function (val, msg) {
	this.ok(!Object.keys(val).length, msg);
}

$.isArray = function (val, msg) {
	this.ok(Array.isArray(val), msg);
}

$.isObject = function (val, msg) {
	this.ok(Boolean(val) && (val.constructor === Object), msg);
}

$.isFunction = function (val, msg) {
	this.is(typeof val, 'function', msg);
}

test('exports', t => {
	t.isFunction(Crouter, 'exports a function');
	t.end();
});

test('instance', t => {
	t.true(r instanceof Crouter, 'creates new `Crouter` instances');

	t.isObject(r.opts, '~> has `opts` key');
	t.isObject(r.routes, '~> has `routes` key');
	t.isObject(r.handlers, '~> has `handlers` key');

	t.isFunction(r.add, '~> has `add` method');
	t.isFunction(r.all, '~> has `all` method');

	METHODS.forEach(str => {
		t.comment(`=== METHOD :: ${str} ===`);
		t.isFunction(r[str.toLowerCase()], `~> has \`${str}\` method`);
		t.is(r.routes[str], undefined, `~~> \`routes.${str}\` undefined initially`);
		t.is(r.handlers[str], undefined, `~~> \`handlers.${str}\` undefined initially`);
	});

	t.end();
});

let val = 123;
test('add()', t => {
	r.add('GET', '/foo/:hello', tt => {
		val = 42;
		tt.pass('runs the GET /foo/:hello handler (find)');
	});

	t.is(r.routes.GET.length, 1, 'adds a GET route definition successfully');
	t.isArray(r.routes.GET[0], 'parses the pattern into an array of segments');
	t.is(r.routes.GET[0].length, 2, '~~> has 2 segment (static + param)');
	t.isObject(r.routes.GET[0][0], '~~> array segments are objects');
	t.is(Object.keys(r.handlers.GET).length, 1, 'adds a GET route handler successfully');
	t.isFunction(r.handlers.GET['/foo/:hello'], 'saves the handler function as is');

	r.post('/bar', tt => {
		val = 99;
		tt.pass('runs the POST /bar handler (find)');
	});

	t.is(r.routes.POST.length, 1, 'adds a POST route definition successfully');
	t.isArray(r.routes.POST[0], 'parses the pattern into an array of segments');
	t.is(r.routes.POST[0].length, 1, '~~> has only 1 segment (static)');
	t.isObject(r.routes.POST[0][0], '~~> array segments are objects');
	t.is(Object.keys(r.handlers.POST).length, 1, 'adds a POST route handler successfully');
	t.isFunction(r.handlers.POST['/bar'], 'saves the handler function as is');

	t.end();
});

test('find()', t => {
	t.plan(13);

	let foo = r.find('DELETE', '/nothing');
	t.is(foo, false, 'returns false when no match');

	let bar = r.find('GET', '/foo/world');
	t.isObject(bar, 'returns an object when has match');
	t.ok(bar.params, `~> has 'params' key`);
	t.is(bar.params.hello, 'world', `~~> pairs the named 'hello' param with its value`);
	t.ok(bar.handler, `~> has 'handler' key`);
	bar.handler(t); // +1
	t.is(val, 42, '~> successfully executes the handler');

	let baz = r.find('POST', '/bar');
	t.isObject(baz, 'returns an object when has match');
	t.ok(baz.params, `~> has 'params' key`);
	t.isEmpty(baz.params, `~~> returns empty 'params' even if static route`);
	t.ok(baz.handler, `~> has 'handler' key`);
	baz.handler(t); // +1
	t.is(val, 99, '~> successfully executes the handler');
});

test('all()', t => {
	t.is(r.routes.OBSERVE, undefined, '`routes.OBSERVE` is not defined');
	t.is(r.handlers.OBSERVE, undefined, '`handlers.OBSERVE` is not defined');

	let foo = 0;
	r.all('/greet/:name', _ => foo++);

	t.is(r.routes.OBSERVE, undefined, '`routes.OBSERVE` (still) undefined');
	t.is(r.handlers.OBSERVE, undefined, '`handlers.OBSERVE` (still) undefined');
	t.isObject(r.handlers['*'], '`handlers["*"]` now exists as object');
	t.isArray(r.routes['*'], '`routes["*"]` now exists as array');

	let obj1 = r.find('OBSERVE', '/greet/Bob');
	t.isObject(obj1, 'find(OBSERVE) returns standard object');
	t.is(obj1.params.name, 'Bob', '~> params operate as normal');
	t.isFunction(obj1.handler, '~> handler is the function');

	obj1.handler();
	t.is(foo, 1, '~~> handler executed successfully');

	let obj2 = r.find('GET', '/greet/Judy');
	t.isObject(obj2, 'find(GET) returns standard object');
	t.is(obj2.params.name, 'Judy', '~> params operate as normal');
	t.isFunction(obj2.handler, '~> handler is the function');

	obj1.handler();
	t.is(foo, 2, '~~> handler executed successfully');

	// Now add same definition to OBSERVE, overrides
	r.observe('/greet/:name', _ => t.pass('>> calls new OBSERVE handler'));
	t.isObject(r.handlers.OBSERVE, 'now `handlers.OBSERVE` is object');
	t.isArray(r.routes.OBSERVE, 'now `routes.OBSERVE` is array');

	let obj3 = r.find('OBSERVE', '/greet/Rick');
	t.isObject(obj3, 'find(OBSERVE) returns standard object');
	t.is(obj3.params.name, 'Rick', '~> params operate as normal');
	t.isFunction(obj3.handler, '~> handler is the function');

	obj3.handler();
	t.is(foo, 2, '>> does NOT run `all()` handler anymore');

	let obj4 = r.find('POST', '/greet/Morty');
	obj4.handler();
	t.is(foo, 3, '~> still runs `all()` for methods w/o same pattern');

	t.end();
});