# CoapPolka

CoapPolka is a minimal CoAP routing framework based on [Polka](https://github.com/lukeed/polka). CoapPolka has basic support for routing, middleware, and sub-applications. 

We offer features likewise in mandatory bullet-point format:

* Using [node-coap](https://github.com/mcollina/node-coap) as CoAP server
* Nearly identical application API & route pattern definitions with Express.js & Polka
* proxying CoAP request to HTTP [WIP]

## Todo

* proxying CoAP request to HTTP
* response JSON format writer

## Install

```
$ npm install --save coap-polka
```

## Usage

```js
const coapPolka = require('coap-polka');

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
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000).then(_ => {
    console.log(`> CoAP Running on localhost:3000`);
  });
```
## API
*TBA*

### License

Copyright (c) 2018 Ahmad Anshorimuslim
Licensed under the MIT license.