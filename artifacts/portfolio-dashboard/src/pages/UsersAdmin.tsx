import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, PenLine, UserCog } from "lucide-react";
import { Redirect } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState, FilterBar } from "@/components/phase1/PageHeader";
import { createUser, deleteUser, listUsers, updateUser, type StaffUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { SelectField } from "@/components/phase1/SelectField";
import { useAuth } from "@/lib/AuthContext";
import { canAccessPath } from "@/lib/access";

const ROLE_VALUES = ["admin", "pm", "approver", "compliance", "viewer"] as const;

const emptyForm = {
  username: "",
  displayName: "",
  role: "pm",
  status: "active",
  password: "",
};

export default function UsersAdmin() {
  const { t } = useTranslation();
  const { role, username, userId } = useAuth();
  const allowed = canAccessPath("/users", { role, username });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: allowed,
  });
  const paging = useClientTablePage(users, String(users.length));

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateUser(editing.id, {
          displayName: form.displayName || form.username,
          role: form.role,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        });
      }
      return createUser({
        username: form.username,
        password: form.password,
        displayName: form.displayName || form.username,
        role: form.role,
        status: form.status,
      });
    },
    onSuccess: () => {
      setOpen(false);
      setError("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!allowed) return <Redirect to="/" />;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(u: StaffUser) {
    setEditing(u);
    setForm({
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      password: "",
    });
    setError("");
    setOpen(true);
  }

  const roleOptions = ROLE_VALUES.map((value) => ({ value, label: value }));

  return (
    <Shell>
      <PageHeader
        title={t("usersAdmin.title")}
        description={t("usersAdmin.description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" /> {t("usersAdmin.addUser")}
          </Button>
        }
      />

      <FilterBar>
        <p className="text-sm text-muted-foreground">
          <UserCog className="me-2 inline h-4 w-4" />
          {t("usersAdmin.passwordHint")}
        </p>
        <p className="text-sm text-muted-foreground">{t("usersAdmin.rolesMap")}</p>
      </FilterBar>

      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : users.length === 0 ? (
        <EmptyState title={t("usersAdmin.emptyTitle")} description={t("usersAdmin.emptyDesc")} />
      ) : (
        <AppTable
          footer={
            <TablePageFooter
              total={paging.total}
              page={paging.page}
              pageSize={paging.pageSize}
              pageSizes={paging.pageSizes}
              loading={isLoading}
              onPageChange={paging.setPage}
              onPageSizeChange={paging.setPageSize}
            />
          }
        >
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.username")}</TableHead>
                <TableHead>{t("common.displayName")}</TableHead>
                <TableHead>{t("common.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paging.paged.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.username}</TableCell>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell className="font-mono">{u.role}</TableCell>
                  <TableCell className="capitalize">{u.status === "active" ? t("common.active") : t("common.disabled")}</TableCell>
                  <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)} title={t("common.edit")}>
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-400"
                      disabled={u.id === userId}
                      onClick={() => setDeleteId(u.id)}
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </AppTable>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? t("usersAdmin.editUser") : t("usersAdmin.createUser")}</DialogTitle>
            <DialogDescription>{t("usersAdmin.rolesMap")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            {!editing && (
              <div className="space-y-1">
                <Label>{t("common.username")}</Label>
                <Input
                  className="font-mono"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>{t("common.displayName")}</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("common.role")}</Label>
              <SelectField
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                options={roleOptions}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("common.status")}</Label>
              <SelectField
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={[
                  { value: "active", label: t("common.active") },
                  { value: "disabled", label: t("common.disabled") },
                ]}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{editing ? t("usersAdmin.newPasswordOptional") : t("common.password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm font-mono text-rose-500 sm:col-span-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button
              disabled={saveMut.isPending || (!editing && (!form.username || !form.password))}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("usersAdmin.deleteTitle")}
        description={t("usersAdmin.deleteDesc")}
        itemName={users.find((u) => u.id === deleteId)?.username || t("usersAdmin.userFallback")}
        onConfirm={() => { if (deleteId) deleteMut.mutate(deleteId); }}
        isPending={deleteMut.isPending}
      />
    </Shell>
  );
}
