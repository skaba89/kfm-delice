"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  UserPlus,
  Download,
  ShoppingCart,

  Globe,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "DRIVER" | "KITCHEN" | "CUSTOMER";
type UserStatus = "active" | "inactive" | "locked";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  restaurant: string;
  city: string;
  lastLogin: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  avatar?: string;
}

// ──────────────────────────────────────────────
// Sample Data — Guinean Context
// ──────────────────────────────────────────────

const initialUsers: User[] = [
  { id: "usr-001", firstName: "Mamadou", lastName: "Bah", email: "mamadou@jardin-conakry.com", phone: "+224 622 11 22 33", role: "ADMIN", status: "active", restaurant: "Le Jardin de Conakry", city: "Conakry", lastLogin: "2025-01-15 14:32", createdAt: "2024-01-15", totalOrders: 0, totalSpent: 0 },
  { id: "usr-002", firstName: "Fatoumata", lastName: "Diallo", email: "fatoumata@saveurs-fouta.com", phone: "+224 628 44 55 66", role: "ADMIN", status: "active", restaurant: "Saveurs du Fouta", city: "Conakry", lastLogin: "2025-01-15 13:55", createdAt: "2024-02-20", totalOrders: 0, totalSpent: 0 },
  { id: "usr-003", firstName: "Ibrahima", lastName: "Sow", email: "ibrahima@petit-bateau.com", phone: "+224 625 77 88 99", role: "MANAGER", status: "active", restaurant: "Restaurant Petit Bateau", city: "Conakry", lastLogin: "2025-01-15 12:40", createdAt: "2024-03-10", totalOrders: 0, totalSpent: 0 },
  { id: "usr-004", firstName: "Aminata", lastName: "Camara", email: "aminata.camara@gmail.com", phone: "+224 621 33 44 55", role: "ADMIN", status: "active", restaurant: "Chez Maman Aminata", city: "Conakry", lastLogin: "2025-01-15 14:10", createdAt: "2024-06-01", totalOrders: 0, totalSpent: 0 },
  { id: "usr-005", firstName: "Oumar", lastName: "Sylla", email: "omar@terrasse-kaloum.com", phone: "+224 626 55 66 77", role: "ADMIN", status: "active", restaurant: "La Terrasse de Kaloum", city: "Conakry", lastLogin: "2025-01-15 11:30", createdAt: "2024-04-05", totalOrders: 0, totalSpent: 0 },
  { id: "usr-006", firstName: "Aissatou", lastName: "Bangoura", email: "aissatou.b@gmail.com", phone: "+224 623 22 33 44", role: "DRIVER", status: "active", restaurant: "Le Jardin de Conakry", city: "Conakry", lastLogin: "2025-01-15 09:00", createdAt: "2024-03-20", totalOrders: 456, totalSpent: 0 },
  { id: "usr-007", firstName: "Sekou", lastName: "Toure", email: "sekou@le-mandingue.com", phone: "+224 624 88 99 00", role: "ADMIN", status: "locked", restaurant: "Le Mandingue", city: "Conakry", lastLogin: "2024-12-20 18:00", createdAt: "2024-01-28", totalOrders: 0, totalSpent: 0 },
  { id: "usr-008", firstName: "Mariama", lastName: "Conde", email: "mariam@belle-vue.com", phone: "+224 627 44 55 66", role: "MANAGER", status: "active", restaurant: "Restaurant Belle Vue", city: "Conakry", lastLogin: "2025-01-15 10:45", createdAt: "2024-05-22", totalOrders: 0, totalSpent: 0 },
  { id: "usr-009", firstName: "Karamoko", lastName: "Diallo", email: "karamoko.b@gmail.com", phone: "+224 624 11 22 33", role: "ADMIN", status: "active", restaurant: "Chez Karamoko", city: "Conakry", lastLogin: "2025-01-15 13:20", createdAt: "2024-08-15", totalOrders: 0, totalSpent: 0 },
  { id: "usr-010", firstName: "Awa", lastName: "Keita", email: "awa.keita@gmail.com", phone: "+224 629 66 77 88", role: "CUSTOMER", status: "active", restaurant: "", city: "Conakry", lastLogin: "2025-01-15 12:30", createdAt: "2024-07-10", totalOrders: 78, totalSpent: 1_250_000 },
  { id: "usr-011", firstName: "Abdoulaye", lastName: "Sow", email: "abdoulaye.s@gmail.com", phone: "+224 620 99 00 11", role: "CUSTOMER", status: "active", restaurant: "", city: "Conakry", lastLogin: "2025-01-14 19:45", createdAt: "2024-04-18", totalOrders: 124, totalSpent: 2_180_000 },
  { id: "usr-012", firstName: "Djenaba", lastName: "Balde", email: "djenaba.b@gmail.com", phone: "+224 621 55 66 77", role: "CUSTOMER", status: "active", restaurant: "", city: "Conakry", lastLogin: "2025-01-15 08:20", createdAt: "2024-05-05", totalOrders: 56, totalSpent: 890_000 },
  { id: "usr-013", firstName: "Moussa", lastName: "Cisse", email: "moussa.c@gmail.com", phone: "+224 622 77 88 99", role: "DRIVER", status: "active", restaurant: "Saveurs du Fouta", city: "Conakry", lastLogin: "2025-01-15 07:30", createdAt: "2024-02-25", totalOrders: 892, totalSpent: 0 },
  { id: "usr-014", firstName: "Fatou", lastName: "Sy", email: "fatou.sy@gmail.com", phone: "+224 628 11 22 33", role: "KITCHEN", status: "active", restaurant: "Le Jardin de Conakry", city: "Conakry", lastLogin: "2025-01-15 06:45", createdAt: "2024-01-20", totalOrders: 0, totalSpent: 0 },
  { id: "usr-015", firstName: "Lamine", lastName: "Guissé", email: "lamine.g@gmail.com", phone: "+224 626 33 44 55", role: "STAFF", status: "inactive", restaurant: "La Terrasse de Kaloum", city: "Conakry", lastLogin: "2024-11-30 15:00", createdAt: "2024-06-15", totalOrders: 0, totalSpent: 0 },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; className: string }> = {
    SUPER_ADMIN: { label: "Super Admin", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    ADMIN: { label: "Admin", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    MANAGER: { label: "Manager", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    STAFF: { label: "Personnel", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
    DRIVER: { label: "Livreur", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    KITCHEN: { label: "Cuisine", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    CUSTOMER: { label: "Client", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  };
  const c = config[role];
  return <Badge className={cn("border-0", c.className)}>{c.label}</Badge>;
}

function StatusIcon({ status }: { status: UserStatus }) {
  switch (status) {
    case "active":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "inactive":
      return <XCircle className="h-4 w-4 text-gray-400" />;
    case "locked":
      return <Ban className="h-4 w-4 text-red-500" />;
  }
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export function SaasUsersView() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "CUSTOMER" as UserRole, restaurant: "" });
  const [isEditing, setIsEditing] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchQuery === "" ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    locked: users.filter((u) => u.status === "locked").length,
    customers: users.filter((u) => u.role === "CUSTOMER").length,
    admins: users.filter((u) => ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(u.role)).length,
    drivers: users.filter((u) => u.role === "DRIVER").length,
  }), [users]);

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) return;
    if (isEditing && selectedUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, ...form } : u
        )
      );
    } else {
      const newUser: User = {
        id: `usr-${String(Date.now())}`,
        ...form,
        status: "active",
        city: "Conakry",
        lastLogin: "N/A",
        createdAt: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        totalSpent: 0,
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleToggleLock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "locked" ? "active" : "locked" }
          : u
      )
    );
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "bg-orange-500/10 text-orange-500" },
          { label: "Actifs", value: stats.active, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Bloques", value: stats.locked, icon: Ban, color: "bg-red-500/10 text-red-500" },
          { label: "Clients", value: stats.customers, icon: ShoppingCart, color: "bg-gray-500/10 text-gray-500" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "bg-blue-500/10 text-blue-500" },
          { label: "Livreurs", value: stats.drivers, icon: Globe, color: "bg-emerald-500/10 text-emerald-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-text-3">{s.label}</p>
                <p className="text-lg font-bold text-text leading-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="STAFF">Personnel</SelectItem>
              <SelectItem value="DRIVER">Livreur</SelectItem>
              <SelectItem value="KITCHEN">Cuisine</SelectItem>
              <SelectItem value="CUSTOMER">Client</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="locked">Bloque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Exporter</Button>
          <Button onClick={() => { setIsEditing(false); setForm({ firstName: "", lastName: "", email: "", phone: "", role: "CUSTOMER", restaurant: "" }); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600">
            <UserPlus className="mr-2 h-4 w-4" />Ajouter
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Restaurant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Derniere connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-text-3">Aucun utilisateur trouve</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                            {(user.firstName[0] + user.lastName[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-text-3 md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm text-text-2">{user.email}</p>
                          <p className="text-xs text-text-3">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-text-2 max-w-[180px] truncate">{user.restaurant || "-"}</TableCell>
                      <TableCell><StatusIcon status={user.status} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-text-3">{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailDialogOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" />Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsEditing(true); setSelectedUser(user); setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, restaurant: user.restaurant }); setDialogOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleLock(user.id)} className={user.status === "locked" ? "text-emerald-600" : "text-red-600"}>
                              {user.status === "locked" ? <><CheckCircle2 className="mr-2 h-4 w-4" />Debloquer</> : <><Ban className="mr-2 h-4 w-4" />Bloquer</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-text-3">
        <span>{filteredUsers.length} utilisateur(s) affiche(s) sur {users.length}</span>
      </div>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
            <DialogDescription>{isEditing ? "Modifiez les informations de l'utilisateur." : "Creez un nouveau compte utilisateur."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prenom *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Client</SelectItem>
                    <SelectItem value="STAFF">Personnel</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DRIVER">Livreur</SelectItem>
                    <SelectItem value="KITCHEN">Cuisine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Restaurant</Label>
                <Input value={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.value })} placeholder="Laisser vide pour un client" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">{isEditing ? "Enregistrer" : "Creer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-lg font-bold">
                    {(selectedUser.firstName[0] + selectedUser.lastName[0]).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle>{selectedUser.firstName} {selectedUser.lastName}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <RoleBadge role={selectedUser.role} />
                      <StatusIcon status={selectedUser.status} />
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-text-3">Email</span><span className="text-text">{selectedUser.email}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-text-3">Telephone</span><span className="text-text">{selectedUser.phone}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-text-3">Restaurant</span><span className="text-text">{selectedUser.restaurant || "Aucun"}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-text-3">Ville</span><span className="text-text">{selectedUser.city}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-text-3">Derniere connexion</span><span className="text-text">{selectedUser.lastLogin}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-text-3">Inscrit le</span><span className="text-text">{selectedUser.createdAt}</span></div>
                </div>
                {selectedUser.role === "CUSTOMER" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-kfm-border p-3 text-center">
                        <p className="text-xs text-text-3">Commandes</p>
                        <p className="text-lg font-bold text-text">{selectedUser.totalOrders}</p>
                      </div>
                      <div className="rounded-lg border border-kfm-border p-3 text-center">
                        <p className="text-xs text-text-3">Depenses</p>
                        <p className="text-sm font-bold text-text">{new Intl.NumberFormat("fr-GN").format(selectedUser.totalSpent)} FG</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
