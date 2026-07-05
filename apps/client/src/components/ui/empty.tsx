import * as React from "react";

import { cn } from "../../lib/cn";

export function Empty({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center p-10 text-center",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyMedia({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function EmptyDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-2 max-w-sm text-sm leading-6 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
