const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3;

export function wheelZoomFactor(event: WheelEvent) {
  const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
  return Math.exp(-Math.max(-100, Math.min(100, event.deltaY * units)) / 160);
}

export function enablePresentationPinch(viewport: HTMLElement, flow: HTMLElement) {
  const pointers = new Map<number, { x: number; y: number }>();
  let scale = 1;
  let baseWidth = 0;
  let baseHeight = 0;

  const reset = () => {
    pointers.clear();
    if (!flow.style.zoom) return;
    scale = 1;
    flow.style.removeProperty('zoom');
    flow.style.removeProperty('width');
    flow.style.removeProperty('min-height');
    viewport.scrollLeft = 0;
  };

  const measure = () => {
    if (scale === 1) {
      baseWidth = flow.offsetWidth;
      baseHeight = viewport.clientHeight;
    }
  };

  const start = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    if (pointers.size === 0) measure();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const move = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      viewport.scrollBy({ left: previous.x - point.x, top: previous.y - point.y, behavior: 'instant' });
      return;
    }
    if (pointers.size !== 2) return;
    const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
    if (!other) return;
    const previousDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
    if (previousDistance < 1) return;
    const distance = Math.hypot(point.x - other.x, point.y - other.y);
    zoomAt(scale * distance / previousDistance,
      (previous.x + other.x) / 2, (previous.y + other.y) / 2,
      (point.x + other.x) / 2, (point.y + other.y) / 2);
  };

  const zoomAt = (target: number, fromX: number, fromY: number, toX = fromX, toY = fromY) => {
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target));
    const before = flow.getBoundingClientRect();
    const anchorX = (fromX - before.left) / scale;
    const anchorY = (fromY - before.top) / scale;

    flow.style.width = `${baseWidth}px`;
    flow.style.minHeight = `${baseHeight}px`;
    flow.style.zoom = String(nextScale);
    scale = nextScale;

    const after = flow.getBoundingClientRect();
    viewport.scrollBy({
      left: after.left + anchorX * scale - toX,
      top: after.top + anchorY * scale - toY,
      behavior: 'instant',
    });
  };

  const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey || !event.deltaY || event.defaultPrevented) return;
    event.preventDefault();
    measure();
    zoomAt(scale * wheelZoomFactor(event), event.clientX, event.clientY);
  };
  const end = (event: PointerEvent) => pointers.delete(event.pointerId);
  viewport.addEventListener('wheel', wheel, { passive: false });
  viewport.addEventListener('pointerdown', start);
  viewport.addEventListener('pointermove', move);
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  viewport.addEventListener('lostpointercapture', end);
  window.addEventListener('resize', reset, true);

  return () => {
    viewport.removeEventListener('wheel', wheel);
    viewport.removeEventListener('pointerdown', start);
    viewport.removeEventListener('pointermove', move);
    viewport.removeEventListener('pointerup', end);
    viewport.removeEventListener('pointercancel', end);
    viewport.removeEventListener('lostpointercapture', end);
    window.removeEventListener('resize', reset, true);
    reset();
  };
}
