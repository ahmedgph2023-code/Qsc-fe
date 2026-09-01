import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { UserCircle2 } from "lucide-react";
import { StatementInvestorHeaderCard } from "@/components/statements/StatementInvestorHeaderCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StatementDateControl, StatementInvestorHeader } from "@/lib/statement-types";

export function StatementInvestorDialog({
  investor,
  dates,
  trigger,
}: {
  investor: StatementInvestorHeader;
  dates?: StatementDateControl;
  trigger?: ReactNode;
}) {
  const { t } = useTranslation();
  const accountId = String(investor.accountId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            <UserCircle2 className="size-4" />
            {t("customerDetail.clientDetails")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="!inset-y-3 !start-auto !end-3 !h-[calc(100vh-1.5rem)] !max-h-none !min-h-0 !overflow-hidden !flex !flex-col !gap-0 !p-0 sm:!max-w-[min(640px,calc(100vw-1.5rem))]"
      >
        <DialogHeader className="shrink-0 border-b border-[#e1e7f0] px-5 py-4 dark:border-white/10">
          <DialogTitle>{t("customerDetail.clientDetails")}</DialogTitle>
          <DialogDescription>{t("statements.clientDetailsHint")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <StatementInvestorHeaderCard
            investor={investor}
            dates={dates}
            className="h-full min-h-full border-0 bg-transparent px-0 py-0 shadow-none"
          />
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-[#e1e7f0] px-5 py-4 sm:gap-0 dark:border-white/10">
          <Button asChild variant="outline">
            <Link href={`/customers/${encodeURIComponent(accountId)}`}>
              {t("statements.openClientProfile")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
