const coap  = require('coap')
const bl   = require('bl')

const req   = coap.request({
	hostname: 'localhost',
	pathname: '/users/212',
	port: 3000,
	method: 'POST'
})

const payload = {
  hello: 'world'
}

req.write(JSON.stringify(payload))

req.on('response', function(res) {
  res.pipe(bl(function(err, data) {
  	if (err) {
  		console.log(err);
  		process.exit(1);
  	}
  	let json = {};
  	console.log('response: ', data.toString('utf8'));
  }))
})

req.end()

// 

const req2   = coap.request({
	hostname: 'localhost',
	pathname: '/users',
	port: 3000,
	method: 'GET'
})

req2.on('response', function(res) {
  res.pipe(bl(function(err, data) {
  	if (err) {
  		console.log(err);
  		process.exit(1);
  	}
  	let json = {};
  	console.log('response: ', data.toString('utf8'));
  }))
})

req2.end()
