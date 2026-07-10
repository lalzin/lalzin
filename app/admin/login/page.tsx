'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Identifiants incorrects');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const field =
    'w-full rounded-2xl border border-cream/15 bg-cream/[0.04] px-4 py-3 text-cream placeholder-cream/40 outline-none transition-colors focus:border-gold';

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-6">
      <div className="halo left-[20%] top-[20%] h-72 w-72 bg-magenta" />
      <div className="halo bottom-[15%] right-[20%] h-72 w-72 bg-teal" />

      <div className="glass-warm relative w-full max-w-sm rounded-[2rem] p-8">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">🪩</div>
          <h1 className="font-display text-2xl font-extrabold text-cream">Espace admin</h1>
          <p className="mt-1 text-sm text-cream/55">Connexion sécurisée — LALZIN</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            className={field}
            placeholder="Identifiant"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-magenta via-coral to-gold py-3.5 text-base font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-xs text-cream/40 transition-colors hover:text-cream"
        >
          ← Retour au site
        </a>
      </div>
    </main>
  );
}
