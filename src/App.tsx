import { useState, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import VantaBackground from './components/VantaBackground';
import LandingScreen from './screens/LandingScreen';
import InputScreen from './screens/InputScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ErrorScreen from './screens/ErrorScreen';
import type { Screen, Feedback } from './lib/types';

const Background3D = lazy(() => import('./components/Background3D'));

type AppState = Screen | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStart = useCallback(() => setState('input'), []);

  const handleFeedback = useCallback(
    (_questionText: string, _studentAnswer: string, fb: Feedback) => {
      setFeedback(fb);
      setState('feedback');
    },
    [],
  );

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

  const handleBackToLanding = useCallback(() => {
    setState('landing');
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VantaBackground />

      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      {/* Subtle vignette overlay for readability */}
      <div className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/60" />

      {/* Top brand bar (visible on all screens except landing) */}
      <AnimatePresence>
        {state !== 'landing' && (
          <div className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-md shadow-accent-violet/20">
                <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-base font-semibold tracking-tight">Simplify with Shivani</span>
            </button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'landing' && <LandingScreen key="landing" onStart={handleStart} />}
        {state === 'input' && (
          <InputScreen
            key="input"
            onFeedback={handleFeedback}
            onBack={handleBackToLanding}
            onError={handleError}
          />
        )}
        {state === 'feedback' && feedback && (
          <FeedbackScreen key="feedback" feedback={feedback} onTryAnother={handleTryAnother} />
        )}
        {state === 'error' && (
          <ErrorScreen key="error" message={errorMessage} onRetry={handleRetry} onBack={handleBackToLanding} />
        )}
      </AnimatePresence>
    </div>
  );
}
