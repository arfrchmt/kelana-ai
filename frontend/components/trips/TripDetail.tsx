"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { Trip } from "@/services/tripService";
import {
  AssistantAnswer,
  askAssistant,
  createConversation,
  getConversation,
  getConversations,
  sendConversationMessage,
} from "@/services/assistantService";
import { getAccessToken } from "@/services/authService";

import { TripBadge } from "./TripBadge";
import { formatAmount } from "./format";
import { TypingIndicator } from "../assistant/TypingIndicator";
import { formatMessageTime } from "@/lib/formatTime";

export function TripDetailSummary({ trip }: { trip: Trip }) {
  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
            Trip Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950">
            {trip.destination}
          </h1>
        </div>
        <TripBadge category={trip.category} />
      </div>

      <dl className="mt-7 grid gap-3 sm:grid-cols-2">
        <DetailStat label="Destination" value={trip.destination} />
        <DetailStat label="Budget" value={`USD ${formatAmount(trip.budget)}`} />
        <DetailStat label="Category" value={trip.category} />
        <DetailStat label="Days" value={`${trip.days} days`} />
        <DetailStat
          label="Daily budget"
          value={`USD ${formatAmount(trip.daily_budget)}`}
        />
      </dl>
    </section>
  );
}

export function TripRecommendation({ recommendation }: { recommendation: string | null }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-[#750014]">
          AI Recommendation
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-4 space-y-2">
        {getRecommendationRows(recommendation).map((row, index) => (
          <p
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 sm:text-base"
            key={`${index}-${row.slice(0, 12)}`}
          >
            {row}
          </p>
        ))}
      </div>
    </section>
  );
}

export function TripAssistantChat({ trip }: { trip: Trip }) {
  const [question, setQuestion] = useState(
    `What should I know before visiting ${trip.destination}?`,
  );
  const [messages, setMessages] = useState<AssistantAnswer[]>([]);
  const [error, setError] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `kelana_trip_chat_${trip.id}`;
  const isInitialLoaded = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior,
        });
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    });
  };

  // Sinkronisasi percakapan trip dengan tabel conversation & message di database
  useEffect(() => {
    let isCancelled = false;

    async function syncDatabaseConversation() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const convList = await getConversations();
        const tripTitle = `Trip: ${trip.destination} #${trip.id}`;
        let currentConv = convList.find(
          (c) => c.title === tripTitle || c.title === `Trip: ${trip.destination}`
        );

        if (!currentConv) {
          currentConv = await createConversation(tripTitle);
        }

        if (currentConv && !isCancelled) {
          setConversationId(currentConv.id);
          // Ambil riwayat langsung dari tabel message
          const detail = await getConversation(currentConv.id);
          if (detail.messages && detail.messages.length > 0 && !isCancelled) {
            const mappedPairs: AssistantAnswer[] = [];
            let pendingUserQuestion = "";

            for (const msg of detail.messages) {
              if (msg.role === "user") {
                const cleanQuestion = msg.content.includes("User question: ")
                  ? msg.content.split("User question: ")[1].trim()
                  : msg.content;
                pendingUserQuestion = cleanQuestion;
              } else if (msg.role === "assistant") {
                mappedPairs.push({
                  question: pendingUserQuestion || "Question",
                  answer: msg.content,
                  confidence_score: msg.confidence_score,
                  sources: msg.sources || [],
                  created_at: msg.created_at,
                });
              }
            }

            if (mappedPairs.length > 0) {
              setTimeout(() => {
                setMessages(mappedPairs);
                scrollToBottom("auto");
              }, 0);
            }
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi percakapan trip:", err);
      }
    }

    syncDatabaseConversation();

    return () => {
      isCancelled = true;
    };
  }, [trip.id, trip.destination]);

  // Muat riwayat percakapan trip dari localStorage sebagai cadangan
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => {
            setMessages((curr) => (curr.length === 0 ? parsed : curr));
            scrollToBottom("auto");
          }, 0);
        }
      }
    } catch (err) {
      console.error("Gagal membaca riwayat percakapan trip:", err);
    } finally {
      isInitialLoaded.current = true;
    }
  }, [storageKey]);

  // Simpan riwayat percakapan trip ke localStorage secara otomatis
  useEffect(() => {
    if (isInitialLoaded.current && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (err) {
        console.error("Gagal menyimpan riwayat percakapan trip:", err);
      }
    }
  }, [messages, storageKey]);

  // Auto-scroll ke bawah saat ada pesan baru atau status asking berubah
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, isAsking]);

  function handleClearChat() {
    if (confirm("Hapus seluruh riwayat percakapan untuk trip ini?")) {
      setMessages([]);
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Question cannot be empty");
      return;
    }

    setError("");
    setIsAsking(true);

    try {
      const contextualQuestion = [
        `Trip context: destination=${trip.destination}, days=${trip.days}, budget=USD ${trip.budget}, travel style=${trip.category}.`,
        `User question: ${trimmedQuestion}`,
      ].join("\n");

      let answer: AssistantAnswer;

      if (conversationId) {
        // Mengirim pesan ke endpoint percakapan yang mengambil konteks langsung dari tabel message
        const res = await sendConversationMessage(conversationId, contextualQuestion);
        const lastAssistantMsg = res.messages
          .filter((m) => m.role === "assistant")
          .at(-1);

        answer = {
          question: trimmedQuestion,
          answer: res.answer,
          confidence_score: res.confidence_score,
          sources: res.sources || [],
          created_at: lastAssistantMsg?.created_at || new Date().toISOString(),
        };
      } else {
        // Fallback jika belum tersinkron ke conversation
        const history = messages.flatMap((m) => [
          { role: "user", content: m.question },
          { role: "assistant", content: m.answer },
        ]);
        const res = await askAssistant(contextualQuestion, null, history);
        answer = {
          ...res,
          question: trimmedQuestion,
          created_at: res.created_at || new Date().toISOString(),
        };
      }

      setMessages((current) => [...current, answer]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask KelanaAI");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-[#750014]">
            RAG Travel Assistant
          </h2>
          {messages.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {messages.length} pesan tersimpan
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            className="text-xs text-slate-400 transition hover:text-red-700"
            onClick={handleClearChat}
            title="Hapus riwayat chat trip ini"
            type="button"
          >
            Hapus Riwayat
          </button>
        )}
      </div>
      <div className="mt-2 h-px w-full bg-slate-200" />

      <p className="mt-3 text-sm leading-6 text-slate-500">
        Ask questions grounded in your travel documents. This chat includes
        {` ${trip.destination}`} as the default trip context.
      </p>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
          Active context
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {trip.destination} | {trip.days} days | USD {formatAmount(trip.budget)} |{" "}
          {trip.category}
        </p>
      </div>

      {/* Scrollable Messages Container */}
      <div
        ref={chatContainerRef}
        className="mt-5 flex-1 min-h-[260px] max-h-[440px] overflow-y-auto space-y-4 pr-1.5 scroll-smooth rounded-lg"
      >
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <article
              className="overflow-hidden rounded-lg border border-slate-200 shadow-xs"
              key={`${index}-${message.question.slice(0, 16)}`}
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Question
                  </p>
                  {message.created_at && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <svg
                        className="h-3 w-3 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
                      </svg>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {message.question}
                </p>
              </div>
              <div className="bg-teal-600 px-4 py-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide">
                      AI Answer
                    </p>
                    {message.created_at && (
                      <span className="flex items-center gap-1 text-[11px] text-white/75">
                        <span>•</span>
                        <svg
                          className="h-3 w-3 opacity-80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
                        </svg>
                        <span>{formatMessageTime(message.created_at)}</span>
                      </span>
                    )}
                  </div>
                  <ConfidenceScore score={message.confidence_score} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-7">
                  {message.answer}
                </p>

                <div className="mt-5 border-t border-white/30 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Source
                  </p>
                  {message.sources.length > 0 ? (
                    <ul className="mt-2 space-y-1 font-mono text-xs">
                      {message.sources.map((source) => (
                        <li key={source.uri}>
                          <a
                            className="inline-flex max-w-full gap-2 text-white underline-offset-4 hover:underline"
                            href={source.uri}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span aria-hidden="true">[doc]</span>
                            <span className="truncate">{source.name}</span>
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
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Ask a destination-specific question to start the assistant chat.
          </div>
        )}

        {isAsking && (
          <TypingIndicator
            compact
            contextLabel={trip.destination}
            customSteps={[
              `Membaca pertanyaan terkait ${trip.destination}...`,
              `Mencari rujukan ${trip.destination} di Knowledge Base...`,
              "Menganalisis panduan wisata & estimasi...",
              "KelanaAI sedang menyusun jawaban...",
            ]}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleAsk}>
        <input
          className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask about ${trip.destination}`}
          value={question}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#750014] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isAsking}
          type="submit"
        >
          {isAsking ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8v8H4z"
                  fill="currentColor"
                />
              </svg>
              <span>Memproses...</span>
            </>
          ) : (
            "Ask"
          )}
        </button>
      </form>
    </section>
  );
}


function ConfidenceScore({ score }: { score?: number | null }) {
  return (
    <span className="rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
      Confidence: {typeof score === "number" ? `${score}%` : "N/A"}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function getRecommendationRows(recommendation: string | null) {
  if (!recommendation) {
    return ["No recommendation available."];
  }

  return recommendation
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}
