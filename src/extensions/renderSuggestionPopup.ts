interface RenderSuggestionOptions<T> {
  type: 'heading' | 'emoji';
  title: string;
  renderItem: (item: T, isSelected: boolean) => string;
}

export function createSuggestionRenderer<T>(options: RenderSuggestionOptions<T>) {
  return () => {
    let container: HTMLDivElement | null = null;
    let selectedIndex = 0;
    let currentProps: any = null;

    const updatePosition = () => {
      if (!container || !currentProps?.clientRect) return;
      const rect = currentProps.clientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.left;
      let top = rect.bottom + 6;

      // Ensure container fits horizontally
      if (left + 240 > viewportWidth) {
        left = Math.max(10, viewportWidth - 250);
      }

      // If bottom overflows, position above caret
      if (top + 260 > viewportHeight) {
        top = Math.max(10, rect.top - 260);
      }

      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
    };

    const render = () => {
      if (!container || !currentProps) return;

      const items: T[] = currentProps.items || [];
      if (items.length === 0) {
        container.innerHTML = `
          <div class="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 font-sans italic text-center select-none">
            未找到匹配项
          </div>
        `;
        return;
      }

      // Clamp selectedIndex
      if (selectedIndex >= items.length) {
        selectedIndex = 0;
      }

      const listHtml = items
        .map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return `
            <div 
              data-index="${idx}"
              class="suggestion-item cursor-pointer px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between select-none ${
                isSelected
                  ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-950/70 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }"
            >
              ${options.renderItem(item, isSelected)}
            </div>
          `;
        })
        .join('');

      container.innerHTML = `
        <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl p-1 w-60 max-h-64 overflow-y-auto font-sans text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 z-[99999]">
          <div class="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-0.5 flex items-center justify-between">
            <span>${options.title}</span>
            <span class="font-normal normal-case text-[9px] text-slate-400 font-mono">↑↓ 移动 ↵ 确认</span>
          </div>
          ${listHtml}
        </div>
      `;

      // Add click & hover listeners
      const itemEls = container.querySelectorAll('.suggestion-item');
      itemEls.forEach((el) => {
        const index = parseInt(el.getAttribute('data-index') || '0', 10);
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const selectedItem = items[index];
          if (selectedItem) {
            currentProps.command(selectedItem);
          }
        });
        el.addEventListener('mouseenter', () => {
          selectedIndex = index;
          render();
        });
      });

      // Scroll active item into view
      const activeEl = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }

      updatePosition();
    };

    return {
      onStart: (props: any) => {
        currentProps = props;
        selectedIndex = 0;

        container = document.createElement('div');
        container.className = 'tiptap-suggestion-popover';
        container.style.position = 'fixed';
        container.style.zIndex = '99999';
        document.body.appendChild(container);

        render();
      },

      onUpdate: (props: any) => {
        currentProps = props;
        render();
      },

      onKeyDown: (props: any) => {
        if (!currentProps || !currentProps.items || currentProps.items.length === 0) {
          return false;
        }

        const items = currentProps.items;

        if (props.event.key === 'ArrowUp') {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          render();
          return true;
        }

        if (props.event.key === 'ArrowDown') {
          selectedIndex = (selectedIndex + 1) % items.length;
          render();
          return true;
        }

        if (props.event.key === 'Enter' || props.event.key === 'Tab') {
          const selectedItem = items[selectedIndex];
          if (selectedItem) {
            currentProps.command(selectedItem);
            return true;
          }
        }

        if (props.event.key === 'Escape') {
          if (container) {
            container.remove();
            container = null;
          }
          return true;
        }

        return false;
      },

      onExit: () => {
        if (container) {
          container.remove();
          container = null;
        }
      },
    };
  };
}
