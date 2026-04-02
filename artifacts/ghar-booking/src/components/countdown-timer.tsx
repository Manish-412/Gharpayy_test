import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string | null;
  onExpire?: () => void;
  amount: number;
}

export function CountdownTimer({ expiresAt, onExpire, amount }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!expiresAt) return;

    const targetDate = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        onExpire?.();
      } else {
        setTimeLeft(difference);
        setIsExpired(false);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, onExpire]);

  if (!expiresAt) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center animate-in fade-in duration-500">
        <h3 className="text-xl font-bold text-red-700 mb-2">Offer Expired</h3>
        <p className="text-red-600/80">The 15-minute reservation window has closed.</p>
      </div>
    );
  }

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      <h3 className="text-lg font-medium text-primary mb-2 relative z-10">Offer reserved for you</h3>
      <p className="text-sm text-primary/80 mb-4 relative z-10">Complete your token payment of {formatCurrency(amount)} to lock in this room.</p>
      <div className="flex justify-center items-center gap-3 relative z-10">
        <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-primary/10 w-20">
          <span className="text-3xl font-bold text-primary block tabular-nums">{minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">Min</span>
        </div>
        <span className="text-2xl font-bold text-primary/50 mb-6">:</span>
        <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-primary/10 w-20">
          <span className="text-3xl font-bold text-primary block tabular-nums">{seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">Sec</span>
        </div>
      </div>
    </div>
  );
}
