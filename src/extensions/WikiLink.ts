import { InputRule, Node, nodePasteRule } from '@tiptap/core';

export const wikiLinkSource = '\\[\\[([^\\[\\]|\\r\\n]+)(?:\\|([^\\[\\]|\\r\\n]+))?\\]\\]';

function attributes(match: RegExpMatchArray) {
  return { target: match[1].trim(), alias: match[2]?.trim() || '' };
}

export const WikiLink = Node.create({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      target: { default: '', parseHTML: el => el.dataset.wikiTarget, rendered: false },
      alias: { default: '', parseHTML: el => el.dataset.wikiAlias || '', rendered: false },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-wiki-target]' }];
  },
  renderHTML({ node }) {
    const { target, alias } = node.attrs;
    return ['span', { class: 'wiki-link', 'data-wiki-target': target, 'data-wiki-alias': alias,
      title: target, role: 'link', tabindex: '0' }, alias || target];
  },
  renderText({ node }) {
    return node.attrs.alias || node.attrs.target;
  },
  addStorage() {
    return { markdown: { serialize(state: { inTable?: boolean; text: (value: string, escape?: boolean) => void }, node: { attrs: Record<string, string> }) {
      const { target, alias } = node.attrs;
      const separator = state.inTable ? '\\|' : '|';
      state.text(`[[${target}${alias ? separator + alias : ''}]]`, false);
    } } };
  },
  addInputRules() {
    return [new InputRule({
      find: new RegExp('(?<!\\\\)' + wikiLinkSource + '$'),
      handler: ({ state, range, match }) => {
        const attrs = attributes(match);
        if (!attrs.target) return null;
        state.tr.replaceWith(range.from, range.to, this.type.create(attrs));
      },
    })];
  },
  addPasteRules() {
    return [nodePasteRule({
      find: new RegExp('(?<!\\\\)' + wikiLinkSource, 'g'),
      type: this.type,
      getAttributes: match => {
        const attrs = attributes(match);
        return attrs.target ? attrs : false;
      },
    })];
  },
});
