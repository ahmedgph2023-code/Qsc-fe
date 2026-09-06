import { useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  t: {
    importPhones: string;
    importDownloadTemplate: string;
    importDownloadHint: string;
    importUploadExcel: string;
    importUploadHint: string;
  };
  busy?: boolean;
  align?: "start" | "center" | "end";
  onDownload: () => void | Promise<void>;
  onFile: (file: File) => void | Promise<void>;
};

export function ImportPhonesPopover({
  children,
  t,
  busy = false,
  align = "end",
  onDownload,
  onFile,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} className="w-[280px] p-2">
        <p className="px-2 pb-1 pt-1.5 text-[12px] font-bold text-[var(--shell-ink)]">{t.importPhones}</p>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start rounded-[12px] px-2 py-2 text-start"
          disabled={busy}
          onClick={() => {
            void onDownload();
            setOpen(false);
          }}
        >
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span>{t.importDownloadTemplate}</span>
            <span className="text-[11px] font-medium text-[var(--shell-muted)]">{t.importDownloadHint}</span>
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start rounded-[12px] px-2 py-2 text-start"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span>{t.importUploadExcel}</span>
            <span className="text-[11px] font-medium text-[var(--shell-muted)]">{t.importUploadHint}</span>
          </span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setOpen(false);
            void onFile(file);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
