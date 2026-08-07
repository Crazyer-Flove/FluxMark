export interface ResourceItem {
  id: string;
  name: string;
  relativePath: string;
  type: 'file' | 'folder' | 'image' | 'video' | 'code' | 'other';
  handle?: any;
  file?: File | Blob;
  size?: number;
  lastModified?: number;
  url?: string;
  children?: ResourceItem[];
}

export interface PreviewImageInfo {
  url: string;
  name: string;
  relativePath?: string;
  size?: number;
  handle?: any;
  file?: File | Blob;
}
