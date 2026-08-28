"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { loginUser } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginUser({ email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div
          className="relative min-h-72 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(0,0,0,0.74), rgba(0,0,0,0.28)), url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80")',
          }}
        >
          <div className="flex h-full min-h-72 flex-col justify-end p-6 text-white sm:p-10">
            <Link className="mb-auto w-fit text-xl font-semibold" href="/">
              Kelana AI
            </Link>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
              Account access
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Login
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
              Access your saved trip plans and continue planning with your
              personal travel history.
            </p>
          </div>
        </div>

        <div className="flex items-center p-5 sm:p-8">
          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
                Welcome back
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Sign in to your account
              </h2>
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alice@email.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password123"
                required
                type="password"
                value={password}
              />
            </label>

            <button
              className="w-full rounded-md bg-[#750014] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] focus:outline-none focus:ring-4 focus:ring-[#750014]/20 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <p className="text-center text-sm text-slate-600">
              No account yet?{" "}
              <Link
                className="font-semibold text-[#750014] underline-offset-4 hover:underline"
                href="/register"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
