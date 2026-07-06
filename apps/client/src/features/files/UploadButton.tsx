import { Upload } from "lucide-react";

import { Button } from "../../components/ui/button";

type UploadButtonProps = {
  onUploadFiles: (files: File[]) => void;
};

export function UploadButton({ onUploadFiles }: UploadButtonProps) {
  return (
    <Button
      asChild
      className="w-full cursor-pointer sm:w-auto"
      variant="outline"
    >
      <label>
        <input
          className="sr-only"
          type="file"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.currentTarget.value = "";
            if (files.length > 0) {
              onUploadFiles(files);
            }
          }}
        />
        <Upload data-icon="inline-start" />
        Upload files
      </label>
    </Button>
  );
}
