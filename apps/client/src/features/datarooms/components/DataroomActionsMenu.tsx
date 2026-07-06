import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

type DataroomActionsMenuProps = {
  onRename: () => void;
  onDelete: () => void;
};

export function DataroomActionsMenu({
  onRename,
  onDelete,
}: DataroomActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="shrink-0" variant="ghost" size="icon" type="button">
          <MoreHorizontal data-icon="inline-start" />
          <span className="sr-only">Open dataroom actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onRename}>
            <Pencil />
            Rename dataroom
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
            <Trash2 />
            Delete dataroom
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
