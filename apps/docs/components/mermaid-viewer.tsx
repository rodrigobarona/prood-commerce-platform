'use client';

import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { cn } from '@/lib/cn';
import {
  ArrowCounterClockwiseIcon,
  ArrowsInIcon,
  ArrowsOutCardinalIcon,
  ArrowsOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@phosphor-icons/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';

const MIN_SCALE = 0.35;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.2;

type MermaidViewerProps = {
  svg: string;
};

export function MermaidViewer({ svg }: MermaidViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((current) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((current + delta).toFixed(2)))),
    );
  }, []);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
    },
    [zoomBy],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
      panOriginRef.current = {
        x: event.clientX,
        y: event.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    },
    [translate.x, translate.y],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPanning) return;
      setTranslate({
        x: panOriginRef.current.tx + (event.clientX - panOriginRef.current.x),
        y: panOriginRef.current.ty + (event.clientY - panOriginRef.current.y),
      });
    },
    [isPanning],
  );

  const endPan = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;

    if (document.fullscreenElement === root) {
      await document.exitFullscreen();
      return;
    }

    await root.requestFullscreen();
  }, []);

  const toolbarButtonClass = cn(
    buttonVariants({ variant: 'ghost', size: 'sm' }),
    'size-8 shrink-0 p-0',
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        'not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card/50',
        isFullscreen && 'flex h-full min-h-0 flex-col rounded-none border-0 bg-fd-background',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs text-fd-muted-foreground">
          <ArrowsOutCardinalIcon className="size-3.5 shrink-0" aria-hidden />
          Drag to pan · Scroll to zoom
        </p>
        <div
          className="flex items-center gap-0.5"
          role="toolbar"
          aria-label="Diagram controls"
        >
          <button
            type="button"
            className={toolbarButtonClass}
            aria-label="Zoom out"
            onClick={() => zoomBy(-ZOOM_STEP)}
          >
            <MagnifyingGlassMinusIcon className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            aria-label="Zoom in"
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            <MagnifyingGlassPlusIcon className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            aria-label="Reset zoom and position"
            onClick={resetView}
          >
            <ArrowCounterClockwiseIcon className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? (
              <ArrowsInIcon className="size-4" aria-hidden />
            ) : (
              <ArrowsOutIcon className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'relative touch-none select-none',
          isFullscreen ? 'min-h-0 flex-1' : 'h-[min(28rem,60vh)]',
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        role="img"
        aria-label="Mermaid diagram (drag to pan, scroll to zoom)"
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-6 [&_svg]:max-w-none"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? undefined : 'transform 80ms ease-out',
          }}
          // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- SVG rendered at build time from repo-authored MDX
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
