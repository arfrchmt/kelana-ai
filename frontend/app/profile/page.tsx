"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  TripBreadcrumb,
  TripHeader,
  TripPageShell,
} from "@/components/trips/TripLayout";
import {
  getAccessToken,
  getProfile,
  type AuthUser,
  updatePassword,
  updateProfile,
} from "@/services/authService";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!getAccessToken()) {
        setError("Please login to view your profile");
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
        setName(profile.name);
        setEmail(profile.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setProfileMessage("");
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateProfile({
        name,
        email,
      });
      setUser(updatedUser);
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      setProfileMessage("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setIsSavingPassword(true);

    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <TripPageShell>
      <TripHeader />
      <TripBreadcrumb
        items={[
          { href: "/", label: "Beranda" },
          { label: "Profil" },
        ]}
      />

      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
              User profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">
              Account Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your account identity and password for authenticated trip
              planning.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
              Signed in as
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-950">
              {user?.name ?? "Not signed in"}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500">
              {user?.email ?? "Login required"}
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">
          Loading profile...
        </section>
      ) : error && !user ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Link
            className="mt-4 inline-flex rounded-md bg-[#750014] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f0010]"
            href="/login"
          >
            Login
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            onSubmit={handleProfileSubmit}
          >
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Profile Information
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Update the name and email used for your Kelana AI account.
              </p>
            </div>

            {profileMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {profileMessage}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Name
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <button
              className="w-full rounded-md bg-[#750014] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] focus:outline-none focus:ring-4 focus:ring-[#750014]/20 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <form
            className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            onSubmit={handlePasswordSubmit}
          >
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Password
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Confirm your current password before setting a new bcrypt-hashed
                password.
              </p>
            </div>

            {passwordMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {passwordMessage}
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Current password
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              New password
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </label>

            <button
              className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSavingPassword}
              type="submit"
            >
              {isSavingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </TripPageShell>
  );
}
