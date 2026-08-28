import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName: string;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({ open, onOpenChange, title, description, itemName, onConfirm, isPending }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <DialogTitle>{title || "Confirm Deletion"}</DialogTitle>
          </div>
          <DialogDescription>
            {description || `Are you sure you want to delete`} <strong>{itemName}</strong>? This action cannot be undone and all related data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm()} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
