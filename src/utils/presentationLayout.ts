export function splitPresentationSlides(html: string): string[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const slides = [''];
  for (const block of document.body.childNodes) {
    if (block.nodeName === 'HR') {
      slides.push('');
    } else {
      if (block instanceof Element) {
        slides[slides.length - 1] += block.outerHTML;
      } else if (block.nodeType === Node.TEXT_NODE) {
        const escaped = (block.textContent ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        slides[slides.length - 1] += escaped;
      }
    }
  }
  return slides;
}

export function getPresentationLayout(html: string) {
  const { body } = new DOMParser().parseFromString(html, 'text/html');
  const textLength = (body.textContent ?? '').replace(/\s/g, '').length;
  const media = body.querySelectorAll('img, video, iframe');
  const complex = body.querySelector('table, pre, ul, ol, blockquote, hr, [data-type$="-math"]');
  if (!textLength && !media.length && !complex) return 'empty';
  if (media.length === 1 && textLength <= 100 && !complex) return 'media';
  if (!media.length && !complex && textLength <= 120 && body.children.length <= 4 &&
      body.firstElementChild?.matches('h1, h2')) return 'title';
  if (textLength > 350 || body.querySelectorAll('li').length > 7 || body.children.length > 9) return 'dense';
  return 'reading';
}
