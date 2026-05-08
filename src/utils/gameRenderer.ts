import type { Camera, Scene, WebGLRenderer } from 'three';

// Module-level handle to the main game canvas renderer/scene/camera.
// Populated from inside <Canvas> via a small bridge component (`<RendererBridge />`)
// so that DOM-level UI (e.g. screenshot button in the overlay) can synchronously
// trigger an on-demand render and read the WebGL drawing buffer before the next RAF
// frame swaps it out.
export const gameRenderer: {
  gl?: WebGLRenderer;
  scene?: Scene;
  camera?: Camera;
} = {};

// Composite any DOM nodes that drei <Html> placed on top of the WebGL canvas
// onto the screenshot. drei <Html> renders sibling DOM elements, so they are
// not part of the WebGL drawing buffer and don't appear in `canvas.toDataURL`
// by default. We re-paint their text contents on a 2D canvas, mapping their
// on-screen positions/styles into pixel space.
function compositeOverlays(
  ctx: CanvasRenderingContext2D,
  webglCanvas: HTMLCanvasElement,
): void {
  const canvasRect = webglCanvas.getBoundingClientRect();
  if (canvasRect.width === 0 || canvasRect.height === 0) return;

  const scaleX = webglCanvas.width / canvasRect.width;
  const scaleY = webglCanvas.height / canvasRect.height;

  const overlays = document.querySelectorAll<HTMLElement>('[data-canvas-overlay]');
  overlays.forEach((el) => {
    const rawText = (el.innerText || el.textContent || '').trim();
    if (!rawText) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (cx < canvasRect.left || cx > canvasRect.right) return;
    if (cy < canvasRect.top || cy > canvasRect.bottom) return;

    const px = (cx - canvasRect.left) * scaleX;
    const py = (cy - canvasRect.top) * scaleY;

    const style = window.getComputedStyle(el);
    const cssFontSize = parseFloat(style.fontSize) || 14;
    const fontSizePx = cssFontSize * scaleY;
    const fontWeight = style.fontWeight || '400';
    const fontFamily = style.fontFamily || 'sans-serif';
    const fillColor = style.color || '#ffffff';
    const transform = style.textTransform;

    let text = rawText;
    if (transform === 'uppercase') text = text.toUpperCase();
    else if (transform === 'lowercase') text = text.toLowerCase();
    else if (transform === 'capitalize') {
      text = text.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    ctx.save();
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    ctx.fillStyle = fillColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    // Approximate the white textShadow halo with a thick stroke. The shadow is
    // declared with 1px offsets in 4 directions on a #fff color, so a stroke
    // ~2x cssShadow gives a visually similar outline at any DPR.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, 2.5 * scaleY);
    ctx.strokeText(text, px, py);
    ctx.fillText(text, px, py);
    ctx.restore();
  });
}

export function captureGameScreenshot(): string | null {
  const { gl, scene, camera } = gameRenderer;
  if (!gl || !scene || !camera) return null;

  // Force a synchronous render so the WebGL drawing buffer holds the latest frame
  // (works together with `preserveDrawingBuffer: true` on the renderer).
  gl.render(scene, camera);

  const webglCanvas = gl.domElement;
  const off = document.createElement('canvas');
  off.width = webglCanvas.width;
  off.height = webglCanvas.height;
  const ctx = off.getContext('2d');
  if (!ctx) {
    return webglCanvas.toDataURL('image/png');
  }

  ctx.drawImage(webglCanvas, 0, 0);
  compositeOverlays(ctx, webglCanvas);
  return off.toDataURL('image/png');
}
