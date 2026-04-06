import * as React from "react";
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold", className)} {...props} />;
}
