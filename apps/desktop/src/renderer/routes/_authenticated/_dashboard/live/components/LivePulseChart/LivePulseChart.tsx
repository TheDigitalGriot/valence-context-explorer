import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveEvent } from "../hooks";
import { cn } from "@valence/ui/utils";

type TimeRange = "1m" | "3m" | "5m" | "10m";

const TIME_RANGE_MS: Record<TimeRange, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "10m": 600_000,
};

const BUCKET_COUNT = 60;

interface Props {
  events: LiveEvent[];
  stats: { totalEvents: number; uniqueAgentCount: number; toolCallCount: number };
}

export function LivePulseChart({ events, stats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("3m");
  const animFrameRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.offsetWidth;
    const height = 96;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const now = Date.now();
    const rangeMs = TIME_RANGE_MS[timeRange];
    const bucketSize = rangeMs / BUCKET_COUNT;
    const buckets = new Array<number>(BUCKET_COUNT).fill(0);

    for (const event of events) {
      const eventTime = new Date(event.timestamp).getTime();
      const age = now - eventTime;
      if (age < 0 || age > rangeMs) continue;
      const idx = BUCKET_COUNT - 1 - Math.floor(age / bucketSize);
      if (idx >= 0 && idx < BUCKET_COUNT) buckets[idx]++;
    }

    const maxVal = Math.max(...buckets, 1);
    const padding = { top: 8, right: 8, bottom: 20, left: 8 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barW = chartW / BUCKET_COUNT - 1;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < BUCKET_COUNT; i++) {
      const val = buckets[i];
      if (val === 0) continue;
      const barH = (val / maxVal) * chartH;
      const x = padding.left + i * (barW + 1);
      const y = padding.top + chartH - barH;
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, "hsl(221, 83%, 53%)");
      grad.addColorStop(1, "hsl(221, 83%, 40%)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1);
      ctx.fill();
    }

    ctx.fillStyle = "hsl(215, 16%, 47%)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    const labelY = height - 4;
    ctx.fillText("now", width - padding.right - barW / 2, labelY);
    ctx.fillText(`-${timeRange}`, padding.left + barW / 2, labelY);

    ctx.strokeStyle = "hsl(215, 20%, 85%)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    ctx.lineTo(width - padding.right, padding.top + chartH);
    ctx.stroke();
  }, [events, timeRange]);

  useEffect(() => {
    let lastTime = 0;
    const frameInterval = 1000 / 30;
    const loop = (time: number) => {
      if (time - lastTime >= frameInterval) {
        render();
        lastTime = time;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => observer.disconnect();
  }, [render]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Live Activity</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">
              {stats.uniqueAgentCount} agents
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">
              {stats.totalEvents} events
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">
              {stats.toolCallCount} tools
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["1m", "3m", "5m", "10m"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                timeRange === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative">
        <canvas ref={canvasRef} className="w-full cursor-crosshair" />
        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Waiting for events...</p>
          </div>
        )}
      </div>
    </div>
  );
}
