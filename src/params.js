"use strict";
const DEFAULT_QUALITY = 40;

async function params(req, res) {
  let url = req.query.url;
  if (!url) return res.send('1we23');

  req.params.url = decodeURIComponent(url);
  req.params.webp = !req.query.jpeg;
  req.params.grayscale = req.query.bw != 0;
  req.params.quality = parseInt(req.query.l, 10) || DEFAULT_QUALITY;
}

module.exports = params;
