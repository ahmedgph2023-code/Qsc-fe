import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  requireReason = true,
  destructive = false,
  pending = false,
  onConfirm,
  extraFields,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  requireReason?: boolean;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  extraFields?: ReactNode;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const disabled = pending || (requireReason && !reason.trim());
  const resolvedConfirm = confirmLabel ?? t("common.confirm");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) { onOpenChange(v); if (!v) setReason(""); } }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-1">
          {extraFields}
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase">
              {requireReason ? `${t("common.reason")} *` : t("common.reasonOptional")}
            </Label>
            <Input
              autoFocus
              placeholder={t("common.auditReasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onConfirm(reason.trim());
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={disabled}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {resolvedConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
