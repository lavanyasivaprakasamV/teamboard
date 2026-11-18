const PREVIEW = [
  { label: "To Do", dot: "bg-slate-400", cards: 3 },
  { label: "In Progress", dot: "bg-amber-400", cards: 2 },
  { label: "Done", dot: "bg-emerald-400", cards: 1 },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 font-bold text-lg">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-600 text-white text-sm">
        T
      </span>
      TeamBoard
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex flex-col justify-between bg-gray-800 text-white p-12">
        <Brand />

        <div className="space-y-8">
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            Plan the work. Move the cards. Ship together.
          </h2>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {PREVIEW.map((col) => (
              <div
                key={col.label}
                className="bg-white/10 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  {col.label}
                </div>
                {Array.from({ length: col.cards }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-white/15" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/60">
          Workspaces, roles and task boards for small teams.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="md:hidden">
            <Brand />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-500 mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
