export default function ComparisonSection() {
  const rows = [
    {
      generic: "Guesses at CBSE standards from general training",
      evalwell: "Reads your actual chapter content and marking scheme",
    },
    {
      generic: "Same feedback whether it's a 1-mark or 5-mark question",
      evalwell: "Scores exactly like an examiner would, scaled to the marks",
    },
    {
      generic: "Doesn't know which keywords examiners scan for",
      evalwell: "Flags the exact missing keywords first — before anything else",
    },
    {
      generic: "No idea if your Notice/Letter format is correct",
      evalwell: "Checks real CBSE format rules — heading, box, salutation, word limit",
    },
    {
      generic: "A chat reply",
      evalwell: "A structured examiner's report, every time",
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-3 py-10 sm:px-4 sm:py-16">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/15 bg-white/[0.06] px-3 py-6 shadow-2xl shadow-black/40 backdrop-blur-[40px] sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent"
          aria-hidden
        />

        <div className="relative">
          <h2 className="text-lg sm:text-2xl md:text-4xl font-bold text-white text-center mb-5 sm:mb-10 px-1">
            Why students choose Evalwell over generic AI
          </h2>

          <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10">
            {/* Header row */}
            <div className="grid grid-cols-2">
              <div className="text-center text-[11px] sm:text-base font-semibold text-gray-400 py-2 sm:py-3 bg-white/[0.03] border-r border-white/10">
                ChatGPT · Claude · Gemini
              </div>
              <div className="text-center text-[11px] sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 py-2 sm:py-3 bg-white/[0.03]">
                Evalwell
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-2 border-t border-white/10">
                <div className="p-2.5 sm:p-4 text-gray-400 text-[11px] leading-snug sm:text-sm md:text-base border-r border-white/10 bg-black/10">
                  {row.generic}
                </div>
                <div className="p-2.5 sm:p-4 text-white text-[11px] leading-snug sm:text-sm md:text-base bg-gradient-to-br from-violet-500/10 to-cyan-500/10">
                  {row.evalwell}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
