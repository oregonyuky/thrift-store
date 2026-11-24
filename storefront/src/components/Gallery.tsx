"use client";

import { useState } from "react";

export function Gallery({ pictures, name, badge }: { pictures: string[]; name: string; badge?: string }) {
  const [current, setCurrent] = useState(0);
  const main = pictures[current];

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {pictures.length > 1 && (
        <div className="flex gap-3 sm:flex-col">
          {pictures.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Ver foto ${i + 1} de ${pictures.length}`}
              aria-pressed={current === i}
              onClick={() => setCurrent(i)}
              className={`h-[88px] w-[72px] overflow-hidden rounded-[10px] border-2 sm:h-[104px] sm:w-[84px] ${current === i ? "border-ink" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-[18px] bg-[#e6d3c6]">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl italic text-[#8a6e64]">{name}</div>
        )}
        {badge && <span className="absolute left-4 top-4 rounded-full bg-terra px-3 py-1.5 text-[13px] font-bold text-card">{badge}</span>}
      </div>
    </div>
  );
}
