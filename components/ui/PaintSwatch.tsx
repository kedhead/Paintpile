import { cn } from "@/lib/utils/cn";
import { Paint } from "@/types/paint";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PaintSwatchProps {
  paint: Paint;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PaintSwatch({ paint, size = "md", className }: PaintSwatchProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "rounded-full border border-white/10 shadow-sm cursor-help relative group",
            sizes[size],
            className
          )}
          style={{ backgroundColor: !paint.swatchUrl ? paint.hexColor : undefined }}
          aria-label={`${paint.brand} - ${paint.name}`}
        >
          {paint.swatchUrl && (
            <img
              src={paint.swatchUrl}
              alt={paint.name}
              className="w-full h-full object-cover rounded-full"
            />
          )}
          {/* Shine effect */}
          <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[1px]" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-popover border-border">
        <p className="font-bold text-foreground">{paint.name}</p>
        <p className="text-xs text-muted-foreground">{paint.brand} • {paint.type}</p>
      </TooltipContent>
    </Tooltip>
  );
}
