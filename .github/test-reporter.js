// Reporter para GitHub Actions:
// - Escribe en el resumen del job (GITHUB_STEP_SUMMARY) una tabla con cada test aprobado o fallido.
// - Emite anotaciones ::error:: para que los fallos aparezcan marcados en el código.
import { appendFileSync } from 'node:fs';
import { relative } from 'node:path';

const escape = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const escapeData = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export default async function* githubReporter(source) {
  const results = [];

  for await (const { type, data } of source) {
    if (type !== 'test:pass' && type !== 'test:fail') continue;
    if (data.details?.type === 'suite') continue;

    const file = data.file ? relative(process.cwd(), data.file) : '';
    const result = {
      name: data.name,
      file,
      ok: type === 'test:pass',
      skipped: Boolean(data.skip || data.todo),
      ms: data.details?.duration_ms ?? 0,
      error: data.details?.error?.cause?.message ?? data.details?.error?.message ?? '',
    };
    results.push(result);

    if (!result.ok) {
      const loc = file ? `file=${file},line=${data.line ?? 1},` : '';
      yield `::error ${loc}title=Test fallido: ${escapeData(data.name)}::${escapeData(result.error)}\n`;
    }
  }

  const passed = results.filter((r) => r.ok && !r.skipped).length;
  const failed = results.filter((r) => !r.ok).length;
  const skipped = results.filter((r) => r.skipped).length;

  const lines = [
    `## ${failed ? '❌' : '✅'} Resultados de los tests — Node ${process.version}`,
    '',
    `| ✅ Aprobados | ❌ Fallidos | ⏭️ Omitidos | Total |`,
    `|:---:|:---:|:---:|:---:|`,
    `| ${passed} | ${failed} | ${skipped} | ${results.length} |`,
    '',
    '| Estado | Test | Archivo | Duración | Error |',
    '|:---:|---|---|---:|---|',
    ...results.map((r) =>
      `| ${r.skipped ? '⏭️' : r.ok ? '✅' : '❌'} | ${escape(r.name)} | ${r.file} | ${r.ms.toFixed(1)} ms | ${escape(r.error)} |`),
    '',
  ];

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  } else {
    yield lines.join('\n') + '\n';
  }
}
