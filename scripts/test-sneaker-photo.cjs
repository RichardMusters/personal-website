/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS test harness. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const testModule = { exports: {} };
const source = ts.transpileModule(fs.readFileSync('lib/sneaker-photo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require,
  process, Buffer, URL, Date, Map, Set, Error });
const { vindProductFoto, maakFotoToken, leesFotoToken, publiekeIPv4, kiesFotoBronnen } = testModule.exports;
const sku = 'HQ0262-001';
const page = 'https://shop.example/products/shoe';
const structured = (product) => `<script type="application/ld+json">${JSON.stringify(product)}</script>`;
const correct = { '@type': 'Product', sku, image: ['https://cdn.example/shoe.jpg'] };
assert.equal(vindProductFoto(structured(correct), page, sku), correct.image[0]);
assert.equal(vindProductFoto(structured({ '@graph': [correct] }), page, sku), correct.image[0]);
assert.equal(vindProductFoto(structured({ ...correct, sku: 'OTHER-001' }), page, sku), null);
assert.equal(vindProductFoto(structured({ ...correct, sku: 'internal-shop-id', url: `${page}/${sku}` }), page, sku), correct.image[0]);
assert.equal(vindProductFoto(structured({ ...correct, image: { url: '/photo.jpg' } }), page, sku), 'https://shop.example/photo.jpg');
assert.equal(vindProductFoto(structured({ ...correct, image: 'javascript:alert(1)' }), page, sku), null);
assert.equal(vindProductFoto(structured({ ...correct, image: 'https://127.0.0.1/photo.jpg' }), page, sku), null);
const og = `<meta content="Nike HQ0262-001" property="og:title"><meta property='og:image' content='/photo.jpg?a=1&amp;b=2'>`;
assert.equal(vindProductFoto(og, page, sku), 'https://shop.example/photo.jpg?a=1&b=2');
assert.equal(vindProductFoto(og.replace(sku, 'OTHER-001'), page, sku), null);
assert.equal(vindProductFoto(`<script type="application/ld+json">broken</script>${og}`, page, sku), 'https://shop.example/photo.jpg?a=1&b=2');
assert.equal(vindProductFoto('<meta property="og:image" content="/logo.jpg">', page, sku), null);
assert.equal(vindProductFoto(og, page, ''), null);
const secureOg = `<meta property="og:image" content="http://cdn.example/shoe.jpg"><meta property="og:image:secure_url" content="https://cdn.example/shoe.jpg">`;
assert.equal(vindProductFoto(secureOg, `${page}/${sku}`, sku), 'https://cdn.example/shoe.jpg');
assert.equal(vindProductFoto(secureOg, page, sku), null);
const brokenOg = `<meta property="og:title" content="Nike ${sku}"><meta property="og:image:secure_url" content="https:files/shoe.jpg">`;
assert.equal(vindProductFoto(brokenOg, page, sku), null, 'Malformed absolute URL must not become a relative product URL');
assert.equal(vindProductFoto(`${brokenOg}<img src="data:image/svg+xml,placeholder" data-src="//cdn.example/${sku}.jpg">`, page, sku), `https://cdn.example/${sku}.jpg`);
assert.equal(vindProductFoto(`${brokenOg}<img data-src="//cdn.example/OTHER-001.jpg">`, page, sku), null);
assert.equal(kiesFotoBronnen(sku, [], [page]).length, 1, 'Identification sources must be used without offers');
assert.equal(kiesFotoBronnen(sku, [], [page, `${page}/${sku}`])[0], `${page}/${sku}`);
assert.equal(kiesFotoBronnen(sku, [page], [page]).length, 1);
assert.equal(kiesFotoBronnen(sku, [], ['javascript:alert(1)', 'http://shop.example/test']).length, 0);
for (const ip of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '172.16.1.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '::1', '224.0.0.1']) {
  assert.equal(publiekeIPv4(ip), false, ip);
}
assert.equal(publiekeIPv4('8.8.8.8'), true);
process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';
const token = maakFotoToken(sku, [page]);
assert.equal(leesFotoToken(token).sku, sku);
assert.equal(leesFotoToken(token + 'bad'), null);
assert.equal(leesFotoToken(token.replace(token[0], token[0] === 'a' ? 'b' : 'a')), null);
assert.equal(maakFotoToken(null, [page]), null);
assert.equal(maakFotoToken(sku, []), null);
const now = Date.now;
Date.now = () => now() + 16 * 60_000;
assert.equal(leesFotoToken(token), null);
Date.now = now;
console.log('Passed: SKU matching, JSON-LD, OG metadata, missing/wrong images, URL/IP safety, signed tokens and expiry.');
