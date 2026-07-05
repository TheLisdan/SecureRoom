import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthScreen } from "./AuthScreen";

const mocks = vi.hoisted(() => ({
  login: { mutate: vi.fn(), isPending: false, error: null },
  register: { mutate: vi.fn(), isPending: false, error: null },
}));

vi.mock("./queries", () => ({
  useAuthMutations: () => ({
    login: mocks.login,
    register: mocks.register,
  }),
}));

describe("AuthScreen", () => {
  beforeEach(() => {
    mocks.login.mutate.mockReset();
    mocks.register.mutate.mockReset();
    mocks.login.isPending = false;
    mocks.login.error = null;
    mocks.register.isPending = false;
    mocks.register.error = null;
  });

  it("does not prefill credentials or mention demo values", () => {
    render(<AuthScreen />);

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("keeps registration fields empty until the user fills them", () => {
    render(<AuthScreen />);

    fireEvent.click(screen.getByRole("button", { name: /need an account/i }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("submits login credentials entered by the user", () => {
    render(<AuthScreen />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mocks.login.mutate).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "correct horse battery staple",
    });
  });

  it("submits registration details entered by the user", () => {
    render(<AuthScreen />);

    fireEvent.click(screen.getByRole("button", { name: /need an account/i }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Owner" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(mocks.register.mutate).toHaveBeenCalledWith({
      email: "owner@example.com",
      name: "Owner",
      password: "correct horse battery staple",
    });
  });
});
