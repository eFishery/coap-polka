const coapPolka = require('..');

function hello(req, res, next) {
  req.hello = 'world';
  next();
}

function foo(req, res, next) {
  req.foo = 'bar';
  next();
}

coapPolka()
  // .use(hello, foo) // same function different styles
  .use(hello)
  .use(foo)
  .post('/users/:id', (req, res) => {
    const payloadString = req.payload.toString('utf8');
    res.setOption('Content-Format', 'application/json');
    res.end(JSON.stringify({
      user: req.params.id,
      payload: payloadString
    }));
  })
  .get('*', (req, res) => {
    console.log(`~> Hello, ${req.hello}`);
    console.log(`~> Foo, ${req.foo}`);
    res.end(`Route All`);
  })
  .listen(3000).then(_ => {
    console.log(`> CoAP Running on localhost:3000`);
  });