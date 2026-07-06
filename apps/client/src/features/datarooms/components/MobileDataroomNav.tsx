import { Check, LockKeyhole, LogOut, Plus } from "lucide-react";
import type { AuthUser, Dataroom } from "@secure-room/api-contract";

import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

type MobileDataroomNavProps = {
  user: AuthUser;
  datarooms: Dataroom[];
  isLoading: boolean;
  selectedDataroomId: string | null;
  onSelectDataroom: (id: string) => void;
  onCreateDataroom: () => void;
  onLogout: () => void;
};

export function MobileDataroomNav({
  user,
  datarooms,
  isLoading,
  selectedDataroomId,
  onSelectDataroom,
  onCreateDataroom,
  onLogout,
}: MobileDataroomNavProps) {
  const selectedDataroom =
    datarooms.find((dataroom) => dataroom.id === selectedDataroomId) ?? null;

  return (
    <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LockKeyhole className="size-4" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="min-w-0 flex-1 justify-start px-3"
            variant="outline"
            type="button"
          >
            <span className="min-w-0 truncate">
              {selectedDataroom?.name ?? "Data Rooms"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[min(20rem,calc(100vw-2rem))]"
        >
          <DropdownMenuGroup>
            {isLoading ? (
              <DropdownMenuItem disabled>Loading rooms...</DropdownMenuItem>
            ) : null}
            {!isLoading && datarooms.length === 0 ? (
              <DropdownMenuItem disabled>No datarooms yet</DropdownMenuItem>
            ) : null}
            {!isLoading
              ? datarooms.map((dataroom) => (
                  <DropdownMenuItem
                    key={dataroom.id}
                    onSelect={() => onSelectDataroom(dataroom.id)}
                  >
                    <LockKeyhole />
                    <span className="min-w-0 flex-1 truncate">
                      {dataroom.name}
                    </span>
                    {dataroom.id === selectedDataroomId ? <Check /> : null}
                  </DropdownMenuItem>
                ))
              : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onCreateDataroom}>
            <Plus />
            New dataroom
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        className="shrink-0"
        variant="ghost"
        size="icon"
        type="button"
        onClick={onCreateDataroom}
      >
        <Plus data-icon="inline-start" />
        <span className="sr-only">Create dataroom</span>
      </Button>
      <Button
        className="shrink-0"
        variant="ghost"
        size="icon"
        type="button"
        onClick={onLogout}
        title={user.email}
      >
        <LogOut data-icon="inline-start" />
        <span className="sr-only">Logout</span>
      </Button>
    </header>
  );
}
