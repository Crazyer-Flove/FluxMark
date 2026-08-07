// Global Media Registry for handling local .med relative paths and object URLs

const relativeToBlobMap = new Map<string, string>();
const relativeToFileMap = new Map<string, File | Blob>();

export function normalizeMediaPath(relativePath: string): string {
  if (!relativePath) return '';
  let path = relativePath.trim();
  if (path.startsWith('./')) {
    path = path.slice(2);
  }
  return path;
}

export function registerMediaBlob(relativePath: string, fileOrBlob: File | Blob): string {
  const normPath = normalizeMediaPath(relativePath);

  if (relativeToBlobMap.has(normPath)) {
    return relativeToBlobMap.get(normPath)!;
  }

  const blobUrl = URL.createObjectURL(fileOrBlob);
  relativeToBlobMap.set(normPath, blobUrl);
  relativeToBlobMap.set(`./${normPath}`, blobUrl);
  relativeToFileMap.set(normPath, fileOrBlob);
  relativeToFileMap.set(`./${normPath}`, fileOrBlob);

  return blobUrl;
}

export function getMediaBlobUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const normPath = normalizeMediaPath(relativePath);
  return relativeToBlobMap.get(normPath) || relativeToBlobMap.get(relativePath) || null;
}

export function getMediaFile(relativePath: string): File | Blob | undefined {
  const normPath = normalizeMediaPath(relativePath);
  return relativeToFileMap.get(normPath) || relativeToFileMap.get(relativePath);
}

export interface SaveMediaResult {
  relativePath: string;
  blobUrl: string;
  fileName: string;
}

export async function saveMediaToMedFolder(
  fileOrBlob: File | Blob,
  originalName: string = 'media',
  currentDirectoryHandle: any = null
): Promise<SaveMediaResult> {
  // Determine extension
  let ext = '';
  if (fileOrBlob.type) {
    const mimeSub = fileOrBlob.type.split('/')[1];
    if (mimeSub) {
      ext = '.' + mimeSub.replace('quicktime', 'mov').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    }
  }
  if (!ext && originalName.includes('.')) {
    ext = originalName.slice(originalName.lastIndexOf('.'));
  }
  if (!ext) {
    ext = fileOrBlob.type.startsWith('video/') ? '.mp4' : '.png';
  }

  // Clean base name and generate timestamped unique filename
  const cleanBase = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_')
    .slice(0, 20) || 'media';

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 6);
  const fileName = `${cleanBase}_${timestamp}_${randomStr}${ext}`;
  const relativePath = `.med/${fileName}`;

  // 1. If physical directory handle exists, write into .med folder on disk
  if (currentDirectoryHandle && typeof currentDirectoryHandle.getDirectoryHandle === 'function') {
    try {
      const medDirHandle = await currentDirectoryHandle.getDirectoryHandle('.med', { create: true });
      const fileHandle = await medDirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileOrBlob);
      await writable.close();
      console.log(`[MediaRegistry] Saved file to disk: .med/${fileName}`);
    } catch (err) {
      console.error('[MediaRegistry] Error saving file to .med folder on disk:', err);
    }
  }

  // 2. Register in memory map
  const blobUrl = registerMediaBlob(relativePath, fileOrBlob);

  return {
    relativePath,
    blobUrl,
    fileName,
  };
}

export async function syncMediaToDirectory(dirHandle: any) {
  if (!dirHandle || typeof dirHandle.getDirectoryHandle !== 'function') return;
  try {
    const medDirHandle = await dirHandle.getDirectoryHandle('.med', { create: true });
    for (const [relPath, fileOrBlob] of relativeToFileMap.entries()) {
      if (relPath.startsWith('.med/')) {
        const fileName = relPath.slice(5);
        try {
          const fileHandle = await medDirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(fileOrBlob);
          await writable.close();
        } catch (e) {
          // Ignore if error or exists
        }
      }
    }
  } catch (err) {
    console.error('[MediaRegistry] Failed to sync media to directory:', err);
  }
}
