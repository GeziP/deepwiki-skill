#!/usr/bin/env node
/**
 * md-to-html.js — Convert DeepWiki Markdown tech-docs to single-file HTML.
 *
 * Usage:
 *   node doc/deepwiki/md-to-html.js doc/tech-docs/Task_Design.md
 *   node doc/deepwiki/md-to-html.js --all          # convert all .md in doc/tech-docs/
 *   node doc/deepwiki/md-to-html.js --dry-run --all # preview without writing
 *
 * The script performs a structural conversion: markdown headings, tables, code blocks,
 * and lists are mapped to the HTML template's semantic components. ASCII diagrams are
 * preserved inside <pre> blocks. The output is a self-contained .html file.
 */

const fs = require('fs');
const path = require('path');

const TECH_DOCS_DIR = path.resolve(__dirname, '..', '..', '..', 'doc', 'tech-docs');
const TEMPLATE_PATH = path.resolve(__dirname, 'template.html');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const convertAll = args.includes('--all');
const shouldGenerateIndex = args.includes('--index');
const files = args.filter(a => !a.startsWith('--'));

if (!convertAll && !shouldGenerateIndex && files.length === 0) {
  console.log('Usage: node md-to-html.js [--all] [--index] [--dry-run] [file.md ...]');
  console.log('  --all      Convert all *_Design.md in tech-docs/');
  console.log('  --index    Generate index.html navigation page');
  console.log('  --dry-run  Preview without writing');
  process.exit(0);
}

function readTemplate() {
  const raw = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
  const scriptMatches = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  // Last <script> block is the main JS
  const lastScript = scriptMatches[scriptMatches.length - 1] || '';
  const jsMatch = lastScript.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return {
    css: styleMatch ? styleMatch[1] : '',
    js: jsMatch ? jsMatch[1] : ''
  };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseMdMeta(lines) {
  const meta = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\|\s*文档版本/.test(line) || /^\|\s*项目\s*\|/.test(line)) continue;
    if (/^\|[-\s|]+\|$/.test(line)) continue;
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim();
      // Chinese keys
      if (key === '文档版本' || key === 'Version') meta.version = val;
      else if (key === '编写日期' || key === 'Date') meta.writeDate = val;
      else if (key === '更新日期' || key === 'Updated') meta.updateDate = val;
      else if (key === '目标读者' || key === 'Audience') meta.audience = val;
      else if (key === '关联文档' || key === 'Related Docs') meta.relatedDocs = val;
      else if (key === '实现文件' || key === 'Source File') meta.implFile = val;
      else if (key === '测试文件' || key === 'Test File') meta.testFile = val;
    }
  }
  return meta;
}

function parseMarkdownSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentH2 = null;
  let currentBody = [];
  let metaLines = [];
  let inMeta = false;
  let title = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^# /.test(line) && !title) {
      title = line.replace(/^# /, '').trim();
      continue;
    }

    if (/^## 文档信息|^## Document Info/i.test(line)) { inMeta = true; continue; }
    if (inMeta) {
      if (/^---/.test(line) || /^## /.test(line)) {
        inMeta = false;
        if (/^## /.test(line)) i--;
      } else {
        metaLines.push(line);
      }
      continue;
    }

    if (/^## 目录|^## Table of Contents/i.test(line)) {
      while (i + 1 < lines.length && !(/^## /.test(lines[i + 1]) && !/^## 目录|^## Table of Contents/i.test(lines[i + 1]))) {
        i++;
        if (/^---/.test(lines[i + 1])) { i++; break; }
      }
      continue;
    }

    if (/^---$/.test(line)) continue;

    if (/^## /.test(line)) {
      if (currentH2) {
        sections.push({ heading: currentH2, body: currentBody.join('\n') });
      }
      currentH2 = line.replace(/^## /, '').trim();
      currentBody = [];
      continue;
    }

    currentBody.push(line);
  }
  if (currentH2) {
    sections.push({ heading: currentH2, body: currentBody.join('\n') });
  }

  const meta = parseMdMeta(metaLines);
  return { title, meta, sections };
}

function mdBodyToHtml(body) {
  const lines = body.split('\n');
  const out = [];
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];
  let inOl = false;
  let olItems = [];

  function flushList() {
    if (listItems.length) {
      out.push('<ul>');
      listItems.forEach(li => out.push(`  <li>${inlineMarkdown(li)}</li>`));
      out.push('</ul>');
      listItems = [];
      inList = false;
    }
  }

  function flushOl() {
    if (olItems.length) {
      out.push('<ol>');
      olItems.forEach(li => out.push(`  <li>${inlineMarkdown(li)}</li>`));
      out.push('</ol>');
      olItems = [];
      inOl = false;
    }
  }

  function flushTable() {
    if (tableRows.length < 2) { tableRows = []; inTable = false; return; }
    out.push('<div class="table-wrapper"><table>');
    const headers = tableRows[0];
    out.push('<thead><tr>' + headers.map(h => `<th>${inlineMarkdown(h)}</th>`).join('') + '</tr></thead>');
    out.push('<tbody>');
    for (let r = 2; r < tableRows.length; r++) {
      out.push('<tr>' + tableRows[r].map(c => `<td>${inlineMarkdown(c)}</td>`).join('') + '</tr>');
    }
    out.push('</tbody></table></div>');
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line)) {
      if (!inCode) {
        flushList();
        flushTable();
        inCode = true;
        codeLang = line.replace(/^```/, '').trim();
        codeLines = [];
      } else {
        const content = codeLines.join('\n');
        const isAsciiArt = !codeLang || codeLang === '' || /[┌└├─│▼▶◀]/.test(content);
        if (isAsciiArt && !codeLang) {
          out.push(`<figure class="code-block"><pre><code>${escapeHtml(content)}</code></pre></figure>`);
        } else {
          const lang = codeLang || '';
          out.push(`<figure class="code-block" data-lang="${lang}"><pre><code>${escapeHtml(content)}</code></pre></figure>`);
        }
        inCode = false;
        codeLang = '';
      }
      continue;
    }

    if (inCode) { codeLines.push(line); continue; }

    if (/^\|/.test(line)) {
      flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^[-*] /.test(line)) {
      flushOl(); flushTable();
      inList = true;
      listItems.push(line.replace(/^[-*] /, ''));
      continue;
    } else if (inList) {
      flushList();
    }

    if (/^\d+\. /.test(line)) {
      flushList(); flushOl(); flushTable();
      inOl = true;
      olItems.push(line.replace(/^\d+\. /, ''));
      continue;
    } else if (inOl) {
      flushOl();
    }

    if (/^### /.test(line)) {
      flushList(); flushOl(); flushTable();
      const heading = line.replace(/^### /, '').trim();
      out.push(`<h3>${inlineMarkdown(heading)}</h3>`);
      continue;
    }

    if (/^#### /.test(line)) {
      flushList(); flushOl(); flushTable();
      const heading = line.replace(/^#### /, '').trim();
      out.push(`<h4>${inlineMarkdown(heading)}</h4>`);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    flushList(); flushOl(); flushTable();
    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  flushList(); flushOl();
  flushTable();
  return out.join('\n');
}

function inlineMarkdown(text) {
  // First escape HTML entities in prose
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Then apply inline markdown transformations
  out = out
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function sectionId(heading) {
  const num = heading.match(/^(\d+)/);
  if (num) {
    const map = {
      '1': 'sec-overview', '2': 'sec-goals', '3': 'sec-arch',
      '4': 'sec-concepts', '5': 'sec-state', '6': 'sec-flow',
      '7': 'sec-impl', '8': 'sec-api', '9': 'sec-usage',
      '10': 'sec-faq', '11': 'sec-tests'
    };
    if (map[num[1]]) return map[num[1]];
  }
  if (/附录|appendix/i.test(heading)) return 'sec-appendix';
  return 'sec-' + heading.replace(/[^\w]/g, '').toLowerCase().slice(0, 20);
}

function shouldBeOpen(heading) {
  if (/^(1|2|3|4|7|8|9|11)\./.test(heading)) return true;
  if (/附录|常见问题|状态机|流程图|appendix|faq|state machine|flow diagram/i.test(heading)) return false;
  return true;
}

function buildHtml(parsed, template) {
  const { title, meta, sections } = parsed;
  const moduleName = title.replace(/ 技术设计文档$/, '').trim();

  const metaDl = [];
  if (meta.implFile) metaDl.push(`<dt>实现文件</dt><dd><code>${meta.implFile}</code></dd>`);
  if (meta.testFile) metaDl.push(`<dt>测试文件</dt><dd><code>${meta.testFile}</code></dd>`);
  if (meta.relatedDocs) metaDl.push(`<dt>关联文档</dt><dd>${inlineMarkdown(meta.relatedDocs)}</dd>`);
  if (meta.writeDate) metaDl.push(`<dt>编写日期</dt><dd>${meta.writeDate}</dd>`);
  if (meta.updateDate) metaDl.push(`<dt>更新日期</dt><dd>${meta.updateDate}</dd>`);

  const sectionsHtml = sections.map(s => {
    const id = sectionId(s.heading);
    const open = shouldBeOpen(s.heading) ? ' open' : '';
    const bodyHtml = mdBodyToHtml(s.body);
    return `
      <details${open} id="${id}">
        <summary><h2>${s.heading}</h2></summary>
        <div class="section-body">
${bodyHtml}
        </div>
      </details>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="deepwiki-html md-to-html">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
  <style>${template.css}</style>
</head>
<body data-doctype="tech-design">

  <nav class="topbar">
    <span class="topbar-brand">HDSA-MACO</span>
    <span class="topbar-sep">/</span>
    <span class="topbar-title">${escapeHtml(title)}</span>
    <div class="topbar-actions">
      <button class="topbar-btn menu-toggle" onclick="toggleSidebar()" title="目录">☰</button>
      <button class="topbar-btn" onclick="toggleTheme()" title="切换主题">◐</button>
      <button class="topbar-btn" onclick="window.print()" title="打印">⎙</button>
    </div>
  </nav>

  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <nav><ul class="toc-list" id="toc"></ul></nav>
    </aside>

    <article class="main" id="content">
      <header class="doc-meta">
        <span class="doc-version">${meta.version || 'V1.0'}</span>
        <h1>${escapeHtml(title)}</h1>
        <dl class="meta-grid">
          ${metaDl.join('\n          ')}
        </dl>
      </header>

${sectionsHtml}

    </article>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>${template.js}</script>
</body>
</html>`;
}

// --- Index Generation ---
const INDEX_TEMPLATE_PATH = path.resolve(__dirname, 'template-index.html');

// Module metadata for index page
const MODULE_META = {
  'CycleScheduler':             { group: 'scheduler',  desc: '周期循环调度：startCycle → 检查 → 规划 → 入队 → 开门 → 等待 → finishCycle' },
  'TaskManagementSystem':       { group: 'scheduler',  desc: '周期规划：加载任务、解析依赖、入队、启动' },
  'Task':                       { group: 'scheduler',  desc: '任务抽象基类，包含优先级、周期 ID、取消令牌、策略、钩子' },
  'Module':                     { group: 'scheduler',  desc: '任务分组，固定工作线程 + 优先级队列，信号等待，CycleGate 集成' },
  'CycleGate':                  { group: 'scheduler',  desc: '周期门控：同步所有模块的周期开始' },
  'SignalManager':              { group: 'signal',     desc: '信号管理：统一 SignalRef（含 cycleOffset），跨周期信号' },
  'SignalDependencyResolver':   { group: 'signal',     desc: '信号依赖解析' },
  'TaskConfig':                 { group: 'config',     desc: '任务配置数据结构' },
  'TaskConfigLoader':           { group: 'config',     desc: '任务配置：JSON 加载、周期/全局配置合并' },
  'V9_ConfigSystem':            { group: 'config',     desc: 'V9 配置系统设计' },
  'TaskTypes':                  { group: 'config',     desc: '任务类型定义与策略绑定' },
  'ActionExecutor':             { group: 'execution',  desc: '动作执行器接口（IActionExecutor）与注册表' },
  'ParamBag':                   { group: 'execution',  desc: '参数包（set / get / resolve 模板）' },
  'ReactionExpander':           { group: 'execution',  desc: '反应展开：相对周期展开、参数合并' },
  'ErrorCode_System':           { group: 'error',      desc: '错误码：8 位字段编码' },
  'ErrorPolicyEngine':          { group: 'error',      desc: '错误策略：CONTINUE / MODULE_STOP / GLOBAL_STOP' },
  'FaultBus':                   { group: 'error',      desc: '故障总线：故障报告、级联、历史（cap=1024）' },
  'CancellationToken':          { group: 'error',      desc: '取消令牌：任务/模块级取消' },
  'ConflictDetector':           { group: 'util',       desc: '冲突检测：资源冲突、ms 级重叠' },
  'TestManager':                { group: 'util',       desc: '测试管理：资源感知调度、测试所有权解析' },
  'EventLog':                   { group: 'logging',    desc: '基于 spdlog::async_logger 的轻量事件日志' },
  'Logging':                    { group: 'logging',    desc: '日志模块设计' },
  'ReactionMdExporter':         { group: 'logging',    desc: 'Reaction 配置导出为 Markdown 表格' },
  'ExportUtils':                { group: 'logging',    desc: '导出工具模块' },
};

const GROUP_LABELS = {
  scheduler:  '调度核心',
  signal:     '信号与依赖',
  config:     '配置系统',
  execution:  '执行与参数',
  error:      '错误处理',
  util:       '工具与测试',
  logging:    '日志与导出',
};

function generateIndex(projectName, projectDesc) {
  const indexPath = path.resolve(__dirname, 'template-index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('  ERROR template-index.html not found');
    process.exit(1);
  }

  const tpl = fs.readFileSync(indexPath, 'utf-8');

  // Scan for existing HTML files
  const htmlFiles = fs.readdirSync(TECH_DOCS_DIR)
    .filter(f => f.endsWith('_Design.html'))
    .map(f => {
      const name = f.replace('_Design.html', '');
      const meta = MODULE_META[name] || { group: 'logging', desc: name };
      return { name, file: f, ...meta };
    });

  // Build filter buttons
  const groups = [...new Set(htmlFiles.map(f => f.group))];
  const filterButtons = groups
    .filter(g => GROUP_LABELS[g])
    .map(g => `<button class="filter-btn" data-filter="${g}">${GROUP_LABELS[g]}</button>`)
    .join('\n    ');

  // Build card groups
  const cardGroups = [];
  const orderedGroups = ['scheduler', 'signal', 'config', 'execution', 'error', 'util', 'logging'];

  for (const group of orderedGroups) {
    const items = htmlFiles.filter(f => f.group === group);
    if (items.length === 0) continue;

    const label = GROUP_LABELS[group] || group;
    const cards = items.map(item => `
      <a class="card" href="${item.file}" data-group="${item.group}" data-keywords="${item.name.toLowerCase()}">
        <div class="card-name">${item.name}</div>
        <div class="card-desc">${item.desc}</div>
        <span class="card-tag">${label}</span>
      </a>`).join('\n');

    cardGroups.push(`
    <div class="group-label" data-group="${group}">${label}</div>
    <div class="card-grid" data-group="${group}">${cards}
    </div>`);
  }

  // Replace placeholders
  let html = tpl
    .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
    .replace(/\{\{PROJECT_DESC\}\}/g, projectDesc)
    .replace('{{FILTER_BUTTONS}}', filterButtons)
    .replace('{{CARD_GROUPS}}', cardGroups.join('\n'));

  if (dryRun) {
    console.log(`  DRY   index.html (${htmlFiles.length} modules)`);
  } else {
    const outPath = path.join(TECH_DOCS_DIR, 'index.html');
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`  OK    index.html (${htmlFiles.length} modules)`);
  }
}

// --- Main ---
const template = readTemplate();

if (shouldGenerateIndex) {
  const projectName = files[0] || 'HDSA-MACO';
  const projectDesc = files[1] || '硬件设备调度架构 — 模块设计文档集';
  generateIndex(projectName, projectDesc);
} else {
  let targets = [];
  if (convertAll) {
    targets = fs.readdirSync(TECH_DOCS_DIR)
      .filter(f => f.endsWith('_Design.md'))
      .map(f => path.join(TECH_DOCS_DIR, f));
  } else {
    targets = files.map(f => path.resolve(f));
  }

  let converted = 0;
  let skipped = 0;

  for (const mdPath of targets) {
    if (!fs.existsSync(mdPath)) {
      console.log(`  SKIP  ${mdPath} (not found)`);
      skipped++;
      continue;
    }

    const htmlPath = mdPath.replace(/\.md$/, '.html');
    if (fs.existsSync(htmlPath)) {
      console.log(`  SKIP  ${path.basename(mdPath)} (HTML already exists)`);
      skipped++;
      continue;
    }

    const md = fs.readFileSync(mdPath, 'utf-8');
    const parsed = parseMarkdownSections(md);
    const html = buildHtml(parsed, template);

    if (dryRun) {
      console.log(`  DRY   ${path.basename(mdPath)} → ${path.basename(htmlPath)} (${parsed.sections.length} sections)`);
    } else {
      fs.writeFileSync(htmlPath, html, 'utf-8');
      console.log(`  OK    ${path.basename(mdPath)} → ${path.basename(htmlPath)} (${parsed.sections.length} sections)`);
    }
    converted++;
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped${dryRun ? ' (dry run)' : ''}`);
}
