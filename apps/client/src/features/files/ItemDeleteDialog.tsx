import type { FileManagerItem } from "@secure-room/api-contract";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { getErrorMessage } from "../../lib/api-error";

type ItemDeleteDialogProps = {
  item: FileManagerItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  error: unknown;
};

export function ItemDeleteDialog({
  item,
  onOpenChange,
  onConfirm,
  error,
}: ItemDeleteDialogProps) {
  return (
    <AlertDialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item?.type}</AlertDialogTitle>
          <AlertDialogDescription>
            {item?.type === "folder"
              ? "This will delete the folder and every nested folder and file inside it."
              : "This will remove the file metadata and private storage object."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className="my-4 truncate rounded-md bg-muted px-3 py-2 text-sm font-medium"
          title={item?.name}
        >
          {item?.name}
        </div>

        {error ? (
          <p className="mb-4 text-sm text-destructive">
            {getErrorMessage(error)}
          </p>
        ) : null}

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
