import * as React from "react";
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outline" | "secondary" | "destructive";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClass =
    variant === "outline"
      ? "border border-border bg-transparent"
      : variant === "secondary"
        ? "border border-transparent bg-secondary text-secondary-foreground"
        : variant === "destructive"
          ? "border border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "border border-transparent bg-primary text-primary-foreground";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClass,
        className
      )}
      {...props}
    />
  );
}
