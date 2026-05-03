"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Users, Armchair, RotateCcw, Trash2, X,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────

type TableStatus = "available" | "occupied" | "reserved";

interface TableItem {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  seats: number;
}

const STATUS_CONFIG: Record<TableStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  available: { label: "Disponible", bgColor: "bg-kfm-success", textColor: "text-kfm-success", borderColor: "border-kfm-success/40" },
  occupied: { label: "Occupee", bgColor: "bg-kfm-danger", textColor: "text-kfm-danger", borderColor: "border-kfm-danger/40" },
  reserved: { label: "Reservee", bgColor: "bg-kfm-warning", textColor: "text-kfm-warning", borderColor: "border-kfm-warning/40" },
};

const STORAGE_KEY = "kfm_floor_plan";

const DEFAULT_CAPACITIES = [2, 4, 4, 6, 2, 4, 4, 8, 2, 4, 6, 8];

const DEFAULT_TABLES: TableItem[] = DEFAULT_CAPACITIES.map((cap, i) => ({
  id: `table-${i + 1}`,
  number: i + 1,
  capacity: cap,
  status: "available",
  seats: cap,
}));

// ── Component ──────────────────────────────────────────────────────────────

export function AdminFloorPlanView() {
  const [tables, setTables] = useState<TableItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_TABLES;
    } catch { return DEFAULT_TABLES; }
  });
  const [addOpen, setAddOpen] = useState(false);
  const [newCapacity, setNewCapacity] = useState(4);
  const [deleteTarget, setDeleteTarget] = useState<TableItem | null>(null);

  const saveTables = (updated: TableItem[]) => {
    setTables(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const cycleStatus = (id: string) => {
    const order: TableStatus[] = ["available", "occupied", "reserved"];
    saveTables(tables.map((t) => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % 3] };
    }));
  };

  const removeTable = () => {
    if (!deleteTarget) return;
    saveTables(tables.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const addTable = () => {
    const maxNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0;
    const newTable: TableItem = {
      id: `table-${Date.now()}`,
      number: maxNum + 1,
      capacity: newCapacity,
      status: "available",
      seats: newCapacity,
    };
    saveTables([...tables, newTable]);
    setAddOpen(false);
    setNewCapacity(4);
  };

  const resetPlan = () => {
    saveTables(DEFAULT_TABLES);
  };

  const stats = useMemo(() => {
    const available = tables.filter((t) => t.status === "available").length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
    return { total: tables.length, available, occupied, reserved, totalSeats };
  }, [tables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Plan de salle</h2>
          <p className="mt-1 text-sm text-text-2">Disposition et gestion des tables du restaurant</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetPlan} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            <RotateCcw className="h-4 w-4" /> Reinitialiser
          </button>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Ajouter une table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tables" value={formatNumber(stats.total)} icon={Armchair} />
        <StatCard label="Disponibles" value={formatNumber(stats.available)} icon={Armchair} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Occupees" value={formatNumber(stats.occupied)} icon={Users} className="border-l-4 border-l-kfm-danger" />
        <StatCard label="Reservees" value={formatNumber(stats.reserved)} icon={Users} className="border-l-4 border-l-kfm-warning" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 rounded-kfm-md border border-kfm-border bg-surface p-4">
        <span className="text-xs font-semibold text-text-3 uppercase">Legende :</span>
        {(Object.entries(STATUS_CONFIG) as [TableStatus, typeof STATUS_CONFIG.available][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", cfg.bgColor)} />
            <span className="text-xs font-medium text-text-2">{cfg.label}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-text-3">
          <span>{formatNumber(stats.totalSeats)}</span>{" "}places au total
        </div>
      </div>

      {/* Floor plan grid */}
      {tables.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="Aucune table"
          description="Ajoutez des tables pour commencer la gestion de salle."
          action={
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          }
        />
      ) : (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table) => {
              const cfg = STATUS_CONFIG[table.status];
              return (
                <div key={table.id} className="group relative">
                  <button
                    onClick={() => cycleStatus(table.id)}
                    className={cn(
                      "w-full rounded-kfm-md border-2 p-4 text-center transition-all hover:shadow-md hover:ring-2",
                      cfg.borderColor,
                      table.status === "available" ? "bg-kfm-success/5 hover:bg-kfm-success/10"
                        : table.status === "occupied" ? "bg-kfm-danger/5 hover:bg-kfm-danger/10"
                        : "bg-kfm-warning/5 hover:bg-kfm-warning/10",
                      "ring-offset-2 ring-offset-surface"
                    )}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold", cfg.bgColor)}>
                        {table.number}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-text">Table {table.number}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Users className="h-3 w-3 text-text-3" />
                      <span className="text-xs text-text-3">{table.capacity} places</span>
                    </div>
                    <p className={cn("text-[10px] font-semibold mt-2 uppercase tracking-wide", cfg.textColor)}>
                      {cfg.label}
                    </p>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(table)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-kfm-danger text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Table Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter une table</DialogTitle>
            <DialogDescription className="text-text-2">Choisissez la capacite de la nouvelle table</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-text-3 mb-2 block">Capacite</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 6, 8, 10, 12].map((cap) => (
                  <button
                    key={cap}
                    onClick={() => setNewCapacity(cap)}
                    className={cn(
                      "rounded-kfm-md border-2 p-3 text-center transition-all",
                      newCapacity === cap
                        ? "border-kfm-secondary bg-kfm-secondary/10 text-kfm-secondary"
                        : "border-kfm-border bg-bg text-text-2 hover:border-kfm-secondary/30"
                    )}
                  >
                    <span className="text-lg font-bold">{cap}</span>
                    <p className="text-[10px] text-text-3 mt-0.5">places</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={addTable} className="rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Ajouter</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer la table {deleteTarget?.number} ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. La table {deleteTarget?.number} ({deleteTarget?.capacity} places) sera definitivement supprimee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={removeTable} className="rounded-kfm-sm bg-kfm-danger text-white hover:opacity-90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
