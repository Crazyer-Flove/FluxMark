import skinStyles from '../markdown-skins.css?raw';

export function buildExportHtml(htmlOutput: string, skin?: string) {
const skinAttribute = skin && /^[a-z]+$/.test(skin) ? ` data-markdown-skin="${skin}"` : '';
const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FluxMark Export</title>
    <style>
      :root { --accent:#315d8a; --bg-primary:#fff; --bg-secondary:#f4f5f7; --text-primary:#1e293b; --text-secondary:#475569; --border:#d5dce4; }
      body { font-family: -apple-system, system-ui, sans-serif; box-sizing:border-box; padding:clamp(20px,6vw,60px); max-width: 860px; margin: 0 auto; line-height: 1.8; color: var(--text-primary); background: var(--bg-primary); }
      .writing-canvas > main { margin-inline:auto; }
      pre, [data-type="block-math"] { max-width:100%; overflow-x:auto; }
      h1 { font-size: 2.5rem; font-bold; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-top: 40px; color: #000; }
      h2 { font-size: 1.8rem; font-bold; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      p { margin-bottom: 1.5rem; }
      img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 30px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      pre { background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto; color: #1e293b; margin: 25px 0; font-size: 0.9rem; }
      table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 8px; overflow: hidden; }
      th, td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; }
      th { background: #f8fafc; font-weight: bold; }
      blockquote { border-left: 5px solid var(--accent); padding: 10px 25px; font-style: italic; color: #64748b; background: #f8fafc; margin: 25px 0; border-radius: 0 8px 8px 0; }
      code:not(pre code) { background: #dbeafe; padding: 2px 6px; border-radius: 4px; color: #1e40af; font-family: monospace; }
      mark { background-color: #dbeafe; color: #1e40af; padding: 0 4px; border-radius: 2px; font-style: normal; }
      ${skinStyles}
    </style>
  </head>
  <body class="writing-canvas"${skinAttribute}><main class="w-full ProseMirror">${htmlOutput}</main></body>
  </html>
`;
  return fullHtml;
}
