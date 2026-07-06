import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { FileManagerItem } from "@secure-room/api-contract";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getErrorMessage } from "../../lib/api-error";

export type NameDialogState =
  | { type: "createDataroom" }
  | { type: "renameDataroom"; name: string }
  | { type: "createFolder" }
  | { type: "renameItem"; item: FileManagerItem };

type NameDialogProps = {
  state: NameDialogState | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  error: unknown;
};

export function NameDialog({
  state,
  onOpenChange,
  onSubmit,
  error,
}: NameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!state) {
      setName("");
      return;
    }

    setName(
      state.type === "renameItem"
        ? state.item.name
        : state.type === "renameDataroom"
          ? state.name
          : "",
    );
  }, [state]);

  const title =
    state?.type === "createDataroom"
      ? "Create dataroom"
      : state?.type === "renameDataroom"
        ? "Rename dataroom"
        : state?.type === "createFolder"
          ? "Create folder"
          : "Rename item";

  const description =
    state?.type === "createDataroom"
      ? "Use a clear deal or company name."
      : state?.type === "renameDataroom"
        ? "Use a clear deal or company name."
        : state?.type === "createFolder"
          ? "Folder names must be unique in this location."
          : "Names must stay clear and safe for storage.";
  const minLength =
    state?.type === "createDataroom" || state?.type === "renameDataroom"
      ? 2
      : 1;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="my-6 flex flex-col gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={minLength}
              maxLength={180}
              autoFocus
            />
          </div>

          {error ? (
            <p className="mb-4 text-sm text-destructive">
              {getErrorMessage(error)}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
