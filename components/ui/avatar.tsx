import * as React from "react";
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}
export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className="aspect-square h-full w-full" {...props} />;
}
export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-secondary", className)} {...props} />;
}
