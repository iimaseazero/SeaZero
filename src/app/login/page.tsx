'use client';

import { useState, useActionState } from 'react';
import { login, register, type AuthState } from '@/app/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, Anchor } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, undefined);
  const [registerState, registerAction, registerPending] = useActionState<AuthState, FormData>(register, undefined);

  const isLogin = mode === 'login';
  const state = isLogin ? loginState : registerState;
  const pending = isLogin ? loginPending : registerPending;
  const action = isLogin ? loginAction : registerAction;

  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'var(--background)' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)',
            top: '-10%',
            right: '-5%',
          }}
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, var(--steel) 0%, transparent 70%)',
            bottom: '-5%',
            left: '-5%',
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--cyan)' }}
            >
              <Anchor size={22} color="white" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-wider uppercase leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.1em',
                }}
              >
                Sea Zero
              </h1>
            </div>
          </div>
          <p
            className="text-xs tracking-wide"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-muted)',
            }}
          >
            Coastal Route Electrification Simulator
          </p>
        </motion.div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
          }}
        >
          {/* Mode Toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}
          >
            {(['login', 'register'] as Mode[]).map((m) => {
              const isActive = mode === m;
              const Icon = m === 'login' ? LogIn : UserPlus;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(6, 182, 212, 0.2)' : 'transparent'}`,
                  }}
                >
                  <Icon size={14} />
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              );
            })}
          </div>

          {/* Error / Success Message */}
          <AnimatePresence mode="wait">
            {state?.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4 px-4 py-3 rounded-xl text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--red-dim)',
                  color: 'var(--red)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {state.error}
              </motion.div>
            )}
            {state?.success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4 px-4 py-3 rounded-xl text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--green-dim)',
                  color: 'var(--green)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                Registration successful! Check your email to confirm your account, then sign in.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              action={action}
              initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Name (register only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label
                    htmlFor="name"
                    className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Team / Display Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your team name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'var(--glass-strong)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: 'var(--glass-strong)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: 'var(--glass-strong)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={pending}
                whileHover={{ scale: pending ? 1 : 1.01 }}
                whileTap={{ scale: pending ? 1 : 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: pending
                    ? 'var(--glass-strong)'
                    : 'linear-gradient(135deg, var(--cyan) 0%, #0891B2 100%)',
                  color: pending ? 'var(--text-muted)' : '#fff',
                  border: '1px solid transparent',
                  cursor: pending ? 'not-allowed' : 'pointer',
                  boxShadow: pending
                    ? 'none'
                    : '0 4px 20px rgba(6, 182, 212, 0.3)',
                }}
              >
                {pending ? (
                  <>
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Footer toggle */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <p
              className="text-center text-xs"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-muted)',
              }}
            >
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode(isLogin ? 'register' : 'login')}
                className="font-semibold transition-colors"
                style={{ color: 'var(--cyan)' }}
              >
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <motion.p
          className="text-center mt-6 text-[10px] tracking-wide"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-muted)',
            opacity: 0.5,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
        >
          Digital twin of coastal ferry routes
        </motion.p>
      </motion.div>
    </main>
  );
}
