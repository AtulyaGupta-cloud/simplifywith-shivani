import { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GraduationCap, Loader2 } from 'lucide-react';
import VantaBackground from './components/VantaBackground';
import ProfileMenu from './components/ProfileMenu';
import VisualEffectBoundary from './components/VisualEffectBoundary';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import InputScreen from './screens/InputScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ErrorScreen from './screens/ErrorScreen';
import OutOfCreditsScreen from './screens/OutOfCreditsScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import { useAuth } from './hooks/useAuth';
import type { PricingPlan } from './lib/pricing';
import type { Screen, Feedback } from './lib/types';

const Background3D = lazy(() => import('./components/Background3D'));

type AppState = Screen | 'error' | 'login' | 'onboarding' | 'out_of_credits' | 'payment_success';

interface PendingPurchase {
  planId: string;
  creditAmount: number | null;
  unlimitedDays?: number;
  creditsBefore: number;
  unlimitedBefore: string | null;
  startedAt: number;
}

const PURCHASE_STORAGE_KEY = 'evalwell_pending_purchase';

export default function App() {
  const { user, profile, loading, isUnlimited, refreshProfile, signOut } = useAuth();
  const [state, setState] = useState<AppState>('landing');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(() => {
    try {
      const saved = sessionStorage.getItem(PURCHASE_STORAGE_KEY);
      return saved ? JSON.parse(saved) as PendingPurchase : null;
    } catch {
      return null;
    }
  });
  const autoRoutedUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || autoRoutedUser.current === user.id) return;
    autoRoutedUser.current = user.id;
    setState(profile?.name?.trim() ? 'input' : 'onboarding');
  }, [loading, user, profile]);

  useEffect(() => {
    if (!user || !pendingPurchase) return;
    let active = true;
    let checking = false;

    const checkPayment = async () => {
      if (checking || !active) return;
      checking = true;
      try {
        if (Date.now() - pendingPurchase.startedAt > 30 * 60 * 1000) {
          sessionStorage.removeItem(PURCHASE_STORAGE_KEY);
          setPendingPurchase(null);
          return;
        }

        const updated = await refreshProfile();
        if (!active || !updated) return;
        const expectedCredits = pendingPurchase.creditAmount;
        const creditsArrived = expectedCredits !== null &&
          updated.credits >= pendingPurchase.creditsBefore + expectedCredits;
        const oldUnlimited = pendingPurchase.unlimitedBefore
          ? new Date(pendingPurchase.unlimitedBefore).getTime()
          : 0;
        const unlimitedArrived = expectedCredits === null && !!updated.unlimited_until &&
          new Date(updated.unlimited_until).getTime() > Math.max(oldUnlimited, pendingPurchase.startedAt);

        if (creditsArrived || unlimitedArrived) {
          setPaymentMessage(
            expectedCredits === null
              ? `${pendingPurchase.unlimitedDays ?? 60} days of unlimited evaluations have been added to your account.`
              : `${expectedCredits} credits have been added to your account.`,
          );
          sessionStorage.removeItem(PURCHASE_STORAGE_KEY);
          setPendingPurchase(null);
          setState('payment_success');
        }
      } finally {
        checking = false;
      }
    };

    void checkPayment();
    const interval = window.setInterval(checkPayment, 4_000);
    window.addEventListener('focus', checkPayment);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', checkPayment);
    };
  }, [pendingPurchase, refreshProfile, user]);

  const handleStart = useCallback(() => {
    if (!user) {
      setState('login');
      return;
    }
    if (profile && !profile.name) {
      setState('onboarding');
      return;
    }
    setState('input');
  }, [user, profile]);

  const handleFeedback = useCallback(
    (_questionText: string, _studentAnswer: string, fb: Feedback) => {
      setFeedback(fb);
      setState('feedback');
    },
    [],
  );

  const handleOutOfCredits = useCallback(() => setState('out_of_credits'), []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setState('error');
  }, []);

  const handleTryAnother = useCallback(() => {
    setFeedback(null);
    setState('input');
  }, []);

  const handleRetry = useCallback(() => {
    setFeedback(null);
    setState('input');
  }, []);

  const handleBackToLanding = useCallback(() => setState('landing'), []);

  const handleOnboardingComplete = useCallback(async () => {
    await refreshProfile();
    setState('input');
  }, [refreshProfile]);

  const handlePurchaseStart = useCallback((plan: PricingPlan) => {
    if (!profile) return;
    const purchase: PendingPurchase = {
      planId: plan.id,
      creditAmount: plan.creditAmount,
      unlimitedDays: plan.unlimitedDays,
      creditsBefore: profile.credits,
      unlimitedBefore: profile.unlimited_until,
      startedAt: Date.now(),
    };
    sessionStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchase));
    setPendingPurchase(purchase);
  }, [profile]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    autoRoutedUser.current = null;
    sessionStorage.removeItem(PURCHASE_STORAGE_KEY);
    setPendingPurchase(null);
    setFeedback(null);
    setPaymentMessage('');
    setState('landing');
  }, [signOut]);

  const showTopBar = state !== 'landing' && state !== 'login' && state !== 'onboarding';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VisualEffectBoundary>
        <VantaBackground />
      </VisualEffectBoundary>

      <VisualEffectBoundary>
        <Suspense fallback={null}>
          <Background3D />
        </Suspense>
      </VisualEffectBoundary>

      {/* Subtle vignette overlay for readability */}
      <div className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/60" />

      {/* Top brand bar (visible on all screens except landing/login/onboarding) */}
      <AnimatePresence>
        {showTopBar && (
          <div className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-md shadow-accent-violet/20">
                <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
              </div>
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight sm:text-base">
                Evalwell <span className="hidden font-normal text-white/60 sm:inline">- Simplify with Shivani</span>
              </span>
            </button>
            <ProfileMenu
              profile={profile}
              user={user}
              isUnlimited={isUnlimited}
              onSignOut={handleSignOut}
              onPurchaseStart={handlePurchaseStart}
            />
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-3 text-white/60">
          <Loader2 className="h-7 w-7 animate-spin text-accent-cyan" aria-hidden />
          <span className="text-sm">Loading Evalwell…</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {state === 'landing' && <LandingScreen key="landing" onStart={handleStart} />}
          {state === 'login' && <LoginScreen key="login" />}
          {state === 'onboarding' && user && (
            <OnboardingScreen
              key="onboarding"
              userId={user.id}
              email={user.email ?? ''}
              onComplete={handleOnboardingComplete}
            />
          )}
          {state === 'input' && (
            <InputScreen
              key="input"
              onFeedback={handleFeedback}
              onBack={handleBackToLanding}
              onError={handleError}
              onOutOfCredits={handleOutOfCredits}
              onSubmitted={refreshProfile}
            />
          )}
          {state === 'feedback' && feedback && (
            <FeedbackScreen key="feedback" feedback={feedback} onTryAnother={handleTryAnother} />
          )}
          {state === 'error' && (
            <ErrorScreen key="error" message={errorMessage} onRetry={handleRetry} onBack={handleBackToLanding} />
          )}
          {state === 'out_of_credits' && (
            <OutOfCreditsScreen
              key="out_of_credits"
              onBack={handleBackToLanding}
              onPurchaseStart={handlePurchaseStart}
            />
          )}
          {state === 'payment_success' && (
            <PaymentSuccessScreen
              key="payment_success"
              message={paymentMessage}
              onContinue={() => setState('input')}
            />
          )}
        </AnimatePresence>
      )}

      {pendingPurchase && state !== 'payment_success' && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-accent-cyan/20 bg-ink-900/90 px-4 py-3 text-xs text-white/70 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-cyan" aria-hidden />
          <p>
            Waiting for payment confirmation. Use <span className="font-medium text-white">{profile?.email || 'your Google account email'}</span> at checkout.
          </p>
        </div>
      )}
    </div>
  );
}
