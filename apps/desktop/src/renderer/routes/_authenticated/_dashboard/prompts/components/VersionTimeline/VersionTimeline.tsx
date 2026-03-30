import { useRef, useState } from "react";
import { Badge } from "@valence/ui/badge";
import { Button } from "@valence/ui/button";
import { cn } from "@valence/ui/utils";
import { GitCommitHorizontal, ChevronLeft, ChevronRight, Tag } from "lucide-react";

export interface PromptVersion {
  version: number;
  createdAt: string;
  labels: string[];
  createdBy?: string;
}

interface Props {
  versions: PromptVersion[];
  activeVersion: number;
  onVersionSelect: (version: number) => void;
  onCompare?: (versionA: number, versionB: number) => void;
}

export function VersionTimeline({ versions, activeVersion, onVersionSelect, onCompare }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [compareTarget, setCompareTarget] = useState<number | null>(null);
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  const handleClick = (version: number, shiftKey: boolean) => {
    if (shiftKey && onCompare) {
      setCompareTarget(activeVersion);
      onVersionSelect(version);
      onCompare(activeVersion, version);
    } else {
      setCompareTarget(null);
      onVersionSelect(version);
    }
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => scroll("left")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div ref={scrollRef} className="flex items-center gap-0 overflow-x-auto scrollbar-none">
        {sorted.map((v, idx) => {
          const isActive = v.version === activeVersion;
          const isCompareTarget = v.version === compareTarget;
          const isProduction = v.labels.includes("production");

          return (
            <div key={v.version} className="flex items-center">
              {idx > 0 && <div className="h-px w-6 bg-border" />}
              <div className="group relative">
                <button
                  onClick={(e) => handleClick(v.version, e.shiftKey)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompareTarget && "border-amber-500 bg-amber-500/20",
                    !isActive && !isCompareTarget && "border-border hover:border-muted-foreground",
                  )}
                >
                  {isProduction && <Tag className="h-3 w-3 text-green-500" />}
                  {!isProduction && `v${v.version}`}
                </button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md border bg-popover p-2 text-xs shadow-md group-hover:block">
                  <p className="font-medium">v{v.version}</p>
                  <p className="text-muted-foreground">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  {v.createdBy && (
                    <p className="text-muted-foreground">{v.createdBy}</p>
                  )}
                  {v.labels.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {v.labels.map((l) => (
                        <Badge key={l} variant="outline" className="text-[9px]">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => scroll("right")}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
