'use client';

import { useState } from 'react';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

export default function VideoSection() {
  const { content, t, ui } = useContent();
  const { video, socials } = content;
  const [play, setPlay] = useState(false);
  const youtubeHref = socials.find((s) => s.key === 'youtube')?.href ?? 'https://youtube.com';

  return (
    <section id="video" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo left-[20%] top-[20%] h-80 w-80 bg-coral" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow={ui.video.eyebrow} title={video.title} subtitle={t(video.subtitle)} />

        <Reveal
          variants={{
            hidden: { opacity: 0, scale: 0.94 },
            show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.34, 1.3, 0.5, 1] } },
          }}
        >
          <div className="relative rounded-[2rem] bg-gradient-to-br from-magenta via-coral to-gold p-[3px] shadow-2xl shadow-magenta/30">
            <div className="relative aspect-video overflow-hidden rounded-[1.85rem] bg-night-deep">
              {video.youtubeId && play ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => {
                    if (video.youtubeId) setPlay(true);
                    else window.open(youtubeHref, '_blank');
                  }}
                  className="group absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  {video.youtubeId ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                        alt={video.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night-deep/85 via-night-deep/30 to-night-deep/40" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(232,72,126,0.35),transparent_60%)]" />
                  )}
                  <span className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-cream text-3xl text-night shadow-xl shadow-magenta/30 transition-transform group-hover:scale-110">
                    ▶
                  </span>
                  <span className="relative z-10 text-sm font-semibold uppercase tracking-[0.2em] text-cream/90">
                    {video.youtubeId ? ui.video.watch : ui.video.youtube}
                  </span>
                </button>
              )}
            </div>
            {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((pos) => (
              <span key={pos} className={`absolute ${pos} h-2.5 w-2.5 rounded-full bg-cream/40`} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
