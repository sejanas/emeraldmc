import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SessionTimeoutDialog() {
  const { user, isBookingManager, signOut } = useAuth();
  const [showExpired, setShowExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: settingData } = useQuery({
    queryKey: ["settings", "session_config"],
    queryFn: () => api.get("/settings?key=session_config"),
    staleTime: 1000 * 60 * 10,
    enabled: !!user,
  });

  const config = settingData?.value ?? {
    timeout_minutes: 30,
    enabled: true,
    exceptions: { booking_manager: true },
  };
  const timeoutMs = (config.timeout_minutes ?? 30) * 60 * 1000;
  const isExempt =
    isBookingManager && config.exceptions?.booking_manager !== false;
  const isEnabled = config.enabled !== false && !!user && !isExempt;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isEnabled) return;
    timerRef.current = setTimeout(() => setShowExpired(true), timeoutMs);
  }, [isEnabled, timeoutMs]);

  useEffect(() => {
    if (!isEnabled) return;
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    const handler = () => resetTimer();
    events.forEach((e) =>
      window.addEventListener(e, handler, { passive: true })
    );
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isEnabled, resetTimer]);

  const handleConfirm = useCallback(async () => {
    setShowExpired(false);
    await signOut();
    window.location.href = "/admin/login";
  }, [signOut]);

  return (
    <AlertDialog open={showExpired}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session expired due to inactivity. Please login again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            Login Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
