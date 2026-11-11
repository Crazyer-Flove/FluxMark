export function getPdfPages(canvas: HTMLCanvasElement, background: string) {
  const pageHeight = Math.round(canvas.width * 297 / 210);
  const margin = Math.round(canvas.width * 15 / 210);
  const capacity = Math.max(1, pageHeight - margin * 2);
  const context = canvas.getContext('2d');
  const color = background.slice(1).match(/.{2}/g)?.map(value => parseInt(value, 16)) ?? [255,255,255];
  const pages: {start: number; height: number}[] = [];
  const bandHeight = Math.floor(capacity * 0.08);
  for (let start = 0; start < canvas.height;) {
    const target = Math.min(start + capacity, canvas.height);
    let end = target;
    if (context && target < canvas.height && bandHeight > 4) {
      try {
        const band = context.getImageData(0, target - bandHeight, canvas.width, bandHeight).data;
        let blankRows = 0;
        for (let row = bandHeight - 1; row >= 0; row--) {
          let blank = true;
          for (let column = 0; column < canvas.width; column += 2) {
            const pixel = (row * canvas.width + column) * 4;
            if (band[pixel + 3] > 32 && color.some((channel, index) => Math.abs(channel - band[pixel + index]) > 28)) {
              blank = false;
              break;
            }
          }
          blankRows = blank ? blankRows + 1 : 0;
          if (blankRows >= 4) {
            end = target - bandHeight + row + 2;
            break;
          }
        }
      } catch { /* Use fixed page size when pixels cannot be read. */ }
    }
    pages.push({start, height: end - start});
    start = end;
  }
  return {pageHeight, margin, pages};
}
