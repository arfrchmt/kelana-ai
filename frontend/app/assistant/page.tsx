"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  AssistantSource,
  ChatMessage,
  Conversation,
  askAssistant,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  sendConversationMessage,
} from "@/services/assistantService";
import { getAccessToken, getAuthUser } from "@/services/authService";
import { TypingIndicator } from "@/components/assistant/TypingIndicator";
import { formatMessageTime } from "@/lib/formatTime";

function getSourceLabel(uri: string) {
  try {
    const url = new URL(uri);
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? uri);
  } catch {
    return uri;
  }
}

const QUICK_PROMPTS = [
  "Can I bring medication into Japan?",
  "Apakah saya butuh visa wisata ke Jepang untuk paspor Indonesia?",
  "Rekomendasi transportasi umum terbaik dari Bandara Narita ke Shinjuku",
  "Tips penting dan etika saat berwisata di Jepang",
];

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSwitchingConversation = useRef(false);
  const messageCounterRef = useRef(1000);

  // Helper auto-scroll yang mendukung scroll instan saat buka riwayat dan smooth saat pesan baru
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior,
        });
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    });
  };

  async function selectConversation(id: number) {
    setActiveConversationId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("kelana_active_conv_id", String(id));
    }
    setError("");
    setIsLoading(true);
    setIsSidebarOpen(false);
    isSwitchingConversation.current = true;

    try {
      const detail = await getConversation(id);
      setMessages(detail.messages || []);
      // Skenario 1: Scroll otomatis ke bagian paling bawah saat pertama kali membuka percakapan
      setTimeout(() => {
        scrollToBottom("auto");
        isSwitchingConversation.current = false;
      }, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail percakapan");
      isSwitchingConversation.current = false;
    } finally {
      setIsLoading(false);
      // Double check scroll to bottom setelah render selesai
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }

  async function loadConversations(preferId?: number | null) {
    setIsFetchingConversations(true);
    try {
      const list = await getConversations();
      setConversations(list);
      if (list.length > 0) {
        const savedActiveId =
          preferId ??
          (typeof window !== "undefined"
            ? Number(localStorage.getItem("kelana_active_conv_id"))
            : null);
        const targetId =
          savedActiveId && list.some((c) => c.id === savedActiveId)
            ? savedActiveId
            : list[0].id;
        selectConversation(targetId);
      }
    } catch (err) {
      console.error("Gagal memuat daftar percakapan:", err);
      if (err instanceof Error && err.message.includes("401")) {
        setError(
          "Sesi login telah berakhir. Silakan login kembali untuk mengakses riwayat percakapan."
        );
      }
    } finally {
      setIsFetchingConversations(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    const hasAuth = Boolean(token && getAuthUser());
    setTimeout(() => {
      setIsLoggedIn(hasAuth);
    }, 0);

    if (hasAuth) {
      setTimeout(() => {
        loadConversations();
      }, 0);
    } else {
      // Muat riwayat obrolan tamu dari localStorage jika ada
      try {
        const savedGuestMessages = localStorage.getItem("kelana_guest_chat_messages");
        if (savedGuestMessages) {
          const parsed = JSON.parse(savedGuestMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTimeout(() => {
              setMessages(parsed);
              scrollToBottom("auto");
            }, 0);
          }
        }
      } catch (e) {
        console.error("Gagal membaca riwayat chat tamu:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan riwayat chat tamu ke localStorage secara otomatis
  useEffect(() => {
    if (!isLoggedIn && messages.length > 0) {
      try {
        localStorage.setItem("kelana_guest_chat_messages", JSON.stringify(messages));
      } catch (e) {
        console.error("Gagal menyimpan riwayat chat tamu:", e);
      }
    }
  }, [messages, isLoggedIn]);

  // Auto-scroll ke pesan terbaru saat messages bertambah atau status loading berubah
  useEffect(() => {
    if (messages.length > 0) {
      if (isSwitchingConversation.current) {
        scrollToBottom("auto");
      } else {
        scrollToBottom("smooth");
      }
    }
  }, [messages, isLoading]);

  function handleStartNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setError("");
    setQuestion("");
    setIsSidebarOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kelana_active_conv_id");
      if (!isLoggedIn) {
        localStorage.removeItem("kelana_guest_chat_messages");
      }
    }
  }


  async function handleDeleteConversation(event: React.MouseEvent, id: number) {
    event.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus percakapan ini?")) {
      return;
    }

    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleStartNewChat();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus percakapan");
    }
  }

  async function handleSendQuestion(queryText?: string) {
    const query = (queryText ?? question).trim();
    if (!query || isLoading) {
      return;
    }

    setError("");
    setQuestion("");
    setIsLoading(true);

    // Optimistic user message preview
    const tempUserMessage: ChatMessage = {
      id: ++messageCounterRef.current,
      conversation_id: activeConversationId ?? 0,
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Skenario 2: Scroll otomatis ke bawah saat baru saja mengirimkan pesan
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 40);

    try {
      if (isLoggedIn) {
        let currentConvId = activeConversationId;

        // If no active conversation, create a new one first
        if (!currentConvId) {
          const newConv = await createConversation(query.slice(0, 40));
          currentConvId = newConv.id;
          setActiveConversationId(newConv.id);
          setConversations((prev) => [newConv, ...prev]);
        }

        const answerResponse = await sendConversationMessage(currentConvId, query);
        setMessages(answerResponse.messages);

        // Scroll ke bawah saat balasan asisten diterima
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 50);

        // Update list title if necessary
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId && (!c.title || c.title === "New Conversation")
              ? { ...c, title: query.slice(0, 40) }
              : c
          )
        );
      } else {
        // Fallback for guest mode: teruskan history pesan lokal agar tetap memahami konteks
        const guestHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const answer = await askAssistant(query, null, guestHistory);
        const assistantMessage: ChatMessage = {
          id: ++messageCounterRef.current,
          conversation_id: 0,
          role: "assistant",
          content: answer.answer,
          confidence_score: answer.confidence_score,
          sources: answer.sources,
          created_at: answer.created_at || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setTimeout(() => {
          scrollToBottom("smooth");
        }, 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendapatkan respon AI");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSendQuestion();
  }

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ||
    "Percakapan Baru";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-900">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-950 hover:opacity-80"
            href="/"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#750014] text-white font-mono text-sm">
              KA
            </span>
            <span>KelanaAI</span>
          </Link>
          <button
            aria-label="Tutup sidebar"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#750014] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5e0010] active:scale-[0.98]"
            onClick={handleStartNewChat}
            type="button"
          >
            <span className="text-base">+</span> Percakapan Baru
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Riwayat Obrolan
          </div>

          {isLoggedIn ? (
            isFetchingConversations ? (
              <div className="space-y-2 p-2">
                <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">
                Belum ada percakapan tersimpan. Mulai pertanyaan pertamamu!
              </p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conv) => {
                  const isSelected = conv.id === activeConversationId;
                  return (
                    <li key={conv.id}>
                      <div
                        className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                          isSelected
                            ? "bg-slate-100 font-semibold text-slate-950"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        onClick={() => selectConversation(conv.id)}
                      >
                        <span className="truncate pr-2">
                          {conv.title || "Percakapan Tanpa Judul"}
                        </span>
                        <button
                          aria-label="Hapus percakapan"
                          className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Hapus"
                          type="button"
                        >
                          🗑
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Mode Tamu</p>
              <p className="mt-1 leading-relaxed">
                Masuk untuk menyimpan riwayat obrolan di database.
              </p>
              <Link
                className="mt-3 block rounded-lg bg-slate-900 px-3 py-1.5 text-center font-medium text-white hover:bg-slate-800"
                href="/login"
              >
                Masuk Sekarang
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <Link className="hover:text-slate-900" href="/trips">
              ← Dashboard Trip
            </Link>
            <span className="font-mono text-[10px] text-slate-400">RAG v2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Chat Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              aria-label="Buka daftar obrolan"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              ☰
            </button>
            <div className="truncate">
              <h1 className="truncate text-base font-bold text-slate-900">
                {activeTitle}
              </h1>
              <p className="text-xs text-slate-500">
                Didukung oleh Amazon Bedrock Knowledge Base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              href="/"
            >
              Beranda
            </Link>
            {isLoggedIn ? (
              <Link
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                href="/profile"
              >
                Profil
              </Link>
            ) : (
              <Link
                className="rounded-lg bg-[#750014] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5e0010]"
                href="/login"
              >
                Masuk
              </Link>
            )}
          </div>
        </header>

        {/* Messages Feed */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-12 lg:px-24"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#750014] shadow-xs">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Tanya Panduan Wisata KelanaAI
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Ajukan pertanyaan seputar aturan perjalanan, dokumen resmi, visa,
                  serta tips transportasi yang diverifikasi langsung dari dokumen panduan.
                </p>

                {/* Prompt Suggestions */}
                <div className="mt-8 grid gap-2.5 sm:grid-cols-2 text-left">
                  {QUICK_PROMPTS.map((promptText, idx) => (
                    <button
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-medium text-slate-700 transition hover:border-[#750014]/40 hover:bg-red-50/40 hover:text-slate-950 text-left"
                      key={idx}
                      onClick={() => handleSendQuestion(promptText)}
                      type="button"
                    >
                      💡 {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <div
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    key={msg.id}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs ${
                        isUser
                          ? "rounded-tr-xs bg-slate-900 text-white"
                          : "rounded-tl-xs border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {!isUser && (
                        <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#750014]">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              KelanaAI
                            </span>
                            {msg.created_at && (
                              <span className="flex items-center gap-1 text-[11px] font-normal text-slate-400">
                                <span>•</span>
                                <svg
                                  className="h-3 w-3 opacity-70"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
                                </svg>
                                <span>{formatMessageTime(msg.created_at)}</span>
                              </span>
                            )}
                          </div>
                          {typeof msg.confidence_score === "number" && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                msg.confidence_score >= 70
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : msg.confidence_score >= 40
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              Skor Keyakinan: {msg.confidence_score}%
                            </span>
                          )}
                        </div>
                      )}

                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {msg.content}
                      </p>

                      {isUser && msg.created_at && (
                        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                          <svg
                            className="h-3 w-3 opacity-70"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
                          </svg>
                          <span>{formatMessageTime(msg.created_at)}</span>
                        </div>
                      )}

                      {/* Document Citations */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Sumber Rujukan
                          </span>
                          <ul className="mt-1.5 space-y-1">
                            {msg.sources.map((source: AssistantSource, sIdx: number) => (
                              <li key={sIdx}>
                                <a
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline hover:text-blue-800"
                                  href={source.uri}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <span className="rounded bg-blue-50 px-1 py-0.5 font-mono text-[10px] text-blue-700">
                                    DOC
                                  </span>
                                  <span className="truncate max-w-xs sm:max-w-md">
                                    {source.name || getSourceLabel(source.uri)}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-4 sm:px-6 md:px-12 lg:px-24">
          <form
            className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-1.5 shadow-inner focus-within:border-[#750014] focus-within:ring-4 focus-within:ring-[#750014]/10 transition"
            onSubmit={handleSubmit}
          >
            <input
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              disabled={isLoading}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ketik pertanyaanmu seputar destinasi atau aturan wisata..."
              value={question}
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#750014] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#5e0010] disabled:cursor-not-allowed disabled:bg-slate-300 active:scale-[0.97]"
              disabled={isLoading || !question.trim()}
              type="submit"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-white"
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
                <>
                  <span>Kirim</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Jawaban didasarkan pada dokumen resmi yang terunggah di Knowledge Base.
          </p>
        </div>
      </main>
    </div>
  );
}
