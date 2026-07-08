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
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.06] px-5 py-10 shadow-2xl shadow-black/40 backdrop-blur-[40px] sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent"
          aria-hidden
        />

        <div className="relative">
          <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-10">
            Why not Claude / ChatGPT / Gemini?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="hidden md:block text-center text-sm md:text-base font-semibold text-gray-400 pb-2">
              Generic AI
            </div>
            <div className="hidden md:block text-center text-sm md:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 pb-2">
              Evalwell
            </div>
            {rows.map((row, i) => (
              <div key={i} className="contents">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-gray-400 text-sm md:text-base flex items-center">
                  <span className="md:hidden text-gray-500 text-xs font-semibold mr-2 shrink-0">AI:</span>
                  {row.generic}
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-400/30 p-4 text-white text-sm md:text-base flex items-center">
                  <span className="md:hidden text-cyan-400 text-xs font-semibold mr-2 shrink-0">Evalwell:</span>
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
