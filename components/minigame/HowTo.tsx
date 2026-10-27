"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { UI, tx } from "@/lib/minigame/i18n";
import type { GameConfig, Lang, TutorialStep } from "@/lib/minigame/types";

/**
 * Tutoriel avant la partie (sans musique) : quelques cartes illustrées.
 * Le dernier bouton lance la partie — c'est ce tap qui débloque l'audio sur iOS.
 */
/** Planche de silhouettes (optionnelle) pour illustrer avec les vrais danseurs. */
export type HowToSprites = NonNullable<GameConfig["tutorialSprites"]>;

export default function HowTo({
  steps,
  lang,
  font,
  onDone,
  sprites,
}: {
  steps: TutorialStep[];
  lang: Lang;
  font: string;
  onDone: () => void;
  sprites?: HowToSprites;
}) {
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;
  const t = UI[lang];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="absolute inset-0 flex flex-col bg-[#000d1c]/85 px-6 backdrop-blur-md"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 28px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 28px)",
      }}
    >
      <div className="flex items-center justify-between font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-[#ffb24a]/70">
        <span>{t.howToTitle}</span>
        <button
          onClick={onDone}
          className="tracking-[0.2em] text-[#ffd9a8]/60 underline-offset-4 hover:underline"
        >
          {t.skip}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <div className="relative h-52 w-64 overflow-hidden rounded-2xl bg-[#001c35] shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
              <Art kind={step.art} sprites={sprites} />
            </div>
            <p
              className="mt-6 text-3xl leading-tight text-[#ffa53d] [text-shadow:0_3px_0_#001226]"
              style={{ fontFamily: font }}
            >
              {tx(step.title, lang)}
            </p>
            <p className="mt-3 max-w-xs font-body text-[15px] leading-relaxed text-[#ffd9a8]/85">
              {tx(step.text, lang)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {steps.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-[#ffb24a]" : "w-1.5 bg-white/25"}`}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="w-full max-w-xs rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 font-body text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] shadow-[0_0_30px_rgba(255,138,42,0.45)] active:scale-[0.98]"
        >
          {last ? t.letsGo : t.next}
        </button>
      </div>
    </motion.div>
  );
}

/** Petites illustrations animées, dans la palette du jeu. */
function Art({
  kind,
  sprites,
}: {
  kind: TutorialStep["art"];
  sprites?: HowToSprites;
}) {
  const amber = "#ffb24a";
  const loop = { repeat: Infinity, ease: "easeInOut" as const };
  // Store en fond, commun à toutes les cartes.
  const slats = (
    <div
      className="absolute inset-0 opacity-50"
      style={{
        background:
          "repeating-linear-gradient(-20deg, rgba(255,138,42,0.55) 0 9px, transparent 9px 20px)",
        maskImage:
          "linear-gradient(90deg, black 0%, black 65%, transparent 70%)",
        WebkitMaskImage:
          "linear-gradient(90deg, black 0%, black 65%, transparent 70%)",
      }}
    />
  );

  if (kind === "light")
    return (
      <>
        {slats}
        <motion.div
          className="absolute top-[38%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${amber}cc 0%, ${amber}33 45%, transparent 70%)`,
          }}
          animate={{ left: ["22%", "78%", "22%"] }}
          transition={{ duration: 3.2, ...loop }}
        />
        {/* Le doigt, en bas, qui glisse lentement */}
        <motion.div
          className="absolute bottom-5 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-[#ffd9a8] bg-white/10"
          animate={{ left: ["22%", "78%", "22%"] }}
          transition={{ duration: 3.2, ...loop }}
        />
        <div className="absolute bottom-[38px] left-[18%] right-[18%] h-px bg-gradient-to-r from-transparent via-[#ffd9a8]/40 to-transparent" />
      </>
    );

  if (kind === "hands") {
    // Les vrais danseurs (pose 1, découpée elle / lui) qui se rapprochent.
    const k = 0.4;
    const part = (left: boolean) =>
      sprites ? (
        <div
          className="h-full"
          style={{
            width: (left ? sprites.split : sprites.cellW - sprites.split) * k,
            background: "#050f22",
            WebkitMaskImage: `url(${sprites.src})`,
            maskImage: `url(${sprites.src})`,
            WebkitMaskSize: `${sprites.atlasW * k}px ${sprites.atlasH * k}px`,
            maskSize: `${sprites.atlasW * k}px ${sprites.atlasH * k}px`,
            WebkitMaskPosition: `${left ? 0 : -sprites.split * k}px 0px`,
            maskPosition: `${left ? 0 : -sprites.split * k}px 0px`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />
      ) : (
        <div className="h-full w-12 rounded-t-full bg-[#06142a]" />
      );
    const h = sprites ? sprites.cellH * k : 140;
    return (
      <>
        {slats}
        <motion.div
          className="absolute bottom-3 left-[8%]"
          style={{ height: h }}
          animate={{ x: [0, 22, 0] }}
          transition={{ duration: 3, ...loop }}
        >
          {part(true)}
        </motion.div>
        <motion.div
          className="absolute bottom-3 right-[8%]"
          style={{ height: h }}
          animate={{ x: [0, -22, 0] }}
          transition={{ duration: 3, ...loop }}
        >
          {part(false)}
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-[50%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff3d6 0%, #ffb24a88 40%, transparent 70%)",
          }}
          animate={{ scale: [0, 0, 1.4, 0, 0], opacity: [0, 0, 1, 0, 0] }}
          transition={{
            duration: 3,
            times: [0, 0.4, 0.5, 0.6, 1],
            repeat: Infinity,
          }}
        />
      </>
    );
  }

  if (kind === "rhythm")
    return (
      <>
        {slats}
        <div className="absolute inset-x-0 top-[34%] flex justify-center gap-4">
          {[0, 1, 2, 3].map((k) => (
            <motion.span
              key={k}
              className="h-5 w-5 rounded-full bg-[#ffb24a]"
              animate={{ scale: [1, 1.6, 1], opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 0.5,
                delay: k * 0.5,
                repeat: Infinity,
                repeatDelay: 1.5,
              }}
            />
          ))}
        </div>
        {/* Geste brusque = barré */}
        <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 font-body text-xs font-bold text-[#9cc2ff]">
          <motion.span
            animate={{ x: [-30, 30, -30] }}
            transition={{ duration: 0.35, repeat: Infinity }}
          >
            ⟶⟶
          </motion.span>
          <span className="rounded-full border border-[#9cc2ff]/60 px-2 py-0.5">
            No rush
          </span>
        </div>
      </>
    );

  // bonus
  return (
    <>
      {slats}
      <motion.div
        className="absolute left-1/2 top-[64%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ffd9a8]/50"
        style={{
          background: `radial-gradient(circle, ${amber}55 0%, transparent 70%)`,
        }}
      />
      {(["♫", "◉", "✦"] as const).map((g, k) => (
        <motion.span
          key={g}
          className="absolute text-2xl"
          style={{
            left: `${36 + k * 12}%`,
            color: k === 2 ? "#ff6fc0" : "#ffd27a",
          }}
          animate={{ top: ["-12%", "58%"], opacity: [1, 1, 0] }}
          transition={{
            duration: 1.8,
            delay: k * 0.6,
            repeat: Infinity,
            times: [0, 0.85, 1],
          }}
        >
          {g}
        </motion.span>
      ))}
      <div className="absolute bottom-3 left-1/2 w-40 -translate-x-1/2">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full bg-[#9cc2ff]"
            animate={{ width: ["100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="mt-1 text-center font-body text-[10px] font-bold text-[#9cc2ff]">
          ⏱ bonus chrono
        </p>
      </div>
    </>
  );
}
