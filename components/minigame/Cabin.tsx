"use client";

import { motion } from "framer-motion";
import { UI, tx } from "@/lib/minigame/i18n";
import type { GameConfig, Lang } from "@/lib/minigame/types";

/**
 * Cabine à secrets : collection des bonus spéciaux attrapés (avec leur
 * anecdote) + contenus exclusifs (prochain album, première cover, version
 * alternative). S'ouvre après un nombre de points cumulés sur les victoires.
 */
export default function Cabin({
  cfg,
  collected,
  icons,
  lang,
  font,
  onClose,
}: {
  cfg: GameConfig;
  collected: string[];
  icons: Record<string, string>;
  lang: Lang;
  font: string;
  onClose: () => void;
}) {
  const cabin = cfg.cabin!;
  const t = UI[lang];
  const specials = cfg.levels.flatMap((l, i) =>
    l.special ? [{ ...l.special, level: i + 1 }] : [],
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="absolute inset-0 overflow-y-auto bg-[#000d1c]/95 px-5 backdrop-blur-md"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 22px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 28px)",
        touchAction: "pan-y",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-[#ffb24a]/70">
          {t.secrets(collected.length, specials.length)}
        </p>
        <button
          onClick={onClose}
          className="font-body text-xs uppercase tracking-[0.2em] text-[#ffd9a8]/70"
        >
          {t.close}
        </button>
      </div>
      <h2
        className="mt-2 text-4xl text-[#ffa53d] [text-shadow:0_4px_0_#001226]"
        style={{ fontFamily: font }}
      >
        {t.cabinTitle}
      </h2>

      {/* Collection des bonus spéciaux */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {specials.map((sp) => {
          const got = collected.includes(sp.id);
          return (
            <div
              key={sp.id}
              className={`rounded-2xl p-3 ${got ? "bg-[#ff8a2a]/12 ring-1 ring-[#ffb24a]/40" : "bg-white/[0.04]"}`}
            >
              <div className="grid h-14 place-items-center">
                {icons[sp.id] ? (
                  <img
                    src={icons[sp.id]}
                    alt=""
                    className={`h-14 w-auto object-contain ${got ? "" : "opacity-25 [filter:brightness(0)_invert(1)]"}`}
                  />
                ) : (
                  <span className="text-3xl text-[#ffd9a8]/50">?</span>
                )}
              </div>
              <p className="mt-1 font-body text-sm font-bold text-[#ffd9a8]">
                {got ? tx(sp.name, lang) : "???"}
              </p>
              <p className="mt-1 font-body text-xs leading-snug text-[#ffd9a8]/70">
                {got ? tx(sp.story, lang) : t.catchAt(sp.level)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Contenus exclusifs : dévoilés seulement quand le bonus correspondant a été attrapé. */}
      {(() => {
        const unlocked = (req?: string) => !req || collected.includes(req);
        const levelOf = (req?: string) =>
          specials.find((sp) => sp.id === req)?.level;
        const Locked = ({ req }: { req?: string }) => (
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/[0.03] p-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded bg-white/[0.04] text-4xl text-[#ffd9a8]/30">
              🔒
            </div>
            <div>
              <p
                className="text-xl text-[#ffd9a8]/50"
                style={{ fontFamily: font }}
              >
                ???
              </p>
              <p className="mt-1 font-body text-sm leading-snug text-[#ffd9a8]/50">
                {t.unlockBy(String(levelOf(req) ?? "?"))}
              </p>
            </div>
          </div>
        );
        return (
          <>
            {unlocked(cabin.album.requires) ? (
              <div className="mt-6 flex gap-4 rounded-2xl bg-white/[0.04] p-4">
                <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded bg-[#0b111c] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                  <img
                    src={cfg.assets.logo}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain p-3 opacity-40 blur-[3px]"
                  />
                  <span
                    className="relative text-5xl text-[#ffb24a] [text-shadow:0_3px_0_#000]"
                    style={{ fontFamily: font }}
                  >
                    ?
                  </span>
                </div>
                <div>
                  <p
                    className="text-xl text-[#ffa53d]"
                    style={{ fontFamily: font }}
                  >
                    {tx(cabin.album.title, lang)}
                  </p>
                  <p className="mt-1 font-body text-sm leading-snug text-[#ffd9a8]/80">
                    {tx(cabin.album.text, lang)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <Locked req={cabin.album.requires} />
              </div>
            )}

            {unlocked(cabin.firstCover.requires) ? (
              <div className="mt-3 flex gap-4 rounded-2xl bg-white/[0.04] p-4">
                <img
                  src={cabin.firstCover.image}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded object-cover shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                />
                <div>
                  <p
                    className="text-xl text-[#ffa53d]"
                    style={{ fontFamily: font }}
                  >
                    {tx(cabin.firstCover.title, lang)}
                  </p>
                  <p className="mt-1 font-body text-sm leading-snug text-[#ffd9a8]/80">
                    {tx(cabin.firstCover.text, lang)}
                  </p>
                </div>
              </div>
            ) : (
              <Locked req={cabin.firstCover.requires} />
            )}
          </>
        );
      })()}
    </motion.div>
  );
}
