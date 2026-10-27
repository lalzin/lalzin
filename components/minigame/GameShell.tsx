"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { games } from "@/games";
import { createAudioContext } from "@/lib/minigame/audio";
import { createEngine, type Engine } from "@/lib/minigame/engine";
import { makeShareCard, shareOrDownload } from "@/lib/minigame/share";
import {
  loadProgress,
  saveProgress,
  type Progress,
} from "@/lib/minigame/progress";
import { track } from "@/lib/minigame/track";
import { UI, formatDay, tx, type UiStrings } from "@/lib/minigame/i18n";
import type { PublicGameSettings } from "@/lib/minigame/publicSettings";
import type { Lang, LevelStats, Localized } from "@/lib/minigame/types";
import { useContent } from "@/components/providers/ContentProvider";
import DebugPanel from "./DebugPanel";
import Cabin from "./Cabin";
import HowTo from "./HowTo";
import Leaderboard from "./Leaderboard";

type Screen = "loading" | "title" | "howto" | "playing" | "won" | "lost";

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const MUTE_KEY = "minigame:muted";

/** Jour courant à Paris (AAAA-MM-JJ) : c'est le fuseau du jour de sortie. */
const parisToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(
    new Date(),
  );

/**
 * Coquille React commune à tous les mini-jeux : écrans (accueil, tuto,
 * victoire), HUD, safe-area. Le HUD à 60 fps est écrit par ref, hors React.
 */
export default function GameShell({
  slug,
  displayFont,
  settings,
}: {
  slug: string;
  displayFont: string;
  /** Réglages publiés depuis l'admin (cover, liens, date de sortie, cadeau). */
  settings: PublicGameSettings;
}) {
  const game = games[slug];
  const cfg = game.config;
  const { lang, setLang } = useContent();
  const t = UI[lang];
  const L = (v: Localized) => tx(v, lang);
  const cover = settings.cover || cfg.assets.cover;
  const links = { ...cfg.links, ...settings.links };
  // Cadeau : annoncé avant et pendant le jour de sortie, plus après.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(parisToday()), []);
  const giftLine =
    settings.gift && settings.releaseDate && today && today <= settings.releaseDate
      ? today === settings.releaseDate
        ? t.giftToday
        : t.gift(formatDay(settings.releaseDate, lang))
      : null;

  // Première visite sans préférence : langue du navigateur.
  useEffect(() => {
    try {
      if (!localStorage.getItem("lalzin:lang"))
        setLang(navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en");
    } catch {
      /* stockage indisponible */
    }
  }, [setLang]);

  // Sourdine : mémorisée, appliquée dès que l'audio existe.
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === "1");
    } catch {
      /* stockage indisponible */
    }
  }, []);
  const toggleMute = () =>
    setMuted((m) => {
      try {
        localStorage.setItem(MUTE_KEY, m ? "0" : "1");
      } catch {
        /* stockage indisponible */
      }
      return !m;
    });
  useEffect(() => {
    engineRef.current?.audio()?.setMuted(muted);
  }, [muted]);
  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [screen, setScreen] = useState<Screen>("loading");
  const [failed, setFailed] = useState(false);
  const [level, setLevel] = useState(0);
  const [tier, setTier] = useState(0);
  const [combo, setCombo] = useState(0);
  const [rush, setRush] = useState(false);
  const [popups, setPopups] = useState<
    {
      id: number;
      text: string;
      x: number;
      y: number;
      kind: "gold" | "disco" | "cold";
    }[]
  >([]);
  const [disco, setDisco] = useState<{ until: number; seconds: number } | null>(
    null,
  );
  const pointsRef = useRef<HTMLSpanElement>(null);
  const chronoRef = useRef<HTMLSpanElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  // Vignettes des bonus spéciaux (images fournies dans la config).
  const icons: Record<string, string> = Object.fromEntries(
    cfg.levels.flatMap((l) =>
      l.special?.image ? [[l.special.id, l.special.image]] : [],
    ),
  );
  const [count, setCount] = useState<{ n: number; key: number } | null>(null);
  // Progression (collection de bonus spéciaux + points cumulés) et classement.
  const [progress, setProgress] = useState<Progress>({
    collected: [],
    totalPoints: 0,
  });
  const [specialToast, setSpecialToast] = useState<{
    state: "spawn" | "caught" | "escaped";
    id: string;
    key: number;
  } | null>(null);
  const [caughtLevel, setCaughtLevel] = useState<string | null>(null);
  const [board, setBoard] = useState<{
    entry?: { score: number; levels: number; duration: number };
  } | null>(null);
  const runStart = useRef(0);
  const [cabinShown, setCabinShown] = useState(false);
  // Ordinateur (souris) : plein écran ; téléphone/tablette : colonne portrait.
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    try {
      setDesktop(
        window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
          navigator.maxTouchPoints === 0,
      );
    } catch {
      /* navigateur ancien : mode mobile */
    }
  }, []);
  const [lyric, setLyric] = useState<{
    text: string;
    hold: boolean;
    key: number;
  } | null>(null);
  const [intro, setIntro] = useState<{ level: number; key: number } | null>(
    null,
  );
  const [moment, setMoment] = useState<{
    id: string;
    tone: "gold" | "soft" | "cold";
    key: number;
  } | null>(null);
  const [stats, setStats] = useState<LevelStats | null>(null);
  const [total, setTotal] = useState(0);
  const [shareState, setShareState] = useState<"idle" | "busy">("idle");
  const [debug, setDebug] = useState(false);
  const screenRef = useRef(screen);
  screenRef.current = screen;
  // Le HUD est écrit hors React : il lit la langue courante par ref.
  const uiRef = useRef<UiStrings>(t);
  uiRef.current = t;

  useEffect(() => setProgress(loadProgress(slug)), [slug]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let engine: Engine | null = null;
    // Outils de test (touches W/D/S, ?level=N) : jamais en production (classement).
    const dbg =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("debug");
    setDebug(dbg);

    (async () => {
      try {
        const factory = await game.scene();
        const e = await createEngine(host, cfg, factory, {
          debug: dbg,
          fonts: { display: displayFont },
          on: {
            gauge: (v) => {
              if (barRef.current)
                barRef.current.style.transform = `scaleX(${v / 100})`;
              if (pctRef.current)
                pctRef.current.textContent = `${Math.floor(v)}%`;
            },
            tier: (t) => {
              setTier(t);
              track("tier", { slug, tier: t * 25 });
            },
            beat: ({ combo: c }) => setCombo(c),
            rush: (r) => setRush(r),
            chrono: (v) => {
              const el = chronoRef.current;
              if (!el) return;
              // v > 0 : bonus restant ; v ≤ 0 : secondes avant la fin du niveau.
              el.textContent =
                v > 0
                  ? `⏱ +${uiRef.current.num(v)}`
                  : uiRef.current.timeLeft(-v);
              el.style.color =
                v > 2500 ? "#9cc2ff" : v > 0 ? "#ff8a6a" : "#ff4a4a";
              if (v <= 0)
                el.animate(
                  [{ transform: "scale(1.35)" }, { transform: "scale(1)" }],
                  { duration: 300 },
                );
            },
            points: (v) => {
              const el = pointsRef.current;
              if (!el) return;
              el.textContent = uiRef.current.num(v);
              el.animate(
                [{ transform: "scale(1.18)" }, { transform: "scale(1)" }],
                { duration: 220 },
              );
            },
            popup: (text, x, y, kind) => {
              const id = Math.random();
              setPopups((p) => [...p.slice(-8), { id, text, x, y, kind }]);
              window.setTimeout(
                () => setPopups((p) => p.filter((q) => q.id !== id)),
                1000,
              );
            },
            hint: (text) => setHint(text || null),
            special: (state, id) => {
              const key = Date.now();
              setSpecialToast({ state, id, key });
              window.setTimeout(
                () => setSpecialToast((t) => (t?.key === key ? null : t)),
                state === "caught" ? 4200 : 2200,
              );
              if (state === "caught") {
                setCaughtLevel(id);
                setProgress((p) => {
                  if (p.collected.includes(id)) return p;
                  const next = { ...p, collected: [...p.collected, id] };
                  saveProgress(slug, next);
                  return next;
                });
                track("easter_egg", { slug, id });
              }
            },
            countdown: (n) => {
              const key = Date.now();
              setCount({ n, key });
              // « Go ! » s'efface tout seul.
              if (n === 0)
                window.setTimeout(
                  () => setCount((c) => (c?.key === key ? null : c)),
                  750,
                );
            },
            disco: (on, seconds) => {
              if (!on) return setDisco(null);
              const until = Date.now() + seconds * 1000;
              setDisco({ until, seconds });
              // Filet de sécurité : la bannière s'efface d'elle-même à la fin du compte à rebours.
              window.setTimeout(
                () => setDisco((d) => (d?.until === until ? null : d)),
                seconds * 1000 + 400,
              );
            },
            level: (i) => {
              setDisco(null);
              setCaughtLevel(null);
              setLevel(i);
              setTier(0);
              setCombo(0);
              setIntro({ level: i, key: Date.now() });
            },
            lyric: (text, hold) =>
              setLyric(text ? { text, hold, key: Date.now() } : null),
            moment: (kind, state) => {
              const TONE: Record<string, "gold" | "soft" | "cold"> = {
                "golden:start": "gold",
                "golden:success": "gold",
                "golden:fail": "cold",
                "breath:start": "soft",
                "breath:moved": "cold",
                "breath:success": "soft",
                "breath:fail": "cold",
              };
              const id = `${kind}:${state}`;
              const tone = TONE[id];
              const key = Date.now();
              setMoment(tone ? { id, tone, key } : null);
              // Les résultats s'effacent seuls ; « start » reste jusqu'au verdict.
              if (tone && state !== "start")
                window.setTimeout(
                  () => setMoment((m) => (m?.key === key ? null : m)),
                  1800,
                );
            },
            lose: (s) => {
              setDisco(null);
              setStats(s);
              setScreen("lost");
              track("level", { slug, level: s.level + 1, lost: 1 });
            },
            win: (s) => {
              setDisco(null);
              setStats(s);
              setTotal((t) => t + s.score);
              setProgress((p) => {
                const next = { ...p, totalPoints: p.totalPoints + s.score };
                saveProgress(slug, next);
                return next;
              });
              setScreen("won");
              track("win", { slug, level: s.level + 1, score: s.score });
            },
          },
        });
        if (cancelled) return e.destroy();
        engine = e;
        engineRef.current = e;
        if (dbg) (window as unknown as { __minigame: Engine }).__minigame = e;
        setScreen("title");
      } catch (err) {
        console.error(err);
        if (!cancelled) setFailed(true);
      }
    })();

    // Page figée : ni rebond, ni barres de défilement (html ET body, sinon le
    // navigateur peut garder une barre sur la racine).
    const html = document.documentElement;
    const prev = html.style.overscrollBehavior;
    const prevOverflow = html.style.overflow;
    html.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      engine?.destroy();
      engineRef.current = null;
      html.style.overscrollBehavior = prev;
      html.style.overflow = prevOverflow;
      document.body.style.overflow = "";
    };
  }, [game, cfg, slug, displayFont]);

  // Tap « Play » : l'AudioContext DOIT naître dans ce geste (iOS).
  // Lance la musique et la partie. Doit être appelé dans un tap (iOS : AudioContext).
  const startGame = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    const actx = createAudioContext();
    runStart.current = performance.now();
    setTotal(0);
    setScreen("playing");
    track("start", { slug });
    // ?level=N : démarrer directement au niveau N (tests).
    const lv =
      process.env.NODE_ENV !== "production"
        ? Number(new URLSearchParams(window.location.search).get("level"))
        : 0;
    void e.start(actx).then(() => {
      e.audio()?.setMuted(mutedRef.current);
      if (lv > 1) e.play(Math.min(lv, cfg.levels.length) - 1);
    });
  }, [slug, cfg.levels.length]);

  const tutoKey = `minigame:${slug}:tuto`;
  // « Play » : tutoriel à la première visite (sans musique), sinon on joue directement.
  const onPlay = useCallback(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(tutoKey) === "1";
    } catch {
      /* stockage indisponible */
    }
    if (seen) startGame();
    else setScreen("howto");
  }, [startGame, tutoKey]);

  const onTutoDone = useCallback(() => {
    try {
      localStorage.setItem(tutoKey, "1");
    } catch {
      /* stockage indisponible */
    }
    startGame();
  }, [startGame, tutoKey]);

  const goLevel = (i: number) => {
    setStats(null);
    if (i === 0) {
      setTotal(0);
      runStart.current = performance.now();
    }
    setScreen("playing");
    engineRef.current?.play(i);
    track("level", { slug, level: i + 1 });
  };

  const onShare = async () => {
    const e = engineRef.current;
    if (!e || !stats || shareState === "busy") return;
    setShareState("busy");
    try {
      const url = `${window.location.origin}/play/${slug}`;
      const blob = await makeShareCard({
        snapshot: e.snapshot(),
        title: cfg.title,
        artist: cfg.artist,
        score: total,
        subtitle: t.shareSubtitle(stats.level + 1, stats.levelName, stats.maxCombo),
        url,
        fontFamily: displayFont,
        amber: cfg.palette.amberB,
      });
      const how = await shareOrDownload(
        blob,
        `${slug}-${total}.png`,
        t.shareText(cfg.artist, cfg.title, total),
        url,
      );
      if (how !== "cancel") track("share", { slug, how });
    } finally {
      setShareState("idle");
    }
  };

  const isLast = stats ? stats.level >= cfg.levels.length - 1 : false;
  const runSeconds = () =>
    Math.round((performance.now() - runStart.current) / 1000);
  const cabinOpen =
    !!cfg.cabin && progress.totalPoints >= cfg.cabin.unlockPoints;
  const specialOf = (id: string) =>
    cfg.levels.find((l) => l.special?.id === id)?.special;
  const font = { fontFamily: displayFont };
  const specialsCount = cfg.levels.filter((l) => l.special).length;
  const cabinLabel = (long: boolean) => {
    if (!cfg.cabin) return "";
    if (cabinOpen)
      return (long ? t.cabinOpenLong : t.cabinOpen)(progress.collected.length, specialsCount);
    const have = t.num(Math.min(progress.totalPoints, cfg.cabin.unlockPoints));
    return (long ? t.cabinLockedLong : t.cabinLocked)(have, t.num(cfg.cabin.unlockPoints));
  };
  const muteButton = (
    <button
      onClick={toggleMute}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={muted ? t.unmute : t.mute}
      title={muted ? t.unmute : t.mute}
      className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-[#001226]/60 text-[#ffd9a8] ring-1 ring-[#ffb24a]/30 backdrop-blur-sm transition active:scale-90"
    >
      <SpeakerIcon muted={muted} />
    </button>
  );

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden bg-[#000d1c] text-[#ffd9a8]"
      style={{ touchAction: "none" }}
    >
      {/* Sur ordinateur / paysage : le jeu garde son cadre portrait 9:16, centré sur la pochette floutée. */}
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
        style={{ backgroundImage: `url(${cover})` }}
      />
      <div
        className="relative mx-auto h-full overflow-hidden bg-[#001c35] shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        style={{
          width: desktop ? "100vw" : "min(100vw, calc(100dvh * 9 / 16))",
          cursor: desktop && screen === "playing" ? "none" : undefined,
        }}
      >
        <div ref={hostRef} className="absolute inset-0" />

        {/* HUD */}
        <AnimatePresence>
          {screen === "playing" && (
            <motion.div
              key="hud"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-0 px-5"
              style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
            >
              <div className="flex items-baseline justify-between font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ffb24a]/75">
                <span>
                  {level + 1}/{cfg.levels.length} · {cfg.levels[level].name}
                </span>
                <span ref={pctRef} className="tabular-nums tracking-normal">
                  0%
                </span>
              </div>
              <div className="relative mt-2 h-[4px] overflow-hidden rounded-full bg-white/10">
                <div
                  ref={barRef}
                  className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#ff8a2a] to-[#ffd08a] shadow-[0_0_14px_#ff8a2a] transition-transform duration-150"
                  style={{ transform: "scaleX(0)" }}
                />
                {[25, 50, 75].map((p, i) => (
                  <span
                    key={p}
                    className={`absolute top-0 h-full w-[2px] ${tier > i ? "bg-[#fff1dc]" : "bg-white/25"}`}
                    style={{ left: `${p}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex h-7 items-center justify-between">
                <span
                  className="text-2xl leading-none text-[#ffd06b] [text-shadow:0_3px_0_#001226]"
                  style={font}
                >
                  <span ref={pointsRef} className="inline-block tabular-nums">
                    0
                  </span>
                  <span className="ml-1 font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ffb24a]/70">
                    pts
                  </span>
                  {/* Bonus chrono : fond à vue, rouge quand il est presque vide */}
                  <span
                    ref={chronoRef}
                    className="ml-3 inline-block font-body text-xs font-bold tabular-nums tracking-normal text-[#9cc2ff]"
                  >
                    ⏱ +0
                  </span>
                </span>
                <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                  {combo >= 2 && (
                    <motion.span
                      key={combo}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                      }}
                      className="rounded-full bg-[#ff8a2a]/15 px-3 py-0.5 font-body text-xs font-bold text-[#ffc477] shadow-[0_0_16px_rgba(255,138,42,0.35)]"
                    >
                      ×{combo} {t.onBeat}
                    </motion.span>
                  )}
                </AnimatePresence>
                {muteButton}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Points flottants à l'endroit de l'action */}
        <AnimatePresence>
          {screen === "playing" &&
            popups.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, y: 0, scale: 0.7 }}
                animate={{ opacity: 1, y: -46, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`pointer-events-none absolute -translate-x-1/2 text-2xl [text-shadow:0_3px_0_#001226] ${
                  p.kind === "disco"
                    ? "bg-gradient-to-r from-[#ff3fa4] via-[#ffd34a] to-[#3fe8ff] bg-clip-text text-transparent"
                    : p.kind === "cold"
                      ? "text-[#9cc2ff]"
                      : "text-[#ffd06b]"
                }`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, ...font }}
              >
                {p.text === "poof" ? t.poof : p.text}
              </motion.span>
            ))}
        </AnimatePresence>

        {/* Mode disco : bannière arc-en-ciel + compte à rebours */}
        <AnimatePresence>
          {disco && screen === "playing" && (
            <motion.div
              key={disco.until}
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="pointer-events-none absolute inset-x-0 bottom-[27%] flex flex-col items-center"
            >
              <motion.p
                className="bg-gradient-to-r from-[#ff3fa4] via-[#ffd34a] to-[#3fe8ff] bg-clip-text text-5xl text-transparent drop-shadow-[0_4px_0_#001226]"
                style={font}
                animate={{ rotate: [-3, 3, -3] }}
                transition={{
                  duration: (60 / cfg.audio.bpm) * 2,
                  repeat: Infinity,
                }}
              >
                Disco ×3
              </motion.p>
              <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ff3fa4] via-[#ffd34a] to-[#3fe8ff]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: disco.seconds, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No rush : bord froid qui pulse + texte qui tremble */}
        <AnimatePresence>
          {rush && screen === "playing" && (
            <motion.div
              key="rush"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: "inset 0 0 120px 30px rgba(70,130,255,0.55)",
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.35, repeat: Infinity }}
              />
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-[34%] text-center text-5xl text-[#9cc2ff] [text-shadow:0_4px_0_#001226,0_0_30px_rgba(90,150,255,0.8)]"
                style={font}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1, x: [0, -6, 5, -3, 0] }}
                transition={{
                  x: { duration: 0.3, repeat: Infinity },
                  scale: { type: "spring", stiffness: 300 },
                }}
              >
                No rush…
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paroles : au premier plan, lisibles, dans le style de la cover */}
        <AnimatePresence mode="wait">
          {lyric && (screen === "playing" || screen === "won") && (
            <LyricLine
              key={lyric.key}
              text={lyric.text}
              hold={lyric.hold}
              font={displayFont}
              onDone={() => setLyric(null)}
            />
          )}
        </AnimatePresence>

        {/* Carte de niveau : nom + mécanique */}
        <AnimatePresence>
          {intro && screen === "playing" && (
            <IntroCard
              key={intro.key}
              index={intro.level}
              count={cfg.levels.length}
              name={cfg.levels[intro.level].name}
              hint={L(cfg.levels[intro.level].hint)}
              label={t.levelOf(intro.level + 1, cfg.levels.length)}
              // Avertissement quand l'aide visuelle disparaît pour la première fois.
              warning={
                (cfg.levels[intro.level].targetHelp ?? "near") === "none" &&
                intro.level > 0 &&
                (cfg.levels[intro.level - 1].targetHelp ?? "near") !== "none"
                  ? t.noMoreHelp
                  : undefined
              }
              font={displayFont}
              onDone={() => setIntro(null)}
            />
          )}
        </AnimatePresence>

        {/* Décompte « 3 2 1 Go » */}
        <AnimatePresence>
          {count && screen === "playing" && (
            <motion.div
              key={count.key}
              initial={{ scale: 2.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
              className={`pointer-events-none absolute inset-x-0 top-[44%] -translate-y-1/2 text-center [text-shadow:0_6px_0_#001226,0_0_40px_rgba(255,138,42,0.6)] ${
                count.n === 0
                  ? "text-8xl text-[#ffd06b]"
                  : "text-9xl text-[#ffa53d]"
              }`}
              style={font}
            >
              {count.n === 0 ? t.go : count.n}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consigne tant que les mains ne se sont pas encore touchées */}
        <AnimatePresence>
          {hint && screen === "playing" && !intro && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ y: { duration: 1.6, repeat: Infinity } }}
              className="pointer-events-none absolute inset-x-6 bottom-[30%] mx-auto max-w-md rounded-full bg-[#001226]/70 px-4 py-2 text-center font-body text-sm font-semibold text-[#ffd06b] backdrop-blur-sm"
            >
              {hint === "target" ? t.hintTarget : hint === "search" ? t.hintSearch : hint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Moments : anneau doré / respiration */}
        <AnimatePresence mode="wait">
          {moment && screen === "playing" && (
            <motion.div
              key={moment.key}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className={`pointer-events-none absolute inset-x-0 bottom-[20%] text-center text-2xl [text-shadow:0_3px_0_#001226] ${
                moment.tone === "gold"
                  ? "text-[#ffd06b]"
                  : moment.tone === "soft"
                    ? "text-[#ffe2b0]"
                    : "text-[#9cc2ff]"
              }`}
              style={font}
            >
              {t.moments[moment.id]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accueil : boucle vidéo + titre + Play */}
        <AnimatePresence>
          {(screen === "title" || screen === "loading") && (
            <motion.div
              key="title"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.2 } }}
              className="absolute inset-0"
            >
              <div
                className="absolute right-4 z-10 flex items-center gap-2"
                style={{ top: "max(env(safe-area-inset-top), 14px)" }}
              >
                <div className="flex rounded-full bg-[#001226]/60 p-0.5 font-body text-[11px] font-bold ring-1 ring-[#ffb24a]/30 backdrop-blur-sm">
                  {(["fr", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      aria-pressed={lang === l}
                      className={`rounded-full px-2.5 py-1.5 uppercase transition ${lang === l ? "bg-[#ffb24a] text-[#001c35]" : "text-[#ffd9a8]/70"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {muteButton}
              </div>
              <video
                className="absolute inset-0 h-full w-full object-cover opacity-45"
                src={cfg.assets.loop}
                poster={cfg.assets.still}
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#001226]/70 via-[#001c35]/20 to-[#001226]/95" />
              <div
                className="absolute inset-0 flex flex-col items-center justify-between px-6 text-center"
                style={{
                  paddingTop: "max(env(safe-area-inset-top), 40px)",
                  paddingBottom: "max(env(safe-area-inset-bottom), 36px)",
                }}
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  className="font-body text-[10px] font-semibold uppercase tracking-[0.55em] text-[#ffb24a]/75"
                >
                  Move the light
                </motion.p>

                {/* La pochette, comme un vinyle posé dans la lumière */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.4,
                    delay: 0.25,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className="relative w-[78%] max-w-[340px]"
                >
                  <div className="absolute -inset-6 rounded-full bg-[#ff8a2a]/25 blur-3xl" />
                  <motion.img
                    src={cover}
                    alt={cfg.title}
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: (60 / 119) * 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative aspect-square w-full rounded-[6px] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,178,74,0.15)]"
                  />
                  <h1 className="sr-only">{cfg.title}</h1>
                </motion.div>

                <div className="flex flex-col items-center gap-5">
                  <p className="max-w-[16rem] font-body text-sm leading-relaxed text-[#ffd9a8]/80">
                    {t.tagline}
                    <span className="mt-1 block text-xs text-[#ffd9a8]/55">
                      {t.controls}
                    </span>
                  </p>
                  {giftLine && (
                    <p className="max-w-xs rounded-full bg-[#ff8a2a]/15 px-4 py-1.5 font-body text-xs font-semibold text-[#ffd06b] ring-1 ring-[#ffb24a]/40">
                      {giftLine}
                    </p>
                  )}
                  <button
                    onClick={onPlay}
                    disabled={screen === "loading"}
                    className="group relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#ffb24a] to-[#ff7a1a] text-[#001c35] shadow-[0_0_50px_rgba(255,138,42,0.55)] transition active:scale-95 disabled:opacity-40"
                    aria-label="Play"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#ff8a2a]/30 [animation-duration:2.4s]" />
                    <svg
                      viewBox="0 0 24 24"
                      className="relative ml-1 h-9 w-9 fill-current"
                    >
                      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
                    </svg>
                  </button>
                  <p className="font-body text-[10px] uppercase tracking-[0.4em] text-white/45">
                    {screen === "loading" ? t.loading : t.turnUp}
                  </p>
                  {screen === "title" && (
                    <button
                      onClick={() => setScreen("howto")}
                      className="font-body text-xs text-[#ffd9a8]/70 underline underline-offset-4"
                    >
                      {t.howToPlay}
                    </button>
                  )}
                  {screen === "title" && (
                    <div className="flex gap-2 font-body text-xs">
                      <button
                        onClick={() => setBoard({})}
                        className="rounded-full bg-white/10 px-4 py-2 text-[#ffd9a8] backdrop-blur-sm"
                      >
                        🏆 Top 10
                      </button>
                      {cfg.cabin && (
                        <button
                          onClick={() => cabinOpen && setCabinShown(true)}
                          className={`rounded-full px-4 py-2 backdrop-blur-sm ${cabinOpen ? "bg-[#ff8a2a]/25 text-[#ffd06b] ring-1 ring-[#ffb24a]/60" : "bg-white/10 text-[#ffd9a8]/60"}`}
                        >
                          {cabinLabel(false)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tutoriel : avant la partie, sans musique */}
        <AnimatePresence>
          {screen === "howto" && (
            <HowTo
              sprites={cfg.tutorialSprites}
              key="howto"
              steps={cfg.tutorial}
              lang={lang}
              font={displayFont}
              onDone={onTutoDone}
            />
          )}
        </AnimatePresence>

        {/* Trop tard : niveau perdu */}
        <AnimatePresence>
          {screen === "lost" && stats && (
            <motion.div
              key="lost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#000814]/75 px-6 text-center backdrop-blur-[2px]"
            >
              <motion.p
                initial={{ scale: 2.2, rotate: -6 }}
                animate={{ scale: 1, rotate: -3 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 12,
                  delay: 0.9,
                }}
                className="text-6xl text-[#ff5f5f] [text-shadow:0_5px_0_#001226]"
                style={font}
              >
                {t.tooLate}
              </motion.p>
              <p className="mt-3 max-w-xs font-body text-sm text-[#ffd9a8]/80">
                {t.tooLateText}
              </p>
              {caughtLevel && specialOf(caughtLevel) && (
                <div className="mt-4 w-full max-w-xs">
                  <EggCard
                    special={specialOf(caughtLevel)!}
                    icon={icons[caughtLevel]}
                    lang={lang}
                    font={displayFont}
                  />
                </div>
              )}
              <p className="mt-1 font-body text-xs text-[#ffd9a8]/50">
                {t.lostLine(stats.level + 1, stats.levelName, t.num(stats.score))}
              </p>
              <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5 font-body">
                <button
                  onClick={() => goLevel(stats.level)}
                  className="rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] shadow-[0_0_30px_rgba(255,138,42,0.45)] active:scale-[0.98]"
                >
                  {t.retry}
                </button>
                {total > 0 && (
                  <button
                    onClick={() =>
                      setBoard({
                        entry: {
                          score: total,
                          levels: stats.level,
                          duration: runSeconds(),
                        },
                      })
                    }
                    className="rounded-full border border-[#ffb24a]/50 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ffd9a8]"
                  >
                    {t.saveRun(t.num(total))}
                  </button>
                )}
                {cfg.cabin && (
                  <button
                    onClick={() => cabinOpen && setCabinShown(true)}
                    className={`rounded-full py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                      cabinOpen
                        ? "bg-[#ff8a2a]/20 text-[#ffd06b] ring-1 ring-[#ffb24a]/60"
                        : "bg-white/5 text-[#ffd9a8]/55"
                    }`}
                  >
                    {cabinLabel(true)}
                  </button>
                )}
                <button
                  onClick={() => goLevel(0)}
                  className="py-2 text-xs uppercase tracking-[0.2em] text-[#ffd9a8]/60"
                >
                  {t.restartFromStart}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Victoire */}
        <AnimatePresence>
          {screen === "won" && stats && (
            <motion.div
              key="won"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.9, delay: 1.4 }}
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#000f20] via-[#000f20]/85 to-transparent px-5 pt-14"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom), 22px)",
              }}
            >
              <img
                src={cfg.assets.logo}
                alt={cfg.artist}
                className="mx-auto mb-2 w-28 drop-shadow-[0_3px_0_rgba(0,12,26,0.9)]"
              />
              <p className="text-center font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-[#ffb24a]/70">
                {t.levelLine(stats.level + 1, stats.levelName)}
              </p>
              <ScoreCounter
                value={isLast ? total : stats.score}
                font={displayFont}
              />
              <p className="-mt-1 text-center font-body text-xs text-[#9cc2ff]/80">
                {stats.timeBonus > 0
                  ? t.timeBonus(t.num(stats.timeBonus))
                  : t.noTimeBonus}
              </p>
              {isLast && (
                <p className="text-center font-body text-xs text-[#ffd9a8]/60">
                  {t.totalOf(cfg.levels.length)}
                </p>
              )}
              {caughtLevel && specialOf(caughtLevel) && (
                <EggCard
                  special={specialOf(caughtLevel)!}
                  icon={icons[caughtLevel]}
                  lang={lang}
                  font={displayFont}
                />
              )}
              <div className="mx-auto mt-2 grid max-w-sm grid-cols-5 gap-1.5 text-center font-body">
                <Stat label={t.stats.time} value={fmtTime(stats.time)} />
                <Stat
                  label={t.stats.onBeat}
                  value={`${stats.hits}/${Math.max(stats.beats, stats.hits)}`}
                />
                <Stat label={t.stats.combo} value={`×${stats.maxCombo}`} />
                <Stat label={t.stats.bonus} value={String(stats.catches)} />
                <Stat label={t.stats.rush} value={String(stats.rushes)} />
              </div>
              <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 font-body">
                {!isLast ? (
                  <button
                    onClick={() => goLevel(stats.level + 1)}
                    className="rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] shadow-[0_0_30px_rgba(255,138,42,0.45)] active:scale-[0.98]"
                  >
                    {t.nextLevel(cfg.levels[stats.level + 1].name)}
                  </button>
                ) : (
                  <button
                    onClick={onShare}
                    className="rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] shadow-[0_0_30px_rgba(255,138,42,0.45)] active:scale-[0.98]"
                  >
                    {shareState === "busy" ? "…" : t.shareScore}
                  </button>
                )}
                {isLast && (
                  <button
                    onClick={() =>
                      setBoard({
                        entry: {
                          score: total,
                          levels: cfg.levels.length,
                          duration: runSeconds(),
                        },
                      })
                    }
                    className="rounded-full border border-[#ffd06b] py-3 text-sm font-bold uppercase tracking-[0.2em] text-[#ffd06b]"
                  >
                    {t.joinTop10}
                  </button>
                )}
                {isLast && cfg.cabin && (
                  <button
                    onClick={() => cabinOpen && setCabinShown(true)}
                    className={`rounded-full py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                      cabinOpen
                        ? "bg-[#ff8a2a]/20 text-[#ffd06b] ring-1 ring-[#ffb24a]/60"
                        : "bg-white/5 text-[#ffd9a8]/55"
                    }`}
                  >
                    {cabinLabel(true)}
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  {links.spotify && (
                    <a
                      href={links.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("streaming_click", { slug, to: "spotify" })
                      }
                      className="rounded-full border border-[#ffb24a]/40 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#ffd9a8]"
                    >
                      Spotify
                    </a>
                  )}
                  {links.appleMusic && (
                    <a
                      href={links.appleMusic}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("streaming_click", { slug, to: "apple" })
                      }
                      className="rounded-full border border-[#ffb24a]/40 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#ffd9a8]"
                    >
                      Apple Music
                    </a>
                  )}
                </div>
                <div className="flex justify-center gap-6 pt-1 text-xs uppercase tracking-[0.2em] text-[#ffd9a8]/60">
                  <button onClick={() => goLevel(stats.level)}>{t.replay}</button>
                  {isLast ? (
                    <button onClick={() => goLevel(0)}>{t.restart}</button>
                  ) : (
                    <button onClick={onShare}>
                      {shareState === "busy" ? "…" : t.share}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bonus spécial en jeu : petite pastille discrète (l'anecdote attend la fin du niveau) */}
        <AnimatePresence>
          {specialToast &&
            specialToast.state !== "caught" &&
            screen === "playing" &&
            specialOf(specialToast.id) && (
              <motion.div
                key={specialToast.key}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 top-[13%] flex justify-center"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-[#001226]/70 px-3 py-1 font-body text-xs font-semibold text-[#ffd06b] backdrop-blur-sm">
                  {specialToast.state === "spawn" && icons[specialToast.id] && (
                    <img
                      src={icons[specialToast.id]}
                      alt=""
                      className="h-5 w-auto"
                    />
                  )}
                  {specialToast.state === "spawn"
                    ? t.specialSpawn
                    : t.specialEscaped}
                </span>
              </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
          {cabinShown && cfg.cabin && (
            <Cabin
              key="cabin"
              cfg={cfg}
              collected={progress.collected}
              icons={icons}
              lang={lang}
              font={displayFont}
              onClose={() => setCabinShown(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {board && (
            <Leaderboard
              key={
                board.entry
                  ? `board-${board.entry.score}-${board.entry.levels}`
                  : "board"
              }
              slug={slug}
              font={displayFont}
              lang={lang}
              gift={giftLine}
              entry={board.entry}
              onClose={() => setBoard(null)}
            />
          )}
        </AnimatePresence>

        {debug && engineRef.current && (
          <DebugPanel engine={engineRef.current} />
        )}

        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#001c35] p-8 text-center font-body text-[#ffb24a]">
            {t.noWebgl}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-1 py-1.5">
      <div className="text-sm font-bold tabular-nums text-[#ffd9a8]">
        {value}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-[#ffd9a8]/50">
        {label}
      </div>
    </div>
  );
}

function ScoreCounter({ value, font }: { value: number; font: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / 1400);
      setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <p
      className="mt-1 text-center text-5xl tabular-nums text-[#ffa53d] [text-shadow:0_0_40px_rgba(255,138,42,0.5)]"
      style={{ fontFamily: font }}
    >
      {n}
    </p>
  );
}

/** Une ligne de paroles, façon titre de la cover : orange plein, ombre portée bleu nuit. */
function LyricLine({
  text,
  hold,
  font,
  onDone,
}: {
  text: string;
  hold: boolean;
  font: string;
  onDone: () => void;
}) {
  // Ref : le parent se re-rend souvent (combo), le minuteur ne doit pas repartir à zéro.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (hold) return;
    const id = window.setTimeout(() => done.current(), 5200);
    return () => window.clearTimeout(id);
  }, [hold]);
  return (
    <motion.p
      initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
      transition={{ duration: 0.9 }}
      className="pointer-events-none absolute inset-x-6 top-[19%] text-center text-[2.1rem] leading-[1.05] text-[#ffa53d] [text-shadow:0_4px_0_#001226,0_0_28px_rgba(255,138,42,0.55)]"
      style={{ fontFamily: font }}
    >
      {text}
    </motion.p>
  );
}

function IntroCard(props: {
  label: string;
  index: number;
  count: number;
  name: string;
  hint: string;
  warning?: string;
  font: string;
  onDone: () => void;
}) {
  const done = useRef(props.onDone);
  done.current = props.onDone;
  const long = !!props.warning;
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), long ? 3800 : 2400);
    return () => window.clearTimeout(id);
  }, [long]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="pointer-events-none absolute inset-x-6 top-[13%] mx-auto max-w-md rounded-2xl bg-[#001226]/70 px-5 py-4 text-center backdrop-blur-sm"
    >
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-[#ffb24a]/70">
        {props.label}
      </p>
      <p
        className="mt-1 text-3xl text-[#ffa53d] [text-shadow:0_3px_0_#001226]"
        style={{ fontFamily: props.font }}
      >
        {props.name}
      </p>
      {props.warning && (
        <motion.p
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.06, 1], opacity: 1 }}
          transition={{
            scale: { duration: 0.8, repeat: Infinity },
            opacity: { duration: 0.3 },
          }}
          className="mx-auto mt-3 inline-block rounded-full border border-[#ff7a5a]/60 bg-[#ff5f5f]/15 px-3 py-1 font-body text-xs font-bold text-[#ffb3a0]"
        >
          ⚠ {props.warning}
        </motion.p>
      )}
      <p className="mt-2 font-body text-sm text-[#ffd9a8]/85">{props.hint}</p>
    </motion.div>
  );
}

/** Fin de niveau : l'easter egg attrapé et son anecdote. */
function EggCard({
  special,
  icon,
  lang,
  font,
}: {
  special: { icon: string; name: Localized; story: Localized };
  icon?: string;
  lang: Lang;
  font: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 1.8 }}
      className="mx-auto mt-3 flex max-w-sm items-center gap-3 rounded-2xl bg-[#ff8a2a]/15 px-4 py-3 text-left ring-1 ring-[#ffd06b]/60"
    >
      <motion.img
        src={icon}
        alt=""
        className="h-14 w-16 shrink-0 object-contain"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.8, delay: 2.2, repeat: 2 }}
      />
      <div>
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffd06b]">
          {UI[lang].eggFound}
        </p>
        <p
          className="text-lg leading-tight text-[#ffa53d]"
          style={{ fontFamily: font }}
        >
          {tx(special.name, lang)}
        </p>
        <p className="mt-0.5 font-body text-xs leading-snug text-[#ffd9a8]/85">
          {tx(special.story, lang)}
        </p>
      </div>
    </motion.div>
  );
}

/** Haut-parleur (barré quand la musique est coupée). */
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      )}
    </svg>
  );
}
