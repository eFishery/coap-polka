const coapPolka = require('../libs/coap-polka');

function hello(req, res, next) {
  req.hello = 'world';
  next();
}

function foo(req, res, next) {
  req.foo = 'bar';
  next();
}

coapPolka()
  .use(hello, foo)
  .get('/users/:id', (req, res) => {
    console.log(`~> Hello, ${req.hello}`);
    console.log(`~> Foo, ${req.foo}`);
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000).then(_ => {
    console.log(`> CoAP Running on localhost:3000`);
  });