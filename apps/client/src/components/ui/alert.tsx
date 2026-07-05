import * as React from "react";

import { cn } from "../../lib/cn";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("leading-6", className)} {...props} />;
}
