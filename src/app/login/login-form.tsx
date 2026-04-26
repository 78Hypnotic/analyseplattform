"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/button";
import {
  signInWithPassword,
  signUpWithPassword,
  type LoginActionState,
} from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, isLoginPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [signupState, signupAction, isSignupPending] = useActionState(
    signUpWithPassword,
    initialState,
  );
  const state = mode === "login" ? loginState : signupState;
  const isPending = mode === "login" ? isLoginPending : isSignupPending;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--line)] bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={mode === "login" ? "rounded-md bg-white px-3 py-2 text-sm text-black" : "px-3 py-2 text-sm text-[var(--muted)]"}
        >
          Einloggen
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={mode === "signup" ? "rounded-md bg-white px-3 py-2 text-sm text-black" : "px-3 py-2 text-sm text-[var(--muted)]"}
        >
          Account erstellen
        </button>
      </div>

      <form action={mode === "login" ? loginAction : signupAction} className="mt-5 space-y-4">
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">Name</span>
            <input required type="text" name="fullName" placeholder="Manuel Hohlwegler" className="w-full" />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm text-[var(--muted)]">E-Mail</span>
          <input required type="email" name="email" placeholder="name@example.com" className="w-full" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-[var(--muted)]">Passwort</span>
          <input
            required
            type="password"
            name="password"
            minLength={mode === "signup" ? 8 : undefined}
            placeholder={mode === "signup" ? "Mindestens 8 Zeichen" : "Dein Passwort"}
            className="w-full"
          />
        </label>

        {state.message ? (
          <p className="rounded-lg border border-[var(--warn)] bg-black/20 p-3 text-sm text-[var(--warn)]">
            {state.message}
          </p>
        ) : null}

        <Button variant="primary" className="w-full" disabled={isPending}>
          {mode === "login"
            ? isPending
              ? "Wird eingeloggt..."
              : "Einloggen"
            : isPending
              ? "Account wird erstellt..."
              : "Account erstellen"}
        </Button>
      </form>
    </div>
  );
}
