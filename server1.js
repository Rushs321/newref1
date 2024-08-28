#!/usr/bin/env node
'use strict';
const Fastify = require('fastify');

const params = require('./src/params');
const proxy = require('./src/proxy1');

const PORT = process.env.PORT || 3000;

const app = Fastify({
  trustProxy: true
});

app.get('/', async (req, res) => {
  await params(req, res);
  await proxy(req, res);
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

app.listen(PORT, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Listening on ${address}`);
});
