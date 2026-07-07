import { useState, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import VantaBackground from './components/VantaBackground';
import ProfileMenu from './components/ProfileMenu';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import InputScreen from './screens/InputScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ErrorScreen from './screens/ErrorScreen';
import OutOfCreditsScreen from './screens/OutOfCreditsScreen';
import { useAuth } from './hooks/useAuth';
import type { Screen, Feedback } from './lib/types';

const Background3D = lazy(() => import('./components/Background3D'));

type AppState = Screen | 'error' | 'login' | 'onboarding' | 'out_of_credits';

export default function App() {
  const { user, profile, loading, isUnlimited, refreshProfile, signOut } = useAuth();
  const [state, setState] = useState<AppState>('landing');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
      refreshProfile();
    },
    [refreshProfile],
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

  const showTopBar = state !== 'landing' && state !== 'login' && state !== 'onboarding';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VantaBackground />

      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      {/* Subtle vignette overlay for readability */}
      <div className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/60" />

      {/* Top brand bar (visible on all screens except landing/login/onboarding) */}
      <AnimatePresence>
        {showTopBar && (
          <div className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-md shadow-accent-violet/20">
                <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-base font-semibold tracking-tight whitespace-nowrap">
                Evalwell <span className="font-normal text-white/60">- Simplify with Shivani</span>
              </span>
            </button>
            <ProfileMenu profile={profile} user={user} isUnlimited={isUnlimited} onSignOut={signOut} />
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center" />
      ) : (
        <AnimatePresence mode="wait">
          {state === 'landing' && <LandingScreen key="landing" onStart={handleStart} />}
          {state === 'login' && <LoginScreen key="login" />}
          {state === 'onboarding' && user && (
            <OnboardingScreen key="onboarding" userId={user.id} onComplete={handleOnboardingComplete} />
          )}
          {state === 'input' && (
            <InputScreen
              key="input"
              onFeedback={handleFeedback}
              onBack={handleBackToLanding}
              onError={handleError}
              onOutOfCredits={handleOutOfCredits}
            />
          )}
          {state === 'feedback' && feedback && (
            <FeedbackScreen key="feedback" feedback={feedback} onTryAnother={handleTryAnother} />
          )}
          {state === 'error' && (
            <ErrorScreen key="error" message={errorMessage} onRetry={handleRetry} onBack={handleBackToLanding} />
          )}
          {state === 'out_of_credits' && (
            <OutOfCreditsScreen key="out_of_credits" onBack={handleBackToLanding} />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
