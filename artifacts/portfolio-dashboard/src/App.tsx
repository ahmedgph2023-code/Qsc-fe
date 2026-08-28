import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { UiPrefsProvider } from "@/lib/UiPrefsContext";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "@/i18n";
import { RoleGate } from "@/components/auth/RoleGate";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import CustomersExt from "@/pages/CustomersExt";
import CustomerDetailExt from "@/pages/CustomerDetailExt";
import Statements from "@/pages/Statements";
import Balances from "@/pages/Balances";
import LiveMarket from "@/pages/LiveMarket";
import ProductDecisions from "@/pages/ProductDecisions";
import UatGate from "@/pages/UatGate";
import Stocks from "@/pages/Stocks";
import StockDetail from "@/pages/StockDetail";
import Sectors from "@/pages/Sectors";
import SectorDetail from "@/pages/SectorDetail";
import Indices from "@/pages/Indices";
import IndexDetail from "@/pages/IndexDetail";
import Builder from "@/pages/Builder";
import Rebalances from "@/pages/Rebalances";
import RebalanceDetail from "@/pages/RebalanceDetail";
import Compliance from "@/pages/Compliance";
import Risk from "@/pages/Risk";
import Audit from "@/pages/Audit";
import Fees from "@/pages/Fees";
import FixedIncome from "@/pages/FixedIncome";
import FixedIncomeLot from "@/pages/FixedIncomeLot";
import HistoricalImport from "@/pages/HistoricalImport";
import TradeSimulator, { OrdersPage } from "@/pages/TradeSimulator";
import ReportsPage, { ReconciliationPage, OpsFormsPage } from "@/pages/Phase2Ops";
import MarketsOverviewPage, {
  ScreenerPage, ApprovedListPage, CompanyAnalysisPage,
  ShariaEsgPage, StrategiesPage, ScoringPage,
} from "@/pages/Phase3Research";
import AiAssistantPage, {
  CommentaryPage, ScenariosPage, FrontierPage,
} from "@/pages/Phase4Advanced";
import SystemConfig from "@/pages/SystemConfig";
import UsersAdmin from "@/pages/UsersAdmin";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  path,
}: {
  component: React.ComponentType;
  path: string;
}) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return (
    <RoleGate path={path}>
      <Component />
    </RoleGate>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute path="/" component={Dashboard} />} />
      <Route path="/customers-old/:id" component={() => <ProtectedRoute path="/customers-old" component={CustomerDetail} />} />
      <Route path="/customers-old" component={() => <ProtectedRoute path="/customers-old" component={Customers} />} />
      <Route path="/customers/:id" component={() => <ProtectedRoute path="/customers" component={CustomerDetailExt} />} />
      <Route path="/customers" component={() => <ProtectedRoute path="/customers" component={CustomersExt} />} />
      <Route path="/customers-2/:id">{(params) => <Redirect to={`/customers/${params.id}`} />}</Route>
      <Route path="/customers-2">{() => <Redirect to="/customers" />}</Route>
      <Route path="/stocks" component={() => <ProtectedRoute path="/stocks" component={Stocks} />} />
      <Route path="/stocks/:id" component={() => <ProtectedRoute path="/stocks" component={StockDetail} />} />
      <Route path="/fixed-income" component={() => <ProtectedRoute path="/fixed-income" component={FixedIncome} />} />
      <Route path="/fixed-income/lots/:portfolioId/:lotId" component={() => <ProtectedRoute path="/fixed-income" component={FixedIncomeLot} />} />
      <Route path="/sectors" component={() => <ProtectedRoute path="/sectors" component={Sectors} />} />
      <Route path="/sectors/:id" component={() => <ProtectedRoute path="/sectors" component={SectorDetail} />} />
      <Route path="/indices" component={() => <ProtectedRoute path="/indices" component={Indices} />} />
      <Route path="/indices/:id" component={() => <ProtectedRoute path="/indices" component={IndexDetail} />} />
      <Route path="/portfolios" component={() => <Redirect to="/customers" />} />
      <Route path="/builder" component={() => <ProtectedRoute path="/builder" component={Builder} />} />
      <Route path="/data-import" component={() => <ProtectedRoute path="/data-import" component={HistoricalImport} />} />
      <Route path="/rebalances" component={() => <ProtectedRoute path="/rebalances" component={Rebalances} />} />
      <Route path="/rebalances/:id" component={() => <ProtectedRoute path="/rebalances" component={RebalanceDetail} />} />
      <Route path="/compliance" component={() => <ProtectedRoute path="/compliance" component={Compliance} />} />
      <Route path="/risk" component={() => <ProtectedRoute path="/risk" component={Risk} />} />
      <Route path="/audit" component={() => <ProtectedRoute path="/audit" component={Audit} />} />
      <Route path="/fees" component={() => <ProtectedRoute path="/fees" component={Fees} />} />
      <Route path="/simulator" component={() => <ProtectedRoute path="/simulator" component={TradeSimulator} />} />
      <Route path="/orders" component={() => <ProtectedRoute path="/orders" component={OrdersPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute path="/reports" component={ReportsPage} />} />
      <Route path="/statements" component={() => <ProtectedRoute path="/statements" component={Statements} />} />
      <Route path="/balances" component={() => <ProtectedRoute path="/balances" component={Balances} />} />
      <Route path="/live" component={() => <ProtectedRoute path="/live" component={LiveMarket} />} />
      <Route path="/workshop" component={() => <ProtectedRoute path="/workshop" component={ProductDecisions} />} />
      <Route path="/uat" component={() => <ProtectedRoute path="/uat" component={UatGate} />} />
      <Route path="/reconciliation" component={() => <ProtectedRoute path="/reconciliation" component={ReconciliationPage} />} />
      <Route path="/ops-forms" component={() => <ProtectedRoute path="/ops-forms" component={OpsFormsPage} />} />
      <Route path="/markets" component={() => <ProtectedRoute path="/markets" component={MarketsOverviewPage} />} />
      <Route path="/screener" component={() => <ProtectedRoute path="/screener" component={ScreenerPage} />} />
      <Route path="/research/approved-list" component={() => <ProtectedRoute path="/research/approved-list" component={ApprovedListPage} />} />
      <Route path="/research/companies/:stockId" component={() => <ProtectedRoute path="/research/companies" component={CompanyAnalysisPage} />} />
      <Route path="/research/sharia-esg" component={() => <ProtectedRoute path="/research/sharia-esg" component={ShariaEsgPage} />} />
      <Route path="/research/strategies" component={() => <ProtectedRoute path="/research/strategies" component={StrategiesPage} />} />
      <Route path="/research/scoring" component={() => <ProtectedRoute path="/research/scoring" component={ScoringPage} />} />
      <Route path="/ai" component={() => <ProtectedRoute path="/ai" component={AiAssistantPage} />} />
      <Route path="/commentary" component={() => <ProtectedRoute path="/commentary" component={CommentaryPage} />} />
      <Route path="/scenarios" component={() => <ProtectedRoute path="/scenarios" component={ScenariosPage} />} />
      <Route path="/frontier" component={() => <ProtectedRoute path="/frontier" component={FrontierPage} />} />
      <Route path="/system-config" component={() => <ProtectedRoute path="/system-config" component={SystemConfig} />} />
      <Route path="/users" component={() => <ProtectedRoute path="/users" component={UsersAdmin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LocaleProvider>
            <AuthProvider>
              <UiPrefsProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </UiPrefsProvider>
            </AuthProvider>
          </LocaleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
