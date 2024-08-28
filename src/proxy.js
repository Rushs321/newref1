const axios = require('axios');
const pick = require('lodash').pick;
const shouldCompress = require('./shouldCompress');
const { generateRandomIP, randomUserAgent } = require('./user.js');
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
    // Making the request with axios.get
    const axiosResponse = await axios.get(req.params.url, {
      headers: {
        ...pick(req.headers, ["cookie", "dnt", "referer"]),
        'user-agent': userAgent,
        'x-forwarded-for': randomIP,
        'via': randomVia(),
      },
      responseType: 'stream', // To handle streaming data
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400, // Treats HTTP errors as rejected promises
    });

    // Handle non-2xx responses
    if (axiosResponse.status >= 400) {
      return redirect(req, res);
    }

    // Copy headers from the response to our response
    copyHeaders(axiosResponse, res);

    // Set headers for the response
    res.setHeader("content-encoding", "identity");
    req.params.originType = axiosResponse.headers["content-type"] || "";
    req.params.originSize = axiosResponse.headers["content-length"] || "0";

    if (shouldCompress(req)) {
      // Compress the image
      return compress(req, res, axiosResponse.data);
    } else {
      // Directly pipe the response stream
      res.setHeader("x-proxy-bypass", 1);
      res.setHeader("content-length", axiosResponse.headers["content-length"] || "0");
      axiosResponse.data.pipe(res);
    }
  } catch (error) {
    // Handle errors (e.g., network issues)
    return redirect(req, res);
  }
}

module.exports = proxy;
