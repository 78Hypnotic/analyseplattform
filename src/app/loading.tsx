export default function Loading() {
  return (
    <>
      <div className="route-loading-progress fixed inset-x-0 top-0 z-[200] h-0.5 bg-[var(--accent)]" />
      <main aria-busy="true" aria-label="Seite wird geladen" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="route-loading-pulse h-3 w-28 rounded bg-[var(--raised-bg)]" />
        <div className="route-loading-pulse mt-4 h-10 w-[min(24rem,80%)] rounded bg-[var(--panel-2)]" />
        <div className="route-loading-pulse mt-3 h-4 w-[min(34rem,92%)] rounded bg-[var(--raised-bg)]" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="route-loading-pulse h-4 w-24 rounded bg-[var(--panel-2)]" />
              <div className="route-loading-pulse mt-5 h-6 w-3/4 rounded bg-[var(--panel-2)]" />
              <div className="route-loading-pulse mt-4 h-3 w-full rounded bg-[var(--raised-bg)]" />
              <div className="route-loading-pulse mt-2 h-3 w-2/3 rounded bg-[var(--raised-bg)]" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}