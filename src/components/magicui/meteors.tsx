import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteorStyles, setMeteorStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const styles = [...new Array(number || 20)].map(() => ({
      top: 0,
      left: Math.floor(Math.random() * 100) + "%",
      animationDelay: Math.random() * 0.6 + 0.2 + "s",
      animationDuration: Math.floor(Math.random() * 10 + 2) + "s",
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        <span
          key={idx}
          className={cn(
            "pointer-events-none absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-slate-400 shadow-[0_0_0_1px_ffffff10]",
            "before:absolute before:top-1/2 before:z-[-1] before:h-[1px] before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
            className,
          )}
          style={style}
        ></span>
      ))}
    </>
  );
};
