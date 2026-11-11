import * as docx from 'docx';
import type {JSONContent} from '@tiptap/react';
import {createLowlight, common} from 'lowlight';
import {getMediaBlobUrl} from './mediaRegistry';
const lowlight = createLowlight(common);
export async function buildWordDocument(json: JSONContent) {


// Theme colors
const accentColor = '1161F3'; // Hex without # for docx
const borderColor = 'E2E8F0';
const textColor = '1E293B';
const secondaryTextColor = '64748B';
const bgSecondary = 'F8FAFC';
const highlightColor = 'DBEAFE';

const children: any[] = [];

const parseNodes = async (nodes: any[], listLevel = 0, listType?: 'bullet' | 'ordered') => {
  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs.level || 1;
        children.push(
          new docx.Paragraph({
            text: node.content?.map((c: any) => c.text).join('') || '',
            heading: level === 1 ? docx.HeadingLevel.HEADING_1 : level === 2 ? docx.HeadingLevel.HEADING_2 : docx.HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
            border: level <= 2 ? {
              bottom: { color: level === 1 ? accentColor : borderColor, space: 10, style: docx.BorderStyle.SINGLE, size: level === 1 ? 24 : 12 },
            } : undefined,
          })
        );
        break;
      }
      case 'paragraph': {
        const runs = node.content?.map((c: any) => {
          if (c.type === 'text') {
            return new docx.TextRun({
              text: c.text,
              bold: c.marks?.some((m: any) => m.type === 'bold'),
              italics: c.marks?.some((m: any) => m.type === 'italic'),
              color: c.marks?.find((m: any) => m.type === 'textStyle')?.attrs?.color?.replace('#', '') || textColor,
              shading: c.marks?.some((m: any) => m.type === 'highlight') ? {
                type: docx.ShadingType.CLEAR,
                fill: highlightColor,
                color: 'auto',
              } : undefined,
            });
          } else if (c.type === 'inlineMath') {
            return new docx.TextRun({
              text: `$${c.attrs.latex}$`,
              color: accentColor,
              italics: true,
              font: 'Cambria Math',
            });
          }
          return null;
        }).filter(Boolean);

        const paragraphConfig: any = {
          children: runs || [],
          spacing: { line: 360, after: 200 },
        };

        if (listType === 'bullet') {
          paragraphConfig.bullet = { level: listLevel - 1 };
          paragraphConfig.spacing.after = 120;
        } else if (listType === 'ordered') {
          paragraphConfig.numbering = { reference: 'main-numbering', level: listLevel - 1 };
          paragraphConfig.spacing.after = 120;
        }

        children.push(new docx.Paragraph(paragraphConfig));
        break;
      }
      case 'bulletList':
        if (node.content) await parseNodes(node.content, listLevel + 1, 'bullet');
        break;
      case 'orderedList':
        if (node.content) await parseNodes(node.content, listLevel + 1, 'ordered');
        break;
      case 'listItem': {
        if (node.content) await parseNodes(node.content, listLevel);
        break;
      }
      case 'table': {
        const rows = node.content?.map((row: any) => {
          const cells = row.content?.map((cell: any) => {
            const cellChildren: any[] = [];
            cell.content?.forEach((p: any) => {
              const runs = p.content?.map((c: any) => new docx.TextRun({ text: c.text, bold: c.marks?.some((m: any) => m.type === 'bold') })) || [];
              cellChildren.push(new docx.Paragraph({ children: runs }));
            });
            return new docx.TableCell({
              children: cellChildren,
              verticalAlign: docx.VerticalAlign.CENTER,
              borders: {
                top: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                left: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                right: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
              },
            });
          }) || [];
          return new docx.TableRow({ children: cells });
        }) || [];
        children.push(new docx.Table({ rows, width: { size: 100, type: docx.WidthType.PERCENTAGE } }));
        break;
      }
      case 'blockquote': {
        const quoteText = node.content?.map((p: any) => p.content?.map((c: any) => c.text).join('')).join('\n') || '';
        children.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: quoteText, italics: true, color: secondaryTextColor })],
            indent: { left: 720 },
            shading: { type: docx.ShadingType.CLEAR, fill: bgSecondary },
            border: {
              left: { color: accentColor, space: 10, style: docx.BorderStyle.SINGLE, size: 24 },
            },
            spacing: { before: 200, after: 200, line: 360 },
          })
        );
        break;
      }
      case 'horizontalRule':
        children.push(
          new docx.Paragraph({
            border: { bottom: { color: borderColor, space: 1, style: docx.BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 200, after: 200 },
          })
        );
        break;
      case 'codeBlock': {
        const codeText = node.content?.map((c: any) => c.text).join('') || '';
        const language = node.attrs?.language || 'javascript';
        
        const hljsToHex: Record<string, string> = {
          'hljs-keyword': '0550AE',
          'hljs-selector-tag': '0550AE',
          'hljs-built_in': '0550AE',
          'hljs-string': '116329',
          'hljs-attr': '116329',
          'hljs-number': '0550AE',
          'hljs-literal': '0550AE',
          'hljs-comment': '6E7781',
          'hljs-quote': '6E7781',
          'hljs-title': '8250DF',
          'hljs-section': '8250DF',
          'hljs-name': '8250DF',
          'hljs-variable': '953800',
          'hljs-template-variable': '953800',
          'hljs-type': '0550AE',
          'hljs-tag': '116329',
          'hljs-punctuation': '1B1F24',
        };

        const cellChildren: any[] = [];
        
        cellChildren.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({ text: ' ● ● ●  ', color: 'CBD5E1', size: 16 }),
              new docx.TextRun({ text: language.toUpperCase(), font: 'Consolas', size: 16, color: '64748B', bold: true })
            ],
            spacing: { after: 100 },
          })
        );

        try {
          const highlighted = lowlight.highlight(language, codeText);
          const linesOfRuns: docx.TextRun[][] = [[]];
          
          const processNode = (n: any, currentClasses: string[] = []) => {
            if (n.type === 'text') {
              const segments = n.value.split('\n');
              segments.forEach((segment: string, i: number) => {
                if (i > 0) linesOfRuns.push([]);
                if (segment) {
                  const color = currentClasses.reduce((acc, cls) => hljsToHex[cls] || acc, textColor);
                  linesOfRuns[linesOfRuns.length - 1].push(
                    new docx.TextRun({ 
                      text: segment, 
                      font: 'Consolas', 
                      size: 19,
                      color: color,
                      bold: currentClasses.some(cls => cls === 'hljs-keyword' || cls === 'hljs-title')
                    })
                  );
                }
              });
            } else if (n.children) {
              const newClasses = [...currentClasses, ...(n.properties?.className || [])];
              n.children.forEach((child: any) => processNode(child, newClasses));
            }
          };

          highlighted.children.forEach(n => processNode(n));

          linesOfRuns.forEach(runs => {
            cellChildren.push(
              new docx.Paragraph({
                children: runs,
                spacing: { before: 0, after: 0, line: 240 },
              })
            );
          });
        } catch (err) {
          codeText.split('\n').forEach(line => {
            cellChildren.push(
              new docx.Paragraph({
                children: [new docx.TextRun({ text: line, font: 'Consolas', size: 19, color: textColor })],
                spacing: { before: 0, after: 0, line: 240 },
              })
            );
          });
        }

        children.push(
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: cellChildren,
                    shading: { type: docx.ShadingType.CLEAR, fill: 'F8FAFC' },
                    borders: {
                      top: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                      bottom: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                      left: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                      right: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                    },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                  })
                ]
              })
            ]
          })
        );
        children.push(new docx.Paragraph({ spacing: { after: 200 } }));
        break;
      }
      case 'image':
      case 'imageResize': {
        const rawSrc = node.attrs?.src;
        const imgSrc = rawSrc ? (getMediaBlobUrl(rawSrc) || rawSrc) : '';
        if (imgSrc) {
          try {
            const res = await fetch(imgSrc);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            children.push(
              new docx.Paragraph({
                children: [
                  new docx.ImageRun({
                    data: arrayBuffer,
                    transformation: {
                      width: node.attrs?.width ? Math.min(parseInt(node.attrs.width), 550) : 500,
                      height: node.attrs?.height ? parseInt(node.attrs.height) : 300,
                    },
                  } as any),
                ],
                alignment: docx.AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            );
          } catch (err) {
            children.push(
              new docx.Paragraph({
                children: [new docx.TextRun({ text: `[图片: ${node.attrs?.alt || rawSrc}]`, italics: true, color: secondaryTextColor })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            );
          }
        }
        break;
      }
      case 'blockMath': {
        children.push(
          new docx.Paragraph({
            children: [new docx.TextRun({ text: `$$${node.attrs.latex}$$`, color: accentColor, font: 'Cambria Math' })],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
        break;
      }
    }
  }
};

if (json.content) await parseNodes(json.content);

const doc = new docx.Document({
  numbering: {
    config: [
      {
        reference: "main-numbering",
        levels: [
          { level: 0, format: docx.LevelFormat.DECIMAL, text: "%1.", alignment: docx.AlignmentType.START },
          { level: 1, format: docx.LevelFormat.DECIMAL, text: "%1.%2.", alignment: docx.AlignmentType.START },
          { level: 2, format: docx.LevelFormat.DECIMAL, text: "%1.%2.%3.", alignment: docx.AlignmentType.START },
        ],
      },
    ],
  },
  sections: [{
    properties: {},
    children: children,
  }],
  styles: {
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 56, // 28pt
          bold: true,
          color: accentColor,
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 40, // 20pt
          bold: true,
          color: '334155',
        },
      }
    ]
  }
});

const blob = await docx.Packer.toBlob(doc);
return blob;
}
