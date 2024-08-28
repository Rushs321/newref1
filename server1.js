#!/usr/bin/env node
'use strict';
const Fastify = require('fastify');

const params = require('./src/params');
const proxy = require('./src/proxy1');

const PORT = process.env.PORT || 3000;

const app = Fastify({
  logger: true,
  disableRequestLogging: false,
  trustProxy: true
});

app.get('/', async (req, res) => {
  try {
    
    await params(req, res);
    if (res.sent) return;

    await proxy(req, res);
  } catch (err) {
    console.error(err);
    if (!res.sent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Start the server
  app.listen({host: '0.0.0.0' , port: PORT }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});
