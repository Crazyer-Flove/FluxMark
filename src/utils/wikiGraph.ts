import type { ResourceItem } from '../types';
import type { Draft } from './drafts';

export interface WikiNote {
  id: string;
  title: string;
  path: string;
  resource?: ResourceItem;
  draft?: Draft;
}

export function resourceNotes(resources: ResourceItem[]): WikiNote[] {
  return resources.flatMap(item => {
    if (item.type === 'folder') return resourceNotes(item.children ?? []);
    if (item.type !== 'file') return [];
    return [{ id: 'file:' + item.id, title: item.name, path: item.relativePath, resource: item }];
  });
}

export function wikiTargets(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return [...new Set(Array.from(template.content.querySelectorAll<HTMLElement>('span[data-wiki-target]'),
    element => element.dataset.wikiTarget!).filter(Boolean))];
}

function normalize(value: string) {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.(md|markdown|txt)$/i, '').normalize('NFC').toLowerCase();
}

export function wikiMatches(notes: WikiNote[], target: string, sourcePath: string) {
  const normalized = normalize(target);
  if (!normalized) return [];
  if (normalized.includes('/')) return notes.filter(note => normalize(note.path) === normalized);
  const matches = notes.filter(note => normalize(note.title) === normalized);
  const directory = (path: string) => path.slice(0, path.lastIndexOf('/') + 1);
  if (matches.length > 1 && sourcePath.includes('/')) {
    const nearby = matches.filter(note => note.resource && directory(note.path) === directory(sourcePath));
    if (nearby.length === 1) return nearby;
  }
  return matches;
}
