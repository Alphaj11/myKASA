"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import type { PlanType, User } from "@/types";

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[] | null>(null);

  function load() {
    api.get<User[]>("/api/admin/users").then((res) => setUsers(res.data));
  }

  useEffect(load, []);

  async function toggleActive(user: User, checked: boolean) {
    try {
      await api.patch(`/api/admin/users/${user.id}/active`, { is_active: checked });
      toast.success(checked ? "Compte activé" : "Compte désactivé");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  async function changePlan(user: User, plan: PlanType) {
    try {
      await api.patch(`/api/admin/users/${user.id}/plan`, { plan });
      toast.success("Plan mis à jour");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">Gérez les comptes bailleurs et locataires de la plateforme.</p>
      </div>

      {users === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === "BAILLEUR" ? (
                      <Select
                        value={user.plan}
                        onValueChange={(v) => changePlan(user, v as PlanType)}
                        items={[
                          { value: "FREEMIUM", label: "Freemium" },
                          { value: "PREMIUM", label: "Premium" },
                          { value: "AGENCE", label: "Agence" },
                        ]}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREEMIUM">Freemium</SelectItem>
                          <SelectItem value="PREMIUM">Premium</SelectItem>
                          <SelectItem value="AGENCE">Agence</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => toggleActive(user, checked)}
                      disabled={user.role === "ADMIN"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
