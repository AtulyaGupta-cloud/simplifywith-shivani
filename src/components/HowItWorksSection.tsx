export default function HowItWorksSection() {
  const steps = [
    {
      icon: "📚",
      title: "We fed it the real material",
      desc: "Actual CBSE Class 12 English chapters, poems, and marking schemes.",
    },
    {
      icon: "🎯",
      title: "It finds your exact chapter",
      desc: "Not a generic guess — the specific reference material for your question.",
    },
    {
      icon: "✅",
      title: "It grades like an examiner, not a chatbot",
      desc: "Keyword-checked, format-checked, marks-calibrated.",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
        How it actually works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 text-center"
          >
            <div className="text-4xl mb-4">{step.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
