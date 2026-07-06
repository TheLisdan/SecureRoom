import { useState } from "react";
import type { FormEvent } from "react";

import { useAuthMutations } from "./queries";

export type AuthMode = "login" | "register";

export function useAuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuthMutations();
  const activeMutation = mode === "login" ? login : register;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "login") {
      login.mutate({ email, password });
      return;
    }

    register.mutate({ email, name, password });
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
  };

  return {
    mode,
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    activeMutation,
    submit,
    toggleMode,
  };
}
