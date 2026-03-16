import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserCog, ShieldCheck, Shield, Edit2 } from "lucide-react";
import { staffApi } from "../api/index";
import { Button, Card, Dialog, Input, Select, EmptyState, Spinner, Badge } from "../components/ui/index";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate } from "../lib/utils";
import { useAuthStore } from "../store/auth";

const inviteSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["staff", "accountant"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff — create invoices & POS, no settings" },
  { value: "accountant", label: "Accountant — record payments, read-only" },
];

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: ShieldCheck,
  staff: Shield,
  accountant: Shield,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "default",
  staff: "success",
  accountant: "warning",
};

const PERMISSION_SUMMARY: Record<string, string[]> = {
  owner: ["Full access", "Manage staff", "Business settings", "Delete anything", "Create & manage subscriptions"],
  staff: ["Create invoices", "Manage customers & items", "POS checkout", "No delete", "No settings"],
  accountant: ["Record payments", "View all data", "No create/delete", "No settings", "No POS"],
};

export default function StaffPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("staff");

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffApi.list().then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "staff" },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => staffApi.invite(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setOpen(false); reset(); },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => staffApi.updateRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setEditingId(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="text-sm text-muted-foreground">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["owner", "staff", "accountant"].map(role => {
          const Icon = ROLE_ICONS[role];
          return (
            <Card key={role} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold capitalize text-sm">{role}</span>
                <Badge variant={ROLE_COLORS[role] as any}>{role}</Badge>
              </div>
              <ul className="space-y-1">
                {PERMISSION_SUMMARY[role].map(p => (
                  <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-12 w-12" />}
          title="No staff yet"
          description="Invite your team members. Assign roles to control what they can access."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Staff</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((member: any) => {
                const isMe = member.id === currentUser?.id;
                return (
                  <tr key={member.id} className="hover:bg-muted/20 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.name} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="staff">Staff</option>
                            <option value="accountant">Accountant</option>
                          </select>
                          <Button size="sm" onClick={() => updateRoleMutation.mutate({ id: member.id, role: editRole })}
                            loading={updateRoleMutation.isPending}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Badge variant={ROLE_COLORS[member.role] as any} className="capitalize">
                          {member.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(member.createdAt)}</td>
                    <td className="px-4 py-3">
                      {!isMe && member.role !== "owner" && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(member.id); setEditRole(member.role); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove ${member.name}?`)) removeMutation.mutate(member.id); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="Invite Team Member">
        <form onSubmit={handleSubmit(d => inviteMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" {...register("name")} error={errors.name?.message} />
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Temporary Password" type="password" {...register("password")} error={errors.password?.message} hint="They can change this after logging in" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              {...register("role")}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {inviteMutation.error && (
            <p className="text-xs text-destructive">
              {(inviteMutation.error as any)?.response?.data?.message || "Failed to invite user"}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={inviteMutation.isPending}>Send Invite</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
