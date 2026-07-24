import { Editor } from '@tiptap/react';

export function executeSmartFormat(editor: Editor | null, showToast: (msg: string) => void) {
  if (!editor) return;

  try {
    const html = editor.getHTML();
    if (!html || html === '<p></p>') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 递归处理文本节点
    const processTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        if (!text) return;

        // 1. 中英文及数字之间自动规范增加空格 (盘古排版)
        text = text.replace(/([\u4e00-\u9fa5\u3040-\u30ff])([A-Za-z0-9])/g, '$1 $2');
        text = text.replace(/([A-Za-z0-9])([\u4e00-\u9fa5\u3040-\u30ff])/g, '$1 $2');

        // 2. 修正连续的多余普通空格与制表符
        text = text.replace(/[ \t]{2,}/g, ' ');

        // 3. 规范中文全角标点两侧的冗余空格
        text = text.replace(/\s*([，。！？：；“”‘’（）《》【】])\s*/g, '$1');

        // 4. 英文标点后面保留规范单空格
        text = text.replace(/([a-zA-Z0-9]),([a-zA-Z])/g, '$1, $2');
        text = text.replace(/([a-zA-Z0-9]):([a-zA-Z])/g, '$1: $2');

        node.textContent = text;
      } else {
        const el = node as HTMLElement;
        // 跳过代码块与数学公式节点
        if (
          node.nodeName === 'PRE' || 
          node.nodeName === 'CODE' || 
          el.classList?.contains('katex') || 
          el.getAttribute?.('data-type') === 'mathInline' ||
          el.getAttribute?.('data-type') === 'mathBlock'
        ) {
          return;
        }
        node.childNodes.forEach(processTextNodes);
      }
    };

    processTextNodes(doc.body);

    // 清理超过 1 行的连续空段落
    const paragraphs = Array.from(doc.body.querySelectorAll('p'));
    let emptyCount = 0;
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim() || '';
      const hasMedia = p.querySelector('img, video, iframe, svg, input');
      if (!text && !hasMedia && p.children.length === 0) {
        emptyCount++;
        if (emptyCount > 1) {
          p.remove();
        }
      } else {
        emptyCount = 0;
      }
    });

    // 清理无内容的空白列表项
    doc.body.querySelectorAll('li').forEach(li => {
      if (!li.textContent?.trim() && li.children.length === 0) {
        li.remove();
      }
    });

    const formattedHtml = doc.body.innerHTML;
    editor.commands.setContent(formattedHtml);
    editor.commands.focus();
    showToast('✨ 已完成文档智能格式重排与排版优化！');
  } catch (e) {
    console.error('Smart format error:', e);
    showToast('智能排版处理遇到微小异常，请重试');
  }
}
