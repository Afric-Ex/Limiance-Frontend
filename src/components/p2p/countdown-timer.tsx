"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";

interface CountdownTimerProps {
  targetDate: string | Date;
  onExpire?: () => void;
  className?: string;
}

export const CountdownTimer = ({ targetDate, onExpire, className }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(0);
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
      } else {
        setTimeLeft(difference);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire, isExpired]);

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Color logic based on prompt
  let colorClass = "text-white";
  if (minutes < 2) {
    colorClass = "text-[#F6465D]"; // Red at 2 minutes
  } else if (minutes < 5) {
    colorClass = "text-yellow-500"; // Yellow at 5 minutes
  }

  return (
    <div className={clsx("font-mono font-bold tracking-wider", colorClass, className)}>
      {formattedTime}
    </div>
  );
};
