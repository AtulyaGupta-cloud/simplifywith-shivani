import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);
const missingSupabaseConfig = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (missingSupabaseConfig) {
  root.render(
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold">Supabase configuration required</h1>
        <p className="mt-3 leading-relaxed text-white/70">
          Copy <code className="text-accent-cyan">.env.example</code> to{' '}
          <code className="text-accent-cyan">.env.local</code>, then add your Supabase project URL and anon key.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/30 p-4 text-sm text-white/80">
          VITE_SUPABASE_URL=https://your-project.supabase.co{`\n`}
          VITE_SUPABASE_ANON_KEY=your-public-anon-key
        </pre>
        <p className="mt-4 text-sm text-white/50">Restart the development server after saving the file.</p>
      </section>
    </main>,
  );
} else {
  void import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
