"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  AssistantAnswer,
  askAssistant,
} from "@/services/assistantService";

function getSourceLabel(uri: string) {
  try {
    const url = new URL(uri);
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? uri);
  } catch {
    return uri;
  }
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("Can I bring medication into Japan?");
  const [result, setResult] = useState<AssistantAnswer | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Question cannot be empty");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      setResult(await askAssistant(trimmedQuestion));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask KelanaAI");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
          <Link className="text-lg font-semibold text-blue-700" href="/">
            KelanaAI
          </Link>
          <span className="text-sm font-medium text-slate-600">
            Travel Assistant
          </span>
        </header>

        <section className="flex flex-1 flex-col bg-white px-5 py-7 sm:px-7">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Ask KelanaAI
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Powered by your trusted travel documents
            </p>
          </div>

          <form
            className="mt-5 flex min-h-14 items-center gap-3 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 shadow-inner focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10"
            onSubmit={handleSubmit}
          >
            <input
              className="min-w-0 flex-1 bg-transparent px-1 text-base text-slate-800 outline-none placeholder:text-slate-500"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Can I bring medication into Japan?"
              value={question}
            />
            <button
              className="inline-flex h-9 items-center gap-2 rounded-none bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Asking" : "Ask"}
              <span aria-hidden="true">-&gt;</span>
            </button>
          </form>

          {error ? (
            <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {result ? (
            <section className="mt-5 bg-teal-600 px-5 py-5 text-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase">AI Answer</h2>
                <span className="rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Confidence:{" "}
                  {typeof result.confidence_score === "number"
                    ? `${result.confidence_score}%`
                    : "N/A"}
                </span>
              </div>
              <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7">
                {result.answer}
              </p>

              <div className="mt-7 border-t border-white/30 pt-4">
                <h3 className="text-sm font-bold uppercase">Source</h3>
                {result.sources.length > 0 ? (
                  <ul className="mt-2 space-y-2 font-mono text-sm">
                    {result.sources.map((source) => (
                      <li key={source.uri}>
                        <a
                          className="inline-flex max-w-full items-center gap-2 text-white underline-offset-4 hover:underline"
                          href={source.uri}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span aria-hidden="true">[doc]</span>
                          <span className="truncate">
                            {source.name || getSourceLabel(source.uri)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-white/85">
                    No source returned by the Knowledge Base.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Ask a travel question to see a grounded answer.
            </div>
          )}

          <p className="mt-auto pt-8 text-center text-sm text-slate-500">
            Answers are grounded in your uploaded documents.
          </p>
        </section>
      </div>
    </main>
  );
}
