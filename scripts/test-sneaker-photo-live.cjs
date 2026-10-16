/* eslint-disable @typescript-eslint/no-require-imports -- Standalone diagnostic runner. */
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const testModule = { exports: {} };
const source = ts.transpileModule(fs.readFileSync('lib/sneaker-photo.ts', 'utf8') + '\nexport { haalPagina };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require,
  process, Buffer, URL, Date, Map, Set, Error, console });
const cases = [
  ['IM5204-001', 'https://www.starcowparis.com/en/products/nike-air-foamposite-pro-prm-green-camo'],
  ['IM5204-001', 'https://www.nike.com/launch/t/air-foamposite-pro-black-and-multi-color'],
  ['IM5204-001', 'https://shop-us.doverstreetmarket.com/products/nike-air-foamposite-pro-prm-blkvltgr-im5204-001-aw26'],
  ['CW2288-111', 'https://www.nike.com/t/air-force-1-07-mens-shoes-DZejrQoC/CW2288-111'],
  ['CW2288-111', 'https://www.sneakersnstuff.com/en-int/products/nike-air-force-1-07-triple-white-cw2288-111'],
];
Promise.all(cases.map(async ([sku, url], i) => {
  try {
    const page = await testModule.exports.haalPagina(new URL(url), AbortSignal.timeout(8000));
    fs.mkdirSync('.next/photo-debug', { recursive: true });
    fs.writeFileSync(`.next/photo-debug/${i}.html`, page.html);
    const photo = testModule.exports.vindProductFoto(page.html, page.url, sku);
    const image = photo ? await fetch(photo, { signal: AbortSignal.timeout(8000) }) : null;
    console.log(JSON.stringify({ sku, source: url, bytes: page.html.length, photo, imageStatus: image?.status, imageType: image?.headers.get('content-type') }));
    await image?.body?.cancel();
  } catch (error) { console.log(JSON.stringify({ sku, source: url, error: error.message, code: error.code })); }
}));
