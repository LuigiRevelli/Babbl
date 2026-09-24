/**
 * Test de bout en bout : vrai backend, vraie app construite, Chromium avec un
 * micro simulé. Parcours d'un parent, du geste « tétée » jusqu'au résultat, et
 * le refus quand il n'y a pas de pleur.
 *
 *   APP_URL=http://127.0.0.1:4173 AUDIO_DIR=/tmp/e2e node e2e/smoke.mjs
 *   CHROME_PATH=/opt/pw-browsers/chromium   (sinon : Chrome du système)
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const APP = process.env.APP_URL ?? 'http://127.0.0.1:4173';
const AUDIO = process.env.AUDIO_DIR ?? '/tmp/e2e';
const FORBIDDEN = [/\d+\s?Hz\b/, /\d+\s?%/, /diagnos/i, /tout va bien/i, /\bnormal\b/i, /colique/i];

let failures = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failures++; };

async function browserFor(wav) {
  return chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${path.join(AUDIO, wav)}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
}

async function page(browser) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  await ctx.grantPermissions(['microphone'], { origin: APP });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  p.on('dialog', (d) => { p.errors.push(`dialog: ${d.message()}`); d.dismiss(); });
  return p;
}

const bodyText = (p) => p.evaluate(() => document.body.innerText);

/** Accessibilité (axe-core) : aucun défaut « serious » ou « critical ». */
async function a11y(p, where) {
  await p.addScriptTag({ content: AXE });
  const bad = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations
    .filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => `${v.id} ×${v.nodes.length} (${v.nodes[0].target.join(' ')})`));
  check(bad.length === 0, `${where} accessible${bad.length ? ' : ' + bad.join(', ') : ''}`);
}

// 1. Un pleur, après avoir noté une tétée → résultat avec la piste et les cartes.
{
  const b = await browserFor('cry.wav');
  const p = await page(b);
  await p.goto(APP + '/');
  await p.getByLabel('Noter une tétée maintenant').click();
  await p.getByLabel('Écouter mon bébé').click();
  await p.waitForURL(/\/analysis\//, { timeout: 45_000 }).catch(() => undefined);
  check(/\/analysis\//.test(p.url()), 'un pleur mène au résultat');
  await p.waitForFunction(() => /Appeler le 15/.test(document.body.innerText), null, { timeout: 10_000 }).catch(() => undefined);
  const text = await bodyText(p);
  check(/Appeler le 15/.test(text), 'le résultat affiche « Appeler le 15 »');
  check(/saisi/.test(text), 'le résultat dit que la piste vient de la saisie');
  check(/Tétée/.test(text), 'la tétée notée apparaît dans la piste');
  for (const re of FORBIDDEN) check(!re.test(text), `résultat sans ${re}`);
  await a11y(p, 'le résultat');
  check(p.errors.length === 0, `aucune erreur de page (${p.errors.join(' | ')})`);

  // Les autres écrans s'ouvrent sans erreur, avec l'analyse en mémoire.
  for (const route of ['/dashboard', '/history', '/report', '/voice-setup', '/upgrade']) {
    await p.goto(APP + route);
    await p.waitForTimeout(600);
    const t = await bodyText(p);
    check(t.trim().length > 20 && !/Page introuvable/.test(t), `${route} s'affiche`);
    for (const re of FORBIDDEN) check(!re.test(t), `${route} sans ${re}`);
    await a11y(p, route);
  }
  check(p.errors.length === 0, `aucune erreur sur les autres écrans (${p.errors.join(' | ')})`);
  await b.close();
}

// 1b. « Quand appeler ? » : accessible depuis l'accueil, sans enregistrer.
{
  const b = await browserFor('silence.wav');
  const p = await page(b);
  await p.goto(APP + '/');
  await p.getByText('Quand appeler le 15 ?').click();
  await p.waitForURL(/quand-appeler/);
  await p.waitForTimeout(800);
  const text = await bodyText(p);
  check(/Appeler le 15/.test(text), '« Quand appeler » affiche le 15');
  const expectV2 = process.env.EXPECT_CARDS === 'v2';
  check(/Si vous voyez/.test(text) === expectV2, `menus v2 ${expectV2 ? 'affichés' : 'absents'} (cartes ${expectV2 ? 'v2' : 'v1'})`);
  for (const re of FORBIDDEN) check(!re.test(text), `« Quand appeler » sans ${re}`);
  await a11y(p, '« Quand appeler »');
  check(p.errors.length === 0, `aucune erreur de page (${p.errors.join(' | ')})`);
  await b.close();
}

// 2. Du silence → refus, jamais une réponse, et toujours le 15.
{
  const b = await browserFor('silence.wav');
  const p = await page(b);
  await p.goto(APP + '/');
  await p.getByLabel('Écouter mon bébé').click();
  await p.waitForFunction(() => /rassurant/i.test(document.body.innerText), null, { timeout: 45_000 }).catch(() => undefined);
  await p.waitForTimeout(500);
  const text = await bodyText(p);
  check(!/\/analysis\//.test(p.url()), 'le silence ne mène pas à un résultat');
  check(/15/.test(text), 'le refus affiche le 15');
  await a11y(p, 'le refus');
  check(/rassurant/i.test(text), 'le refus rappelle qu\'un bébé qui pleure peu n\'est pas rassurant');
  check(p.errors.length === 0, `aucune erreur de page (${p.errors.join(' | ')})`);
  await b.close();
}

console.log(failures ? `\n${failures} échec(s)` : '\ntout est bon');
process.exit(failures ? 1 : 0);
