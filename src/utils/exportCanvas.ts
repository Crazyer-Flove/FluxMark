import html2canvas from 'html2canvas';
import {toCanvas} from 'html-to-image';
export const generateCanvasFromDom = async (
    element: HTMLElement,
    backgroundColor: string,
    scale: number = 2,
    editorHtml?: string,
    padding = '40px',
    printFriendly = false
  ): Promise<HTMLCanvasElement> => {
    // 1. Create a clean offscreen container positioned inside the viewport for reliable rendering
    const width = Math.max(element.offsetWidth || 800, 720);
    const container = document.createElement('div');
    container.id = 'fluxmark-export-render-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = `${width}px`;
    container.style.height = 'auto';
    container.style.minHeight = '400px';
    container.style.zIndex = '-9999';
    container.style.opacity = '0.99';
    container.style.pointerEvents = 'none';
    container.style.backgroundColor = backgroundColor;

    const rgb = backgroundColor.replace('#','').match(/.{2}/g)?.map(c=>parseInt(c,16)) || [255,255,255];
    const isDarkBg = (rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722) < 128;
    const textColor = isDarkBg ? '#f8fafc' : '#0f172a';
    container.style.color = textColor;
    container.style.padding = padding;
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    container.style.lineHeight = '1.7';
    container.style.fontSize = '15px';
    const skin = printFriendly ? undefined : element.dataset.markdownSkin;
    if (skin) {
      container.className = 'writing-canvas';
      container.dataset.markdownSkin = skin;
      container.style.display = 'block';
      container.style.maxWidth = 'none';
      container.style.setProperty('--bg-primary', backgroundColor);
      container.style.setProperty('--bg-secondary', isDarkBg ? '#1b2432' : '#f4f5f7');
      container.style.setProperty('--text-primary', textColor);
      container.style.setProperty('--text-secondary', isDarkBg ? '#bdc8d6' : '#475569');
      container.style.setProperty('--border', isDarkBg ? '#3d4b5d' : '#d5dce4');
      container.style.setProperty('--accent', isDarkBg ? '#9ec4ef' : '#315d8a');
    }

    if (editorHtml && editorHtml.trim()) {
      container.innerHTML = `
        <style>
          #fluxmark-export-render-container { box-sizing: border-box; word-break: break-word; }
          :where(#fluxmark-export-render-container) h1 { font-size: 2rem; font-weight: 800; margin-top: 1.2em; margin-bottom: 0.6em; line-height: 1.25; color: ${textColor}; }
          :where(#fluxmark-export-render-container) h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.3; color: ${textColor}; }
          :where(#fluxmark-export-render-container) h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.1em; margin-bottom: 0.4em; color: ${textColor}; }
          :where(#fluxmark-export-render-container) p { margin-top: 0; margin-bottom: 1em; line-height: 1.75; color: ${textColor}; }
          :where(#fluxmark-export-render-container) ul, #fluxmark-export-render-container ol { padding-left: 1.5em; margin-bottom: 1em; }
          :where(#fluxmark-export-render-container) li { margin-bottom: 0.35em; line-height: 1.6; }
          :where(#fluxmark-export-render-container) blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; margin-left: 0; margin-bottom: 1em; opacity: 0.88; font-style: italic; }
          :where(#fluxmark-export-render-container) pre { background: ${isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; padding: 1em; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; margin-bottom: 1em; white-space: pre-wrap; overflow-wrap:anywhere; }
          :where(#fluxmark-export-render-container) code { background: ${isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}; padding: 0.2em 0.4em; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
          :where(#fluxmark-export-render-container) pre code { background: none; padding: 0; }
          :where(#fluxmark-export-render-container) img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; display: block; }
          :where(#fluxmark-export-render-container) table { width: 100%; table-layout:fixed; overflow-wrap:anywhere; border-collapse: collapse; margin-bottom: 1em; }
          :where(#fluxmark-export-render-container) th, :where(#fluxmark-export-render-container) td { border: 1px solid ${isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}; padding: 8px 12px; text-align: left; }
          :where(#fluxmark-export-render-container) th { background: ${isDarkBg ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}; font-weight: 700; }
          :where(#fluxmark-export-render-container) hr { border: none; border-top: 1px solid ${isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}; margin: 2em 0; }
        </style>
        <div class="fluxmark-export-html-content${skin ? ' w-full ProseMirror' : ''}"${skin ? ' style="margin-inline:auto"' : ''}>
          ${editorHtml}
        </div>
      `;
    } else {
      const clone = element.cloneNode(true) as HTMLElement;
      // Strip buttons and overlays
      const toRemove = clone.querySelectorAll('button, script, iframe, .fixed, .pdf-export-modal-root, .toolbar-root');
      toRemove.forEach(el => el.remove());
      container.appendChild(clone);
    }

    document.body.appendChild(container);

    try {
      // Ensure all inline images are loaded before rendering canvas
      const imgs = Array.from(container.querySelectorAll('img'));
      if (imgs.length > 0) {
        await Promise.all(
          imgs.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          })
        );
      }

      // Attempt 1: html2canvas on container at requested scale
      try {
        const canvas = await html2canvas(container, {
          scale: scale,
          backgroundColor: backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          return canvas;
        }
      } catch (err1) {
        console.warn('html2canvas on export container failed:', err1);
      }

      // Attempt 2: html2canvas on container at scale 1
      try {
        const canvas = await html2canvas(container, {
          scale: 1,
          backgroundColor: backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          return canvas;
        }
      } catch (err2) {
        console.warn('html2canvas scale 1 failed:', err2);
      }

      // Attempt 3: toCanvas (html-to-image) on container
      try {
        const emptyPlaceholder =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU55ErJggg==';
        const c3 = await toCanvas(container, {
          pixelRatio: scale,
          backgroundColor: backgroundColor,
          skipFonts: true,
          fontEmbedCSS: '',
          imagePlaceholder: emptyPlaceholder,
        });
        if (c3 && c3.width > 0 && c3.height > 0) {
          return c3;
        }
      } catch (err3) {
        console.warn('toCanvas on container failed:', err3);
      }

      // Attempt 4: html2canvas directly on the live element
      try {
        if (editorHtml !== undefined) throw new Error('Keep export-only content in the offscreen rendering path');
        const canvas = await html2canvas(element, {
          scale: scale,
          backgroundColor: backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          ignoreElements: (node) => {
            if (node.tagName) {
              const tag = node.tagName.toLowerCase();
              if (['script', 'iframe', 'button'].includes(tag)) return true;
              if (
                node.classList &&
                (node.classList.contains('fixed') ||
                  node.classList.contains('pdf-export-modal-root') ||
                  node.classList.contains('toolbar-root'))
              ) {
                return true;
              }
            }
            return false;
          },
        });
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          return canvas;
        }
      } catch (err4) {
        console.warn('html2canvas live element failed:', err4);
      }

      // Ultimate Fallback: Direct 2D Canvas layout engine
      const fallbackCanvas = document.createElement('canvas');
      const containerHeight = Math.max(container.offsetHeight || 600, 400);
      fallbackCanvas.width = Math.round(width * scale);
      fallbackCanvas.height = Math.round(containerHeight * scale);
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, containerHeight);

        ctx.fillStyle = textColor;
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        const textContent = container.innerText || element.innerText || 'FluxMark Document';
        const lines = textContent.split('\n');
        let currentY = 40;
        for (const line of lines) {
          if (currentY > containerHeight - 20) break;
          if (line.trim()) {
            ctx.fillText(line.slice(0, 90), 32, currentY);
            currentY += 24;
          } else {
            currentY += 12;
          }
        }
        return fallbackCanvas;
      }

      throw new Error('Canvas render failed on all attempts');
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

