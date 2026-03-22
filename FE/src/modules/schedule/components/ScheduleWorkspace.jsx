import React from "react";
import { ChevronRight } from "lucide-react";

export function SchedulePageShell({
  breadcrumb = [],
  title,
  description,
  actions,
  stats,
  minimal = false,
  children,
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f6f3]">
      <div className="mx-auto max-w-[1560px] px-5 py-5">
        <div className="rounded-[30px] border border-slate-200 bg-[#fcfbf8] shadow-sm">
          {!minimal ? (
            <div className="border-b border-slate-200 px-7 py-5">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {breadcrumb.map((item, index) => (
                      <React.Fragment key={`${item}-${index}`}>
                        {index > 0 && <ChevronRight size={14} />}
                        <span className={index === breadcrumb.length - 1 ? "font-medium text-slate-700" : ""}>
                          {item}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>

                  <h1 className="mt-4 text-[42px] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
                </div>

                {actions ? (
                  <div className="flex w-full max-w-[760px] flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                    {actions}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-5 px-7 py-6">
            {minimal && actions ? (
              <div className="flex flex-wrap items-center gap-3">
                {actions}
              </div>
            ) : null}

            {!minimal && stats?.length ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <ScheduleStatCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    helper={item.helper}
                  />
                ))}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScheduleStatCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-[38px] font-semibold leading-none tracking-[-0.05em] text-slate-950">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export function SchedulePanel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ScheduleInlineBadge({ children, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    cool: "border-blue-200 bg-blue-50 text-blue-700",
    warm: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

export function ScheduleEmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
