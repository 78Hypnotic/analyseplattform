type LoadingVariant = "dashboard" | "list" | "report" | "form" | "community" | "library" | "planner";

export function PageLoadingSkeleton({ variant = "dashboard" }: { variant?: LoadingVariant }) {
  return (
    <main
      aria-busy="true"
      aria-label="Seite wird geladen"
      data-loading-variant={variant}
      className="mx-auto w-full max-w-6xl flex-1 px-5 py-10"
    >
      <div className="route-loading-progress fixed inset-x-0 top-0 z-[200] h-0.5 bg-[var(--accent)]" />
      <SkeletonHeader />
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "list" ? <ListSkeleton /> : null}
      {variant === "report" ? <ReportSkeleton /> : null}
      {variant === "form" ? <FormSkeleton /> : null}
      {variant === "community" ? <CommunitySkeleton /> : null}
      {variant === "library" ? <LibrarySkeleton /> : null}
      {variant === "planner" ? <PlannerSkeleton /> : null}
    </main>
  );
}

function SkeletonHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="w-full max-w-xl">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-4/5" />
        <Skeleton className="mt-3 h-4 w-full" subtle />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
      <SkeletonPanel className="h-36 md:col-span-6 xl:col-span-12" />
      <SkeletonPanel className="h-64 md:col-span-4 xl:col-span-7" />
      <SkeletonPanel className="h-64 md:col-span-2 xl:col-span-5" />
      <SkeletonPanel className="h-48 md:col-span-3 xl:col-span-4" />
      <SkeletonPanel className="h-48 md:col-span-3 xl:col-span-4" />
      <SkeletonPanel className="h-48 md:col-span-6 xl:col-span-4" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-8 grid gap-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 md:grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] md:items-center">
          <div><Skeleton className="h-5 w-48" /><Skeleton className="mt-2 h-3 w-64" subtle /></div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      ))}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <SkeletonPanel key={item} className="h-28" />)}
      </div>
      <SkeletonPanel className="h-80" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonPanel className="h-64" />
        <SkeletonPanel className="h-64" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 md:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item}><Skeleton className="h-3 w-24" subtle /><Skeleton className="mt-2 h-11 w-full" /></div>
        ))}
      </div>
      <SkeletonPanel className="h-72" />
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <SkeletonPanel key={item} className="h-52">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="mt-8 h-3 w-28" subtle />
          <Skeleton className="mt-3 h-7 w-40" />
          <Skeleton className="mt-4 h-3 w-full" subtle />
        </SkeletonPanel>
      ))}
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <SkeletonPanel key={item} className="h-64">
          <Skeleton className="h-3 w-28" subtle />
          <Skeleton className="mt-5 h-7 w-3/4" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-6 h-3 w-full" subtle />
          <Skeleton className="mt-2 h-3 w-4/5" subtle />
        </SkeletonPanel>
      ))}
    </div>
  );
}

function PlannerSkeleton() {
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
        <Skeleton className="h-20 w-full md:col-span-2 xl:col-span-3" />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
      </div>
      <SkeletonPanel className="h-72" />
    </div>
  );
}

function SkeletonPanel({ className, children }: { className: string; children?: React.ReactNode }) {
  return <div className={`rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 ${className}`}>{children}</div>;
}

function Skeleton({ className, subtle = false }: { className: string; subtle?: boolean }) {
  return <div className={`route-loading-pulse rounded ${subtle ? "bg-[var(--raised-bg)]" : "bg-[var(--panel-2)]"} ${className}`} />;
}