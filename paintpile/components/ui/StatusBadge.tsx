import { cn } from "@/lib/utils/cn";
import { ProjectStatus } from "@/types/project";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    "not-started": "bg-muted text-muted-foreground border-muted-foreground/20",
    "in-progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const labels = {
    "not-started": "Planning",
    "in-progress": "In Progress",
    completed: "Completed",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
