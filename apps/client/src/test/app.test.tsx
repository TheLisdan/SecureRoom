import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@secure-room/api-contract";

import { App } from "../app/App";

const user: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@example.com",
  name: "Owner",
};

const mocks = vi.hoisted(() => ({
  currentUser: {
    isLoading: false,
    data: null as AuthUser | null,
  } as { isLoading: boolean; data: AuthUser | null },
}));

vi.mock("../features/auth/queries", () => ({
  useCurrentUser: () => mocks.currentUser,
}));

vi.mock("../features/auth/AuthScreen", () => ({
  AuthScreen: () => <div>Auth screen</div>,
}));

vi.mock("../features/datarooms/DataroomWorkspace", () => ({
  DataroomWorkspace: ({ user: workspaceUser }: { user: AuthUser }) => (
    <div>Workspace for {workspaceUser.name}</div>
  ),
}));

describe("App", () => {
  it("shows the secure-session loading state", () => {
    mocks.currentUser = { isLoading: true, data: null };

    render(<App />);

    expect(screen.getByText("Loading secure session...")).toBeInTheDocument();
  });

  it("shows auth when no current user is available", () => {
    mocks.currentUser = { isLoading: false, data: null };

    render(<App />);

    expect(screen.getByText("Auth screen")).toBeInTheDocument();
  });

  it("shows the workspace for the current user", () => {
    mocks.currentUser = { isLoading: false, data: user };

    render(<App />);

    expect(screen.getByText("Workspace for Owner")).toBeInTheDocument();
  });
});
