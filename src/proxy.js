const fetch = require('node-fetch');
const pick = require('lodash').pick;
const { generateRandomIP, randomUserAgent } = require('./user.js');
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const copyHeaders = require('./copyHeaders');

const viaHeaders = [
    '1.1 example-proxy-service.com (ExampleProxy/1.0)',
    '1.0 another-proxy.net (Proxy/2.0)',
    '1.1 different-proxy-system.org (DifferentProxy/3.1)',
    '1.1 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

async function proxy(req, res) {

  const { url, jpeg, bw, l } = req.query;
  if (!url) {
        return res.end(`1we23`);
  }
  
  const urls = Array.isArray(url) ? url.join('&url=') : url;
  const cleanedUrl = urls.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

  req.params.url = cleanedUrl;
  req.params.webp = !jpeg;
  req.params.grayscale = bw !== '0';
  req.params.quality = parseInt(l, 10) || 40;

  const randomIP = generateRandomIP();
  const userAgent = randomUserAgent();
  
  try {
    // Making the request with fetch
    const fetchResponse = await fetch(req.params.url, {
      headers: {
        ...pick(req.headers, ["cookie", "dnt", "referer"]),
        'user-agent': userAgent,
        'x-forwarded-for': randomIP,
        'via': randomVia(),
      },
      timeout: 10000, // node-fetch timeout option (requires custom timeout handling)
      redirect: 'follow', // follow redirects automatically
    });

    // Handle non-2xx responses
    if (!fetchResponse.ok) {
      return redirect(req, res);
    }

    // Copy headers from the response to our response
    copyHeaders(fetchResponse, res);

    // Set headers for the response
    res.setHeader("content-encoding", "identity");
    req.params.originType = fetchResponse.headers.get("content-type") || "";
    req.params.originSize = fetchResponse.headers.get("content-length") || "0";

    if (shouldCompress(req)) {
      // Compress the image
      return compress(req, res, fetchResponse.body);
    } else {
      // Directly pipe the response stream
      res.setHeader("x-proxy-bypass", 1);
      res.setHeader("content-length", fetchResponse.headers.get("content-length") || "0");
      fetchResponse.body.pipe(res);
    }
  } catch (error) {
    // Handle errors (e.g., network issues)
    return redirect(req, res);
  }
}

module.exports = proxy;
