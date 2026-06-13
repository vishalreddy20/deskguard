'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight } from 'lucide-react';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { toast } from 'sonner';

export default function SignupPage() {
  const { signup, state } = useDeskGuard();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'librarian'>('student');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (state.currentUser) {
      router.replace(state.currentUser.role === 'librarian' ? '/librarian' : '/dashboard');
    }
  }, [state.currentUser, router]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));
    const result = signup(name.trim(), email.trim(), password, role);

    if (!result.ok) {
      setErrors({ general: result.error });
      toast.error(result.error ?? 'Signup failed');
      setLoading(false);
      return;
    }

    toast.success('Account created successfully! Welcome to DeskGuard 🎉');
    setTimeout(() => {
      router.replace(role === 'librarian' ? '/librarian' : '/dashboard');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="fixed -top-32 -right-20 w-96 h-96 rounded-full bg-[#1e3a8a]/5 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#10b981]/5 blur-3xl pointer-events-none" />

      <main className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-100 px-8 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-[#1e3a8a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a8a] tracking-tight">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join DeskGuard — Find your seat. Keep it fair.</p>
          </div>
        </div>

        {/* General error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30
                  ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-[#1e3a8a]'}`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-[#1e3a8a]'}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-[#1e3a8a]'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Role</label>
            <div className="flex bg-slate-100 rounded-xl p-1 relative">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${role === 'librarian' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}
              />
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 z-10 text-xs font-semibold rounded-lg transition-colors ${role === 'student' ? 'text-[#1e3a8a]' : 'text-slate-400'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('librarian')}
                className={`flex-1 py-2 z-10 text-xs font-semibold rounded-lg transition-colors ${role === 'librarian' ? 'text-[#1e3a8a]' : 'text-slate-400'}`}
              >
                Librarian
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1e3a8a] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </main>
    </div>
  );
}
