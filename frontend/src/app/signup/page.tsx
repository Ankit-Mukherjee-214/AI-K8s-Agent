"use client";

import React, { useState } from 'react';
import { insforge } from '@/services/insforge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await insforge.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.requireEmailVerification) {
      setStep('verify');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await insforge.auth.verifyEmail({
      email,
      otp,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // User is now verified and signed in
      router.push('/');
    }
  };

  const resendCode = async () => {
    setError(null);
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) {
      setError(error.message);
    } else {
      alert('Verification code resent to your email.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {step === 'signup' ? 'Create an Account' : 'Verify Your Email'}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              We've sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below to complete your registration.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg font-bold"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div className="text-center mt-4 flex flex-col gap-2">
              <button 
                type="button" 
                onClick={resendCode}
                className="text-sm text-blue-600 hover:underline"
              >
                Resend code
              </button>
              <button 
                type="button" 
                onClick={() => setStep('signup')}
                className="text-sm text-gray-500 hover:underline"
              >
                Back to signup
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
