"use client";

export function SidebarMenu({
  title,
  children,
  collapsed,
}: {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return <div className="flex flex-col gap-1">{children}</div>;
  }
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-3">
        <span className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
          {title}
        </p>
        <span className="h-px w-4 bg-white/20" />
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
