const { request } = require('undici');
const pick = require('lodash').pick;
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const copyHeaders = require('./copyHeaders');

async function proxy(req, res) {
  try {
    const { statusCode, headers, body } = await request(req.params.url, {
      headers: {
        ...pick(req.headers, ["cookie", "dnt", "referer"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": req.headers["x-forwarded-for"] || req.ip,
        via: "1.1 bandwidth-hero",
      },
      method: 'GET',
      maxRedirections: 5,
      timeout: 10000,
    });

    // Handle non-2xx responses
    if (statusCode >= 400) {
      return redirect(req, res);
    }

    // Copy headers from the response to our response
    copyHeaders(headers, res);

    // Set headers for the response
    res.setHeader("content-encoding", "identity");
    req.params.originType = headers["content-type"] || "";
    req.params.originSize = headers["content-length"] || "0";

    if (shouldCompress(req)) {
      // Compress the image
      return compress(req, res, body);
    } else {
      // Directly pipe the response stream
      res.setHeader("x-proxy-bypass", 1);
      res.setHeader("content-length", headers["content-length"] || "0");
      body.pipe(res);
    }
  } catch (error) {
    // Handle errors (e.g., network issues)
    return redirect(req, res);
  }
}

module.exports = proxy;
