import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getErrorMessage } from "../../lib/api-error";
import { useAuthMutations } from "./queries";

type AuthMode = "login" | "register";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuthMutations();
  const activeMutation = mode === "login" ? login : register;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "login") {
      login.mutate({ email, password });
      return;
    }

    register.mutate({ email, name, password });
  };

  return (
    <main className="flex min-h-screen bg-muted">
      <section className="hidden w-[42%] min-w-[420px] flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <LockKeyhole className="size-5" />
          </div>
          SecureRoom
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            A private data room for serious diligence work.
          </h1>
          <p className="mt-4 text-sm leading-6 text-sidebar-muted">
            Store, inspect, rename and remove sensitive files with deliberate
            security boundaries.
          </p>
        </div>
        <p className="text-sm text-sidebar-muted">
          Private files, authenticated access and explicit ownership checks.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border bg-background p-8 shadow-panel"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Access your secure workspace."
                : "Set up a secure workspace for diligence files."}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {mode === "register" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          {activeMutation.error ? (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(activeMutation.error)}
            </p>
          ) : null}

          <Button
            className="mt-6 w-full"
            type="submit"
            disabled={activeMutation.isPending}
          >
            {activeMutation.isPending
              ? "Working..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </Button>

          <button
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
