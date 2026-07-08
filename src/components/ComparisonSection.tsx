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
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
        Why not just ChatGPT?
      </h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="text-center text-sm md:text-base font-semibold text-gray-400 pb-2">
          Generic AI
        </div>
        <div className="text-center text-sm md:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 pb-2">
          Evalwell
        </div>
        {rows.map((row, i) => (
          <div key={i} className="contents">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-gray-400 text-sm md:text-base flex items-center">
              {row.generic}
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-400/30 p-4 text-white text-sm md:text-base flex items-center">
              {row.evalwell}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
