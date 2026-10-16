/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads transpiled route modules. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual route with a mocked provider; no API calls or credentials needed.
function load(file, fetchImpl) {
  const filename = path.resolve(file);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const testModule = { exports: {} };
  const localRequire = (name) => {
    if (name.startsWith('@/')) {
      const target = name.slice(2);
      return target.endsWith('.json') ? require(path.resolve(target)) : load(target + '.ts', fetchImpl);
    }
    return require(name);
  };
  vm.runInNewContext(output, { module: testModule, exports: testModule.exports, require: localRequire,
    process, console, fetch: fetchImpl, URL, AbortSignal, Error, Date, Map, Set });
  return testModule.exports;
}

async function main() {
  const live = process.argv.includes('--live');
  if (live) {
    require('@next/env').loadEnvConfig(process.cwd());
    const route = load('app/api/sneaker-search/route.ts', fetch);
    const begin = Date.now();
    const response = await route.POST(new Request('http://localhost/api/sneaker-search', {
      method: 'POST', body: JSON.stringify({ query: 'Nike Air Force 1 CW2288-111 maat 45' }),
    }));
    const data = await response.json();
    console.log(JSON.stringify({ status: response.status, seconds: (Date.now()-begin)/1000,
      model: data.sneaker?.model, offers: data.aanbiedingen?.length,
      confirmed: data.aanbiedingen?.filter(a => a.bevestigdWeergave).length, error: data.fout }));
    assert.equal(response.status, 200, 'Live search failed');
    return;
  }
  process.env.OPENAI_API_KEY = 'test-only';
  process.env.RATE_LIMIT_PER_DAY = '100';
  const url = 'https://www.nike.com/nl/t/test/CW2288-111';
  const offer = { winkel: 'Nike', url, prijs: 120, valuta: 'EUR', verzendkosten: 'gratis',
    totaalprijs: 120, verzendingBuitenEU: false, type: 'nieuw', maatBeschikbaarheid: 'beschikbaar',
    matchZekerheid: 'exact', bevestigd: true, opmerking: null };
  const result = { gevonden: true, zekerheid: 'hoog', sneaker: { model: 'Air Force 1' },
    aanbiedingen: [offer], alternatieven: [], tips: [], besteMatchToelichting: null };
  let providerStatus = 200;
  let outputStatus = 'completed';
  let opened = false;
  let calls = 0;
  const mockFetch = async (_, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gpt-6-luna');
    assert.equal(body.reasoning.effort, 'low');
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.tools[0].type, 'web_search');
    if (body.input[0].content.length === 2) assert.match(body.input[0].content[1].image_url, /^data:image\/png;base64,/);
    return Response.json({ status: outputStatus, output: [
      { type: 'web_search_call', status: 'completed', action: { type: 'search', sources: [{ url }] } },
      ...(opened ? [{ type: 'web_search_call', status: 'completed', action: { type: 'open_page', url } }] : []),
      { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(result) }] },
    ] }, { status: providerStatus });
  };
  const route = load('app/api/sneaker-search/route.ts', mockFetch);
  const request = (body) => route.POST(new Request('http://localhost/api/sneaker-search', {
    method: 'POST', body: JSON.stringify(body),
  }));
  assert.equal((await request(null)).status, 400);
  assert.equal((await request({ query: 123 })).status, 400);
  assert.equal((await request({ query: '' })).status, 400);
  assert.equal((await request({ image: { mimeType: 'image/png', data: 123 } })).status, 400);
  let data = await (await request({ query: 'snippet' })).json();
  assert.equal(data.aanbiedingen[0].maatBeschikbaarheid, 'onzeker');
  assert.equal(data.aanbiedingen[0].bevestigdWeergave, false);
  opened = true;
  data = await (await request({ query: 'opened' })).json();
  assert.equal(data.aanbiedingen[0].bevestigdWeergave, true);
  const beforeCache = calls;
  await request({ query: 'opened' });
  assert.equal(calls, beforeCache);
  result.aanbiedingen.push({ ...offer, url: 'https://invented.example/shoe' }, { ...offer, url: 'javascript:alert(1)' });
  data = await (await request({ query: 'untrusted' })).json();
  assert.equal(data.aanbiedingen.length, 1);
  data = await (await request({ image: { mimeType: 'image/png', data: 'AAAA' } })).json();
  assert.equal(data.aanbiedingen.length, 1);
  result.aanbiedingen = [];
  const beforeEmpty = calls;
  await request({ query: 'empty' });
  assert.equal(calls, beforeEmpty + 1, 'Empty searches must not retry');
  outputStatus = 'incomplete';
  assert.equal((await request({ query: 'incomplete' })).status, 502);
  providerStatus = 429;
  assert.equal((await request({ query: 'limited' })).status, 429);
  console.log('Passed: validation, image input, source checks, stock uncertainty, cache, no retry, incomplete output, rate limit.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

