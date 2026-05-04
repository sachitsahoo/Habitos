import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../context/DarkModeContext';

type Mode = 'signin' | 'signup';

function mapAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string }).code ?? '';
  if (code === '23505' || msg.includes('already exists') || msg.includes('duplicate'))
    return 'Display name already taken. Please choose another.';
  if (msg.toLowerCase().includes('user already registered'))
    return 'An account with this email already exists.';
  return msg || 'Something went wrong.';
}

export function AuthScreen({ invitePending = false }: { invitePending?: boolean }) {
  const { isDark } = useDarkMode();
  const [mode, setMode] = useState<Mode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Display name is required.');
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: data.user.id, display_name: displayName.trim() }, { onConflict: 'id' });
          if (profileError) throw profileError;
        }

        // data.session is null when email confirmation is required
        if (!data.session) {
          setAwaitingConfirmation(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
    isDark
      ? 'bg-[#2D3E54] border-[#3A4A5E] text-[#E8E6E0] placeholder-[#6B6B6B] focus:border-[#7AA897]'
      : 'bg-white border-[#D4D2CA] text-[#2D2D2D] placeholder-[#9B9B9B] focus:border-[#6B9B8C]'
  }`;

  const labelClass = `block text-xs font-medium mb-1.5 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`;

  // ── Awaiting email confirmation ─────────────────────────────────────────────
  if (awaitingConfirmation) {
    return (
      <div className={`size-full flex items-center justify-center ${isDark ? 'bg-[#1A2332]' : 'bg-[#F8F7F4]'}`}>
        <div className="w-full max-w-sm px-4 text-center flex flex-col items-center gap-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}>
            <span className="text-white font-semibold text-2xl">a</span>
          </div>
          <div>
            <p className={`font-semibold text-lg ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
              Check your email
            </p>
            <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
              We sent a confirmation link to{' '}
              <span className={`font-medium ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>{email}</span>.
              <br />Click it to activate your account.
            </p>
          </div>
          <button
            onClick={() => setAwaitingConfirmation(false)}
            className={`text-sm underline-offset-2 hover:underline ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Sign in / Sign up ───────────────────────────────────────────────────────
  return (
    <div className={`size-full flex items-center justify-center ${isDark ? 'bg-[#1A2332]' : 'bg-[#F8F7F4]'}`}>
      <div className="w-full max-w-sm px-4">
        {/* Invite banner */}
        {invitePending && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm text-center border ${
            isDark
              ? 'bg-[#7AA897]/10 border-[#7AA897]/30 text-[#7AA897]'
              : 'bg-[#6B9B8C]/10 border-[#6B9B8C]/30 text-[#6B9B8C]'
          }`}>
            You've been invited to a group. Sign in or create an account to join.
          </div>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}>
            <span className="text-white font-semibold text-2xl">a</span>
          </div>
          <span className={`font-semibold text-2xl ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            ataraxia
          </span>
          <p className={`text-sm ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div
          className={`rounded-2xl p-6 border ${isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'}`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label className={labelClass}>Display name</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  autoComplete="name"
                  maxLength={50}
                  required
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                className={inputClass}
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[#C84C4C] bg-[#C84C4C]/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 ${
                isDark
                  ? 'bg-[#7AA897] hover:bg-[#669989] text-[#1A2332]'
                  : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] text-white'
              }`}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className={`text-center text-sm mt-4 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className={`font-medium underline-offset-2 hover:underline ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
