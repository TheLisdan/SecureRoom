import { QueryClientProvider } from "@tanstack/react-query";

import { AuthScreen } from "../features/auth/AuthScreen";
import { DataroomWorkspace } from "../features/datarooms/DataroomWorkspace";
import { useCurrentUser } from "../features/auth/queries";
import { Skeleton } from "../components/ui/skeleton";
import { queryClient } from "../lib/query-client";

function AppContent() {
  const currentUser = useCurrentUser();

  if (currentUser.isLoading) {
    return <SessionSkeleton />;
  }

  if (!currentUser.data) {
    return <AuthScreen />;
  }

  return <DataroomWorkspace user={currentUser.data} />;
}

function SessionSkeleton() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-muted"
      aria-label="Loading secure session"
    >
      <span className="sr-only">Loading secure session...</span>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-background p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
