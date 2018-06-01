const coap    = require('coap');
const Router = require('./crouter');
const coapHelper = require('./coap-helper');
const parseurl = require('parseurl');
const { parse } = require('querystring');

function lead(x) {
	return x.charCodeAt(0) === 47 ? x : ('/' + x);
}

function value(x) {
  let y = x.indexOf('/', 1);
  return y > 1 ? x.substring(0, y) : x;
}

function mutate(str, req) {
	req.url = req.url.substring(str.length) || '/';
	req.path = req.path.substring(str.length) || '/';
}

function isRootWild(obj) {
	return Object.keys(obj).length === 1 && obj['*'];
}

function onError(err, req, res, next) {
	let code = (res.statusCode = err.code || err.status || '5.00');
	res.end(err.length && err || err.message || coapHelper.STATUS_CODES[code]);
}

class CoapPolka extends Router {
	constructor(opts={}) {
		super(opts);
		this.apps = {};
		this.wares = [];
		this.bwares = {};
		this.parse = parseurl;
		this.server = opts.server;
		this.handler = this.handler.bind(this);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:'4.04' });
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else if (base === '/') {
			this.wares = this.wares.concat(fns);
		} else {
			base = lead(base);
			fns.forEach(fn => {
				if (fn instanceof CoapPolka) {
					this.apps[base] = fn;
				} else {
					let arr = this.bwares[base] || [];
					(arr.length === 0) && arr.push((r, _, next) => (mutate(base, r),next()));
					this.bwares[base] = arr.concat(fn);
				}
			});
		}
		return this; // chainable
	}

	listen(port, hostname) {
		const host = (typeof hostname === 'undefined') ? '127.0.0.1' : hostname;
		(this.server = coap.createServer()).on('request', this.handler);
		return new Promise((resolve, reject) => {
			this.server.listen(port, host, err => err ? reject(err) : resolve());
		});
	}

	handler(req, res, info) {
		info = info || this.parse(req);
		let fn, arr=this.wares, obj=this.find(req.method, info.pathname);
		req.originalUrl = req.originalUrl || req.url;
		req.path = info.pathname;
		if (obj) {
			fn = obj.handler;
			req.params = obj.params;
		}
		if (!obj || isRootWild(obj.params)) {
			// Looking for sub-apps or extra middleware
			let base = value(req.path);
			if (this.apps[base] !== void 0) {
				mutate(base, req); info.pathname=req.path; //=> updates
				fn = this.apps[base].handler.bind(null, req, res, info);
			} else {
				fn = fn || this.onNoMatch;
				if (this.bwares[base] !== void 0) {
					arr = arr.concat(this.bwares[base]);
				}
			}
		}
		// Grab addl values from `info`
		req.search = info.search;
		req.query = parse(info.query);
		// Exit if no middleware
		let i=0, len=arr.length;
		if (len === i) return fn(req, res);
		// Otherwise loop thru all middlware
		let next = err => err ? this.onError(err, req, res, next) : loop();
		let loop = _ => res.finished || (i < len) ? arr[i++](req, res, next) : fn(req, res);
		loop(); // init
	}
}

module.exports = opts => new CoapPolka(opts);