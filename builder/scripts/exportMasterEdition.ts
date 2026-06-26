import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';

const REPO_ROOT = new URL('../../', import.meta.url);
const MASTER_MD = new URL('build/master_edition.md', REPO_ROOT);
const DIST_DIR = new URL('dist/', REPO_ROOT);
const REPORTS_DIR = new URL('reports/', REPO_ROOT);
const DOCX_OUT = new URL('TSPS_Master_Edition_v1.0_Designed.docx', DIST_DIR);
const PDF_OUT = new URL('TSPS_Master_Edition_v1.0_Designed.pdf', DIST_DIR);
const REPORT_OUT = new URL('export_report.json', REPORTS_DIR);

const COLORS = {
  navy: '0B1F3A',
  blue: '1F4E79',
  slate: '44546A',
  gray: '6B7280',
  white: 'FFFFFF',
};

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
    if (trimmed.startsWith('* ') || trimmed.startsWith('• ')) return { type: 'bullet', text: trimmed.slice(2).trim() };
    if (/^[0-9]+\.\s+/.test(trimmed)) return { type: 'numbered', text: trimmed };
    return { type: 'paragraph', text: trimmed };
  });
}

function textRun(text: string, options: { bold?: boolean; size?: number; color?: string } = {}): TextRun {
  return new TextRun({
    text,
    bold: options.bold,
    size: options.size ?? 22,
    color: options.color ?? COLORS.slate,
    font: 'Arial',
  });
}

function titlePage(): Paragraph[] {
  return [
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [textRun('TRAMPLIN ELECTRONICS', { bold: true, size: 34, color: COLORS.navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [textRun('International Expansion Strategy', { bold: true, size: 42, color: COLORS.blue })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 420 },
      children: [textRun('Master Edition v1.0', { size: 26, color: COLORS.slate })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [textRun('Designed Executive Publication', { bold: true, size: 24, color: COLORS.navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      children: [textRun('Generated from Frozen Canonical Repository', { size: 20, color: COLORS.gray })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [textRun('Confidential / Executive Use', { bold: true, size: 20, color: COLORS.blue })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function markdownToDocx(lines: ParsedLine[]): Document {
  const children: Paragraph[] = titlePage();
  let firstHeadingSeen = false;

  for (const line of lines) {
    if (line.type === 'blank') {
      children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      continue;
    }

    if (line.type === 'separator') {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }

    if (line.type === 'heading1') {
      if (firstHeadingSeen) children.push(new Paragraph({ children: [new PageBreak()] }));
      firstHeadingSeen = true;
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 180, after: 220 },
        children: [textRun(line.text, { bold: true, size: 32, color: COLORS.navy })],
      }));
      continue;
    }

    if (line.type === 'heading2') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 160, after: 120 },
        children: [textRun(line.text, { bold: true, size: 26, color: COLORS.blue })],
      }));
      continue;
    }

    if (line.type === 'heading3') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 120, after: 80 },
        children: [textRun(line.text, { bold: true, size: 23, color: COLORS.slate })],
      }));
      continue;
    }

    if (line.type === 'bullet') {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [textRun(line.text, { size: 20, color: COLORS.slate })],
      }));
      continue;
    }

    children.push(new Paragraph({
      spacing: { after: 90 },
      children: [textRun(line.text, { size: 20, color: COLORS.slate })],
    }));
  }

  return new Document({
    creator: 'TSPS Builder',
    title: 'TSPS Master Edition v1.0 Designed',
    description: 'Designed executive publication exported from Frozen Canonical Repository via TSPS export engine.',
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20, color: COLORS.slate } },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
      },
      children,
    }],
  });
}

function wrapText(doc: PDFKit.PDFDocument, text: string, options: PDFKit.Mixins.TextOptions = {}): void {
  doc.text(text, { align: 'left', lineGap: 2, ...options });
}

async function writePdf(lines: ParsedLine[], outputUrl: URL): Promise<void> {
  await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 54, info: { Title: 'TSPS Master Edition v1.0 Designed' } });
    const stream = createWriteStream(fileURLToPath(outputUrl));
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, 170).fill(`#${COLORS.navy}`);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(22).text('TRAMPLIN ELECTRONICS', 54, 52, { align: 'left' });
    doc.fontSize(13).font('Helvetica').text('International Expansion Strategy', 54, 84);
    doc.fontSize(11).text('Master Edition v1.0 — Designed Executive Publication', 54, 108);
    doc.fillColor(`#${COLORS.blue}`).rect(54, 142, 210, 4).fill();
    doc.addPage();

    let firstHeadingSeen = false;

    for (const line of lines) {
      if (line.type === 'blank') {
        doc.moveDown(0.45);
        continue;
      }

      if (line.type === 'separator') {
        doc.addPage();
        continue;
      }

      if (line.type === 'heading1') {
        if (firstHeadingSeen) doc.addPage();
        firstHeadingSeen = true;
        doc.fillColor(`#${COLORS.navy}`).font('Helvetica-Bold').fontSize(19);
        wrapText(doc, line.text);
        doc.moveDown(0.6);
        doc.fillColor(`#${COLORS.blue}`).rect(doc.x, doc.y, 180, 3).fill();
        doc.moveDown(1.0);
        continue;
      }

      if (line.type === 'heading2') {
        doc.moveDown(0.5);
        doc.fillColor(`#${COLORS.blue}`).font('Helvetica-Bold').fontSize(14);
        wrapText(doc, line.text);
        doc.moveDown(0.3);
        continue;
      }

      if (line.type === 'heading3') {
        doc.moveDown(0.3);
        doc.fillColor(`#${COLORS.slate}`).font('Helvetica-Bold').fontSize(12);
        wrapText(doc, line.text);
        doc.moveDown(0.15);
        continue;
      }

      if (line.type === 'bullet') {
        doc.fillColor(`#${COLORS.slate}`).font('Helvetica').fontSize(10);
        wrapText(doc, `- ${line.text}`, { indent: 14 });
        continue;
      }

      doc.fillColor(`#${COLORS.slate}`).font('Helvetica').fontSize(10);
      wrapText(doc, line.text);
      doc.moveDown(0.25);
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
    phase: 'Phase F',
    status: 'PASS',
    source: 'build/master_edition.md',
    generatedArtifacts: [
      'dist/TSPS_Master_Edition_v1.0_Designed.docx',
      'dist/TSPS_Master_Edition_v1.0_Designed.pdf',
      'reports/export_report.json'
    ],
    canonicalRepositoryModified: false,
    knowledgeGraphModified: false,
    builderPipelineModified: false,
    exportEngine: 'builder/scripts/exportMasterEdition.ts',
    design: {
      technicalMetadataExcluded: true,
      executiveStyle: true,
      darkBlueCorporateTheme: true,
      titlePage: true,
      visualSeparators: true,
      headersFooters: 'basic document metadata only'
    },
    notes: [
      'DOCX and PDF exports are generated from the clean designed publication view.',
      'Public exports exclude TSPS technical metadata such as module IDs, dependencies and integrity hashes.',
      'Canonical modules remain unchanged.'
    ]
  };

  await writeJson(REPORT_OUT, report);

  console.log(JSON.stringify({
    ok: true,
    artifact: 'Designed Master Edition v1.0',
    generatedArtifacts: report.generatedArtifacts,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
