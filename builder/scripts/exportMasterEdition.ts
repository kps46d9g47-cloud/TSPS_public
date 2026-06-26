import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';

const REPO_ROOT = new URL('../../', import.meta.url);
const MASTER_MD = new URL('build/master_edition.md', REPO_ROOT);
const DIST_DIR = new URL('dist/', REPO_ROOT);
const REPORTS_DIR = new URL('reports/', REPO_ROOT);
const DOCX_OUT = new URL('master_edition_v1.0.docx', DIST_DIR);
const PDF_OUT = new URL('master_edition_v1.0.pdf', DIST_DIR);
const REPORT_OUT = new URL('export_report.json', REPORTS_DIR);

interface ParsedLine {
  type: 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'separator' | 'paragraph' | 'blank';
  text: string;
}

function parseMarkdown(markdown: string): ParsedLine[] {
  return markdown.split(/\r?\n/).map((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) return { type: 'blank', text: '' };
    if (/^-{3,}$/.test(trimmed)) return { type: 'separator', text: '' };
    if (trimmed.startsWith('### ')) return { type: 'heading3', text: trimmed.slice(4).trim() };
    if (trimmed.startsWith('## ')) return { type: 'heading2', text: trimmed.slice(3).trim() };
    if (trimmed.startsWith('# ')) return { type: 'heading1', text: trimmed.slice(2).trim() };
    if (trimmed.startsWith('* ')) return { type: 'bullet', text: trimmed.slice(2).trim() };
    if (/^[0-9]+\.\s+/.test(trimmed)) return { type: 'numbered', text: trimmed };
    return { type: 'paragraph', text: trimmed };
  });
}

function markdownToDocx(lines: ParsedLine[]): Document {
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.type === 'blank') {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    if (line.type === 'separator') {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    if (line.type === 'heading1') {
      children.push(new Paragraph({ text: line.text, heading: HeadingLevel.TITLE }));
      continue;
    }

    if (line.type === 'heading2') {
      children.push(new Paragraph({ text: line.text, heading: HeadingLevel.HEADING_1 }));
      continue;
    }

    if (line.type === 'heading3') {
      children.push(new Paragraph({ text: line.text, heading: HeadingLevel.HEADING_2 }));
      continue;
    }

    if (line.type === 'bullet') {
      children.push(new Paragraph({ text: line.text, bullet: { level: 0 } }));
      continue;
    }

    children.push(new Paragraph({ children: [new TextRun(line.text)] }));
  }

  return new Document({
    creator: 'TSPS Builder',
    title: 'TSPS Master Edition v1.0',
    description: 'Exported from Frozen Canonical Repository via TSPS export engine.',
    sections: [{ properties: {}, children }],
  });
}

async function writePdf(lines: ParsedLine[], outputUrl: URL): Promise<void> {
  await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'TSPS Master Edition v1.0' } });
    const stream = createWriteStream(fileURLToPath(outputUrl));
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    for (const line of lines) {
      if (line.type === 'blank' || line.type === 'separator') {
        doc.moveDown(0.7);
        continue;
      }

      if (line.type === 'heading1') {
        doc.moveDown(0.5).fontSize(22).font('Helvetica-Bold').text(line.text, { align: 'left' }).moveDown(0.6);
        continue;
      }

      if (line.type === 'heading2') {
        doc.moveDown(0.5).fontSize(16).font('Helvetica-Bold').text(line.text, { align: 'left' }).moveDown(0.3);
        continue;
      }

      if (line.type === 'heading3') {
        doc.moveDown(0.3).fontSize(13).font('Helvetica-Bold').text(line.text, { align: 'left' }).moveDown(0.2);
        continue;
      }

      if (line.type === 'bullet') {
        doc.fontSize(10).font('Helvetica').text(`• ${line.text}`, { align: 'left', indent: 18 });
        continue;
      }

      doc.fontSize(10).font('Helvetica').text(line.text, { align: 'left' });
    }

    doc.end();
  });
}

async function writeJson(url: URL, value: unknown): Promise<void> {
  await mkdir(dirname(fileURLToPath(url)), { recursive: true });
  await writeFile(url, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const markdown = await readFile(MASTER_MD, 'utf8');
  const lines = parseMarkdown(markdown);

  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(REPORTS_DIR, { recursive: true });

  const docx = markdownToDocx(lines);
  const docxBuffer = await Packer.toBuffer(docx);
  await writeFile(DOCX_OUT, docxBuffer);
  await writePdf(lines, PDF_OUT);

  const report = {
    project: 'TSPS',
    phase: 'Phase E Sprint 6B',
    status: 'PASS',
    source: 'build/master_edition.md',
    generatedArtifacts: [
      'dist/master_edition_v1.0.docx',
      'dist/master_edition_v1.0.pdf',
      'reports/export_report.json'
    ],
    canonicalRepositoryModified: false,
    knowledgeGraphModified: false,
    builderPipelineModified: false,
    exportEngine: 'builder/scripts/exportMasterEdition.ts',
    notes: [
      'DOCX and PDF exports are generated from build/master_edition.md.',
      'PDF export uses built-in PDF fonts and preserves text content with simplified Markdown formatting.',
      'DOCX export maps Markdown headings and bullet lines into Word document paragraphs.'
    ]
  };

  await writeJson(REPORT_OUT, report);

  console.log(JSON.stringify({
    ok: true,
    generatedArtifacts: report.generatedArtifacts,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
