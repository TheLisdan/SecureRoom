import { LockKeyhole, Plus } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "../../../components/ui/empty";

type DataroomEmptyStateProps = {
  onCreateDataroom: () => void;
};

export function DataroomEmptyState({
  onCreateDataroom,
}: DataroomEmptyStateProps) {
  return (
    <Empty>
      <EmptyMedia>
        <LockKeyhole className="size-6" />
      </EmptyMedia>
      <EmptyTitle>Create your first dataroom</EmptyTitle>
      <EmptyDescription>
        Keep diligence documents grouped by deal, with nested folders and
        private file access.
      </EmptyDescription>
      <Button className="mt-5" type="button" onClick={onCreateDataroom}>
        <Plus data-icon="inline-start" />
        Create dataroom
      </Button>
    </Empty>
  );
}
