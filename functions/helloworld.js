const { brotliCompress } = require('zlib');
const { URL } = require('url');
const { parse } = require('querystring');

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = parse(url.search.slice(1));

  if (query.text) {
    const compressedText = await compressText(query.text);
    return new Response(JSON.stringify({ compressedText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response('Please provide a "text" query parameter.', {
      status: 400,
    });
  }
}

async function compressText(text) {
  return new Promise((resolve, reject) => {
    brotliCompress(text, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.toString('base64'));
      }
    });
  });
}
