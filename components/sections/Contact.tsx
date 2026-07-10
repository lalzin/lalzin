'use client';

import { useState } from 'react';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

export default function Contact() {
  const { content, ui } = useContent();
  const email = content.artist.bookingEmail;
  const subjects = ui.contact.subjects;
  const [form, setForm] = useState<{ name: string; email: string; subject: string; message: string }>({
    name: '',
    email: '',
    subject: subjects.booking,
    message: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(`${form.name}\n${form.email}\n\n${form.message}`);
    const subject = encodeURIComponent(`[${form.subject}] — ${form.name || 'Contact'}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const field =
    'w-full rounded-2xl border border-cream/15 bg-cream/[0.04] px-4 py-3 text-cream placeholder-cream/40 outline-none transition-colors focus:border-gold focus:bg-cream/[0.07]';

  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo left-[15%] top-[20%] h-80 w-80 bg-coral" />
      <div className="halo bottom-[10%] right-[15%] h-72 w-72 bg-magenta" />

      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow={ui.contact.eyebrow} title={ui.contact.title} subtitle={ui.contact.subtitle} />

        <Reveal
          variants={{
            hidden: { opacity: 0, y: 30 },
            show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.34, 1.3, 0.5, 1] } },
          }}
        >
          <div className="glass-warm rounded-[2.5rem] p-6 sm:p-10">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder={ui.contact.name}
                  className={field}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  required
                  type="email"
                  placeholder={ui.contact.email}
                  className={field}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <select
                className={field}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                {Object.values(subjects).map((s) => (
                  <option key={s} className="bg-night" value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <textarea
                required
                rows={5}
                placeholder={ui.contact.message}
                className={`${field} resize-none`}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-magenta via-coral to-gold py-4 text-base font-bold text-night shadow-xl shadow-magenta/30 transition-transform hover:scale-[1.02]"
              >
                <span className="relative z-10">{ui.contact.send} ✉</span>
                <span className="absolute inset-0 -translate-x-full bg-cream/30 transition-transform duration-500 group-hover:translate-x-0" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-cream/60">
              {ui.contact.or}{' '}
              <a href={`mailto:${email}`} className="font-semibold text-gold underline-offset-4 hover:underline">
                {email}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
