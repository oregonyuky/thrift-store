"use client";

import { useEffect, useState } from "react";

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor((diff / 3600000) % 24),
    min: Math.floor((diff / 60000) % 60),
    done: diff === 0,
  };
}

export function Countdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [now, setNow] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    setNow(parts(target));
    const timer = window.setInterval(() => setNow(parts(target)), 30000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (now?.done) {
    return <p className="font-display text-3xl italic text-blush">O drop já está no ar!</p>;
  }

  const cells: Array<[string, number | undefined]> = [
    ["dias", now?.dias],
    ["horas", now?.horas],
    ["min", now?.min],
  ];

  return (
    <div className="flex gap-3" role="timer" aria-label="Contagem regressiva para o drop">
      {cells.map(([label, value]) => (
        <div key={label} className="flex w-[92px] flex-col items-center gap-1 rounded-2xl border border-[#5a4a47] py-5 md:w-[104px]">
          <span className="num font-display text-[44px] leading-none md:text-5xl">{value === undefined ? "--" : String(value).padStart(2, "0")}</span>
          <span className="text-xs uppercase tracking-[0.14em] text-[#d9ccc2]">{label}</span>
        </div>
      ))}
    </div>
  );
}
