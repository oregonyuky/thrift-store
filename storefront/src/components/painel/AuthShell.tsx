/** Card on the dark background used by the panel's sign-in screens. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-[400px] rounded-[20px] bg-card p-8">
        <div className="mb-6 flex flex-col gap-1">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[34px] italic">Thrift</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">admin</span>
          </span>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
