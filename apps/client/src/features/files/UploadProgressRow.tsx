import { Upload } from "lucide-react";

import { Progress } from "../../components/ui/progress";

export function UploadProgressRow({
  fileName,
  progress,
}: {
  fileName: string;
  progress: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-4 rounded-lg border bg-background px-4 py-3 text-sm">
      <Upload className="size-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="truncate font-medium">{fileName}</span>
          <span className="text-muted-foreground">{progress}% uploaded</span>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
}
