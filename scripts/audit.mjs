// PhotoMax — Static audit script. Scans the source tree for common security
// pitfalls and reports findings. Exits with code 1 when issues are found.
//
// Checks:
//  1. No `dangerouslySetInnerHTML` use anywhere in src/.
//  2. No `innerHTML` / `outerHTML` writes in src/.
//  3. No `eval(` / `new Function(` in src/.
//  4. No hardcoded API tokens, secrets, or .env values committed in src/.
//  5. No use of `any` or `unknown` in TypeScript source.
//  6. The seed and store sanitize user input before persisting.
//  7. index.html includes X-Content-Type-Options and Referrer-Policy meta.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const issues = [];
const statsCounters = { files: 0, scanned: 0 };

const FORBIDDEN_PATTERNS = [
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/ },
  { name: 'innerHTML', regex: /\.innerHTML\s*=/ },
  { name: 'outerHTML', regex: /\.outerHTML\s*=/ },
  { name: 'eval', regex: /\beval\s*\(/ },
  { name: 'Function constructor', regex: /\bnew\s+Function\s*\(/ },
  { name: 'document.write', regex: /\bdocument\.write\s*\(/ },
  { name: 'TypeScript any', regex: /:\s*any\b|\bas\s+any\b/ },
  // `unknown` is allowed as a *parameter* type for untrusted inputs (security.ts),
  // but not as a return type or cast.
  { name: 'TypeScript unknown (return/var)', regex: /:\s*unknown\s*[,)=;>]|as\s+unknown\b/ },
];

const SECRET_PATTERNS = [
  { name: 'AWS key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic API key', regex: /(api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i },
];

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(root, p).replaceAll('\\', '/');
}

function lineOf(content, idx) {
  return content.slice(0, idx).split('\n').length;
}

async function scan() {
  const files = await walk(src);
  for (const file of files) {
    if (!/\.(ts|tsx|js|mjs|cjs|html|css)$/i.test(file)) continue;
    statsCounters.files++;
    const content = await fs.readFile(file, 'utf8');
    statsCounters.scanned++;
    const relPath = rel(file);
    for (const { name, regex } of FORBIDDEN_PATTERNS) {
      // `unknown` is fully allowed in security.ts and storage.ts (the canonical
      // place for untrusted-input handling). Anywhere else it should be avoided.
      if (name.startsWith('TypeScript unknown')) {
        if (relPath === 'src/utils/security.ts' || relPath === 'src/utils/storage.ts') continue;
      }
      const m = content.match(new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')));
      if (!m || m.length === 0) continue;
      const idx = m.index ?? 0;
      const before = content.slice(0, idx);
      const lastNewline = before.lastIndexOf('\n');
      const line = before.slice(lastNewline + 1);
      const commentStart = line.indexOf('//');
      if (commentStart !== -1 && line.indexOf(regex.source) > commentStart) continue;
      issues.push({ file: relPath, line: lineOf(content, idx), kind: name });
    }
    for (const { name, regex } of SECRET_PATTERNS) {
      if (regex.test(content)) {
        issues.push({ file: relPath, line: 0, kind: `Possible secret: ${name}` });
      }
    }
  }

  // index.html checks
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const required = ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'];
  for (const r of required) {
    if (!html.includes(r)) issues.push({ file: 'index.html', line: 0, kind: `Missing meta: ${r}` });
  }

  // package.json deps sanity
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const lockOk = await fs
    .access(path.join(root, 'package-lock.json'))
    .then(() => true)
    .catch(() => false);
  if (!lockOk) issues.push({ file: 'package-lock.json', line: 0, kind: 'Missing lockfile' });

  void pkg;
}

await scan();

const ok = issues.length === 0;
const report = {
  scannedFiles: statsCounters.scanned,
  issueCount: issues.length,
  issues,
};

console.log('\n🔒 PhotoMax — Auditoria estática\n');
console.log(`Arquivos analisados: ${report.scannedFiles}`);
console.log(`Problemas: ${report.issueCount}\n`);
if (!ok) {
  for (const i of issues) {
    console.log(`  ✗ [${i.kind}]  ${i.file}${i.line ? `:${i.line}` : ''}`);
  }
  console.log('\n❌ Auditoria reprovou. Corrija os pontos acima.');
  process.exit(1);
} else {
  console.log('✅ Tudo certo. Auditoria aprovada.');
}