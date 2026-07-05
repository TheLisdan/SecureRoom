import type { Dataroom } from "@secure-room/api-contract";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Button } from "../../../components/ui/button";
import { getErrorMessage } from "../../../lib/api-error";

type DataroomDeleteDialogProps = {
  dataroom: Dataroom | null;
  open: boolean;
  isPending: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DataroomDeleteDialog({
  dataroom,
  open,
  isPending,
  error,
  onOpenChange,
  onConfirm,
}: DataroomDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete dataroom</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the dataroom, all nested folders and every private
            file inside it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className="my-4 truncate rounded-md bg-muted px-3 py-2 text-sm font-medium"
          title={dataroom?.name}
        >
          {dataroom?.name}
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
          <Button
            type="button"
            variant="destructive"
            disabled={!dataroom || isPending}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
