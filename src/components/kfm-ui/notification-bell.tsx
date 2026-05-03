"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getAuthHeaders } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ============================================
// Relative time helper
// ============================================

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "À l'instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  return `Il y a ${Math.floor(seconds / 86400)} j`;
}

// ============================================
// Component
// ============================================

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `/api/notifications?userId=${user.id}&isRead=false`,
        { headers: getAuthHeaders() }
      );
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setNotifications((prev) => {
          // Merge: keep already fetched notifications, prepend unread ones
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = result.data.filter(
            (n: Notification) => !existingIds.has(n.id)
          );
          return [...newOnes, ...prev].slice(0, 10);
        });
        setUnreadCount(result.data.length);
      }
    } catch {
      // Silently fail for polling — don't spam toasts
    }
  }, [user]);

  // ── Fetch all recent notifications (for dropdown) ──
  const fetchAllNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`, {
        headers: getAuthHeaders(),
      });
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data.slice(0, 10));
        setUnreadCount(
          result.data.filter((n: Notification) => !n.isRead).length
        );
      }
    } catch {
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Mark a single notification as read ──
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ isRead: true }),
        });
        const result = await res.json();

        if (result.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        toast.error("Impossible de marquer comme lu");
      }
    },
    []
  );

  // ── Mark all as read ──
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch {
      toast.error("Impossible de tout marquer comme lu");
    }
  }, [user, notifications]);

  // ── Open dropdown: fetch all notifications ──
  const togglePanel = useCallback(() => {
    if (!open) {
      fetchAllNotifications();
    }
    setOpen((prev) => !prev);
  }, [open, fetchAllNotifications]);

  // ── Click outside to close ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Poll every 15s for unread count ──
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // ── Don't render if no user ──
  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={togglePanel}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-kfm-danger px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden border border-kfm-border bg-surface shadow-lg rounded-kfm-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-kfm-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-text-3" />
              <h3 className="text-sm font-semibold text-text">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-kfm-danger/10 px-2 py-0.5 text-[10px] font-semibold text-kfm-danger">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-kfm-sm px-2 py-1 text-[11px] font-medium text-kfm-secondary transition-colors hover:bg-kfm-secondary/10"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    Tout marquer comme lu
                  </span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-text-3 hover:bg-surface-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-kfm-border border-t-kfm-secondary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-text-3">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-xs font-medium">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-kfm-border p-3 text-left transition-colors last:border-0",
                    notification.isRead
                      ? "hover:bg-surface-2"
                      : "bg-kfm-secondary/5 hover:bg-kfm-secondary/10"
                  )}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {notification.isRead ? (
                      <Check className="h-3.5 w-3.5 text-text-3" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-kfm-secondary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium leading-tight",
                        notification.isRead ? "text-text-2" : "text-text"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-text-3 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-text-3">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
