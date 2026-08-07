import Image from 'tiptap-extension-resize-image';
import { getMediaBlobUrl } from '../utils/mediaRegistry';

export const CustomImage = Image.extend({
  addNodeView() {
    const parentNodeView = this.parent ? this.parent() : null;

    return (props) => {
      const res = parentNodeView ? parentNodeView(props) : null;
      if (res && res.dom) {
        const imgEl = (res.dom as HTMLElement).querySelector('img');
        if (imgEl) {
          const rawSrc = props.node.attrs.src;
          const resolved = getMediaBlobUrl(rawSrc) || rawSrc;
          if (resolved) {
            imgEl.src = resolved;
            imgEl.setAttribute('data-relative-src', rawSrc || '');
          }
        }

        if (res.update) {
          const oldUpdate = res.update;
          res.update = (node, decorations, innerDecorations) => {
            const updated = oldUpdate(node, decorations, innerDecorations);
            if (updated) {
              const updatedImg = (res.dom as HTMLElement).querySelector('img');
              if (updatedImg) {
                const rawSrc = node.attrs.src;
                const resolved = getMediaBlobUrl(rawSrc) || rawSrc;
                if (resolved) {
                  updatedImg.src = resolved;
                  updatedImg.setAttribute('data-relative-src', rawSrc || '');
                }
              }
            }
            return updated;
          };
        }
      }
      return res;
    };
  },
});
