"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UI } from "@/lib/minigame/i18n";
import { fetchTop, saveEmail, submitScore, type ScoreRow } from "@/lib/minigame/scores";
import type { Lang } from "@/lib/minigame/types";

const PSEUDO_KEY = "minigame:pseudo";

/**
 * Tableau des scores (top 10, total / du jour). Avec `entry`, on demande
 * d'abord le pseudo pour enregistrer le score de la partie.
 */
export default function Leaderboard({
  slug,
  font,
  lang,
  gift,
  entry,
  onClose,
}: {
  slug: string;
  font: string;
  lang: Lang;
  /** Annonce du cadeau (null = pas de cadeau en cours). */
  gift: string | null;
  entry?: { score: number; levels: number; duration: number };
  onClose: () => void;
}) {
  const [pseudo, setPseudo] = useState("");
  const [sent, setSent] = useState(!entry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "day">("all");
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [mine, setMine] = useState<{
    pseudo: string;
    score: number;
    rank?: number;
  } | null>(null);
  const [local, setLocal] = useState(false);
  const t = UI[lang];
  // Top 10 : e-mail pour le cadeau (facultatif).
  const [claim, setClaim] = useState<{ id: string; token: string } | null>(null);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const submitEmail = async () => {
    if (!claim || emailState === "busy") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setEmailState("error");
    setEmailState("busy");
    setEmailState((await saveEmail(claim, email.trim())) ? "saved" : "error");
  };

  useEffect(() => {
    try {
      setPseudo(localStorage.getItem(PSEUDO_KEY) ?? "");
    } catch {
      /* stockage indisponible */
    }
  }, []);

  useEffect(() => {
    if (!sent) return;
    let alive = true;
    setRows(null);
    void fetchTop(slug, period).then((r) => {
      if (!alive) return;
      setRows(r.top);
      setLocal(r.local);
    });
    return () => {
      alive = false;
    };
  }, [sent, period, slug]);

  const submit = async () => {
    if (!entry || busy) return;
    const name = pseudo.trim();
    if (name.length < 2) return setError(t.pseudoShort);
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(PSEUDO_KEY, name);
    } catch {
      /* stockage indisponible */
    }
    const r = await submitScore(slug, { pseudo: name, ...entry });
    setBusy(false);
    if (r.error) return setError(r.error);
    setMine({ pseudo: name, score: entry.score, rank: r.rank });
    setClaim(r.claim ?? null);
    setLocal(r.local);
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="absolute inset-0 z-20 overflow-y-auto bg-[#000d1c]/95 px-5 backdrop-blur-md"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 22px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 28px)",
        touchAction: "pan-y",
      }}
    >
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="font-body text-xs uppercase tracking-[0.2em] text-[#ffd9a8]/70"
        >
          {t.close}
        </button>
      </div>
      <h2
        className="text-center text-4xl text-[#ffa53d] [text-shadow:0_4px_0_#001226]"
        style={{ fontFamily: font }}
      >
        Top 10
      </h2>
      {gift && (
        <p className="mx-auto mt-2 max-w-xs text-center font-body text-xs font-semibold text-[#ffd06b]">
          {gift}
        </p>
      )}

      {!sent && entry && (
        <div className="mx-auto mt-6 max-w-xs text-center font-body">
          <p className="text-sm text-[#ffd9a8]/80">{t.yourScore}</p>
          <p className="text-5xl text-[#ffd06b]" style={{ fontFamily: font }}>
            {t.num(entry.score)}
          </p>
          <p className="mt-1 text-xs text-[#ffd9a8]/55">
            {t.levelsDone(entry.levels)}
          </p>
          <input
            autoFocus
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 16))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t.pseudo}
            maxLength={16}
            className="mt-5 w-full rounded-full border border-[#ffb24a]/40 bg-white/5 px-5 py-3 text-center text-base text-[#ffd9a8] outline-none placeholder:text-[#ffd9a8]/35 focus:border-[#ffb24a]"
          />
          {error && <p className="mt-2 text-xs text-[#ff8a6a]">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] disabled:opacity-50"
          >
            {busy ? "…" : t.save}
          </button>
        </div>
      )}

      {sent && (
        <div className="mx-auto mt-4 max-w-sm font-body">
          {mine?.rank && (
            <p className="mb-3 text-center text-sm text-[#ffd06b]">
              {t.rankLine(mine.rank)}
            </p>
          )}
          {claim && (
            <div className="mb-4 rounded-2xl bg-[#ff8a2a]/12 p-4 text-center ring-1 ring-[#ffb24a]/40">
              {emailState === "saved" ? (
                <p className="text-sm font-semibold text-[#ffd06b]">{t.emailSaved}</p>
              ) : (
                <>
                  <p className="text-sm text-[#ffd9a8]">{t.emailAsk}</p>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.slice(0, 200));
                      if (emailState === "error") setEmailState("idle");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && submitEmail()}
                    placeholder={t.emailPlaceholder}
                    className="mt-3 w-full rounded-full border border-[#ffb24a]/40 bg-white/5 px-5 py-2.5 text-center text-base text-[#ffd9a8] outline-none placeholder:text-[#ffd9a8]/35 focus:border-[#ffb24a]"
                  />
                  {emailState === "error" && (
                    <p className="mt-1.5 text-xs text-[#ff8a6a]">{t.emailInvalid}</p>
                  )}
                  <button
                    onClick={submitEmail}
                    disabled={emailState === "busy"}
                    className="mt-2.5 w-full rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#001c35] disabled:opacity-50"
                  >
                    {emailState === "busy" ? "…" : t.emailSave}
                  </button>
                  <p className="mt-2 text-[10px] leading-snug text-[#ffd9a8]/45">
                    {t.emailPrivacy}{" "}
                    <a href="/confidentialite" target="_blank" className="underline">
                      {t.privacyLink}
                    </a>
                  </p>
                </>
              )}
            </div>
          )}
          <div className="mb-3 flex justify-center gap-2 text-xs uppercase tracking-[0.15em]">
            {(["all", "day"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-1.5 ${period === p ? "bg-[#ffb24a] text-[#001c35]" : "bg-white/5 text-[#ffd9a8]/70"}`}
              >
                {p === "all" ? t.periodAll : t.periodDay}
              </button>
            ))}
          </div>
          {!rows ? (
            <p className="py-8 text-center text-sm text-[#ffd9a8]/50">
              {t.loading}
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#ffd9a8]/50">
              {t.nobody}
            </p>
          ) : (
            <ol className="space-y-1.5">
              {rows.map((r, i) => {
                const me =
                  mine && r.pseudo === mine.pseudo && r.score === mine.score;
                return (
                  <li
                    key={`${r.pseudo}-${r.score}-${r.created_at}`}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${me ? "bg-[#ff8a2a]/20 ring-1 ring-[#ffb24a]" : "bg-white/[0.04]"}`}
                  >
                    <span className="w-7 text-center text-lg">
                      {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}
                    </span>
                    <span className="flex-1 truncate text-sm font-semibold text-[#ffd9a8]">
                      {r.pseudo}
                    </span>
                    <span className="text-xs text-[#ffd9a8]/45">
                      {r.levels} {t.lvShort}
                    </span>
                    <span className="w-20 text-right text-sm font-bold tabular-nums text-[#ffd06b]">
                      {t.num(r.score)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {local && (
            <p className="mt-3 text-center text-[10px] text-[#ffd9a8]/40">
              {t.localBoard}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
