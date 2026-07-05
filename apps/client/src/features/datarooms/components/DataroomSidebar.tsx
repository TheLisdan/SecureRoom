import { LockKeyhole, LogOut, Plus } from "lucide-react";
import type { AuthUser, Dataroom } from "@secure-room/api-contract";

import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "../../../lib/cn";

type DataroomSidebarProps = {
  user: AuthUser;
  datarooms: Dataroom[];
  isLoading: boolean;
  selectedDataroomId: string | null;
  onSelectDataroom: (id: string) => void;
  onCreateDataroom: () => void;
  onLogout: () => void;
};

export function DataroomSidebar({
  user,
  datarooms,
  isLoading,
  selectedDataroomId,
  onSelectDataroom,
  onCreateDataroom,
  onLogout,
}: DataroomSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
          <LockKeyhole className="size-5" />
        </div>
        <div>
          <p className="font-semibold">SecureRoom</p>
          <p className="text-xs text-sidebar-muted">Private diligence</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
        Data Rooms
        <button
          className="rounded p-1 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          type="button"
          onClick={onCreateDataroom}
        >
          <Plus className="size-4" />
          <span className="sr-only">Create dataroom</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {isLoading ? <DataroomListSkeleton /> : null}
        {!isLoading
          ? datarooms.map((dataroom) => (
              <button
                key={dataroom.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  selectedDataroomId === dataroom.id &&
                    "bg-sidebar-accent text-sidebar-foreground",
                )}
                type="button"
                onClick={() => onSelectDataroom(dataroom.id)}
                title={dataroom.name}
              >
                <LockKeyhole className="size-4" />
                <span className="truncate">{dataroom.name}</span>
              </button>
            ))
          : null}
        {!isLoading && datarooms.length === 0 ? (
          <p className="px-3 py-2 text-sm leading-6 text-sidebar-muted">
            Create a dataroom to start organizing files.
          </p>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-accent p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
          </div>
        </div>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          type="button"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function DataroomListSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2" aria-label="Loading rooms">
      <Skeleton className="h-8 bg-sidebar-accent" />
      <Skeleton className="h-8 bg-sidebar-accent" />
      <Skeleton className="h-8 bg-sidebar-accent" />
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
