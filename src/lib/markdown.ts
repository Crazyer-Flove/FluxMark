import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Custom renderer to add Mac-style window controls to code blocks
 */
const renderer = new marked.Renderer();

// Marked v12+ uses an object for arguments
renderer.code = ({ text, lang }) => {
  const language = lang || 'text';
  const highlighted = lang && hljs.getLanguage(lang)
    ? hljs.highlight(text, { language: lang }).value
    : hljs.highlightAuto(text).value;

  return `
    <div class="code-block-wrapper">
      <div class="code-header">
        <div class="code-dot code-dot-red"></div>
        <div class="code-dot code-dot-yellow"></div>
        <div class="code-dot code-dot-green"></div>
        <span class="text-xs text-[var(--text-secondary)] ml-2 font-mono">${language}</span>
      </div>
      <pre><code class="hljs language-${language}">${highlighted}</code></pre>
    </div>
  `;
};

marked.use({ 
  renderer,
  breaks: true,
  gfm: true
});

/**
 * Pre-process markdown for KaTeX before passing to marked
 */
export const parseMarkdown = async (text: string): Promise<string> => {
  // Replace block math: $$...$$
  let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return `<div class="katex-display">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (e) {
      return match;
    }
  });

  // Replace inline math: $...$
  processed = processed.replace(/\$([\s\S]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // marked.parse returns a promise in modern versions if not explicitly told otherwise
  return marked.parse(processed);
};
