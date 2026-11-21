// درخت مسیرها و Providerهای پیش‌نمایش مستقل A1
// مبنا: reference/A1-extracted-source-temp/src/App.jsx (مسیرها، گیت‌ها و پوسته‌ها یک‌به‌یک منتقل شده‌اند)
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from '@/lib/PageNotFound';
import { DemoAuthProvider } from '@/a1/lib/demoAuth';
import A1Guard from '@/a1/shell/A1Guard';
import A1Layout from '@/a1/shell/A1Layout';
import A1CustomerLayout from '@/a1/shell/A1CustomerLayout';
import A1Login from '@/a1/pages/A1Login';
import LoginOriginal from '@/a1/pages/LoginOriginal';
import RootEntry from '@/a1/components/RootEntry';
import A1Workspace from '@/a1/pages/A1Workspace';
import A1Cash from '@/a1/pages/Cash';
import Customers from '@/a1/pages/Customers';
import CustomerDetail from '@/a1/pages/CustomerDetail';
import Debtors from '@/a1/pages/Debtors';
import Transactions from '@/a1/pages/Transactions';
import Management from '@/a1/pages/Management';
import Builder from '@/a1/pages/Builder';
import MainSettings from '@/a1/pages/MainSettings';
import Notifications from '@/a1/pages/Notifications';
import Support from '@/a1/pages/Support';
import A1Backup from '@/a1/pages/Backup';
import OnlineProducts from '@/a1/pages/OnlineProducts';
import PaymentGateway from '@/a1/pages/PaymentGateway';
import AgencyNetwork from '@/a1/pages/AgencyNetwork';
import ChatGroups from '@/a1/pages/Chat';
import SarraafMarket from '@/a1/pages/SarraafMarket';
import A1Assistant from '@/a1/pages/Assistant';
import SellerPanel from '@/a1/pages/SellerPanel';
import Receipt from '@/a1/pages/Receipt';
import CustomerHomePage from '@/a1/pages/customer/CustomerHomePage';
import CustomerWallet from '@/a1/pages/customer/CustomerWallet';
import CustomerAccount from '@/a1/pages/customer/CustomerAccount';
import CustomerTransfer from '@/a1/pages/customer/CustomerTransfer';
import CustomerWithdraw from '@/a1/pages/customer/CustomerWithdraw';
import CustomerOrders from '@/a1/pages/customer/CustomerOrders';
import CustomerNotifications from '@/a1/pages/customer/CustomerNotifications';
import CustomerProfile from '@/a1/pages/customer/CustomerProfile';
import CustomerSupport from '@/a1/pages/customer/CustomerSupport';
import CustomerShop from '@/a1/pages/customer/CustomerShop';
import CustomerMessages from '@/a1/pages/customer/CustomerMessages';
import CustomerServices from '@/a1/pages/customer/CustomerServices';
import EnterpriseModuleScreen from '@/a1/pages/EnterpriseModuleScreen';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <DemoAuthProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* مسیرهای عمومی */}
                <Route path="/" element={<RootEntry />} />
                {/* صفحهٔ ورود اصلی؛ احراز هویت صراف از درگاه امن نسخهٔ ۲۲ انجام می‌شود */}
                <Route path="/login" element={<LoginOriginal />} />
                <Route path="/login-demo" element={<A1Login />} />
                {/* نسخهٔ ۲۱ ورود آزمایشی نقش‌محور دارد؛ بازیابی رمز و ثبت‌نام در آن وجود ندارد */}
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
                <Route path="/reset-password" element={<Navigate to="/login" replace />} />
                <Route path="/setup-database" element={<Navigate to="/login" replace />} />

                {/* پنل صراف — گیت نقش همانند ProtectedRoute سورس A1 */}
                <Route element={<A1Guard allowedRoles={['creator', 'admin', 'sarraaf', 'employee']} />}>
                  <Route element={<A1Layout />}>
                    <Route path="/v21" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<A1Workspace />} />
                    {/* مسیر مستقل جدید صرافان؛ میز کار نسخه ۲۱ با همان پوسته و گیت نقش */}
                    <Route path="/exchanger" element={<A1Workspace />} />
                    <Route path="/cash" element={<A1Cash />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/debtors" element={<Debtors />} />
                    <Route path="/transactions" element={<Transactions />} />
                    {/* مرکز مدیریت — فقط رئیس صراف و نقش‌های بالاتر */}
                    <Route element={<A1Guard allowedRoles={['creator', 'admin', 'sarraaf']} />}>
                      <Route path="/management" element={<Management />} />
                    </Route>
                    {/* صفحات عملیاتی نسخهٔ ۲۱ به ماژول واقعی خودشان در میز کار وصل هستند */}
                    <Route path="/dadogereft" element={<Navigate to="/dashboard?module=customerLedger" replace />} />
                    <Route path="/settings" element={<MainSettings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/backup" element={<A1Backup />} />
                    <Route path="/online-products" element={<OnlineProducts />} />
                    <Route path="/online-products/:kind" element={<OnlineProducts />} />
                    <Route path="/payment-gateway" element={<PaymentGateway />} />
                    <Route path="/agency-network" element={<AgencyNetwork />} />
                    <Route path="/agency" element={<Navigate to="/agency-network" replace />} />
                    <Route path="/chat" element={<ChatGroups />} />
                    <Route path="/chat/group/:id" element={<ChatGroups />} />
                    <Route path="/sarraaf-chat" element={<ChatGroups />} />
                    <Route path="/sarraaf-market" element={<SarraafMarket />} />
                    <Route path="/assistant" element={<A1Assistant />} />
                    <Route path="/reconciliation" element={<Navigate to="/dashboard?module=reports" replace />} />
                    <Route path="/trade" element={<Navigate to="/dashboard?module=exchange" replace />} />
                    <Route path="/convert" element={<Navigate to="/dashboard?module=exchange" replace />} />
                    <Route path="/transfers/:direction" element={<Navigate to="/dashboard?module=remittance" replace />} />
                    <Route path="/transfer-book" element={<Navigate to="/dashboard?module=remittance" replace />} />
                    <Route path="/bank" element={<Navigate to="/dashboard?module=banks" replace />} />
                    <Route path="/currencies" element={<Navigate to="/dashboard?module=currencies" replace />} />
                    <Route path="/reports" element={<Navigate to="/dashboard?module=reports" replace />} />
                    <Route path="/profit-loss" element={<Navigate to="/dashboard?module=profit" replace />} />
                    <Route path="/journal" element={<Navigate to="/dashboard?module=journal" replace />} />
                    <Route path="/journal-entry" element={<Navigate to="/dashboard?module=journal" replace />} />
                    <Route path="/general-ledger" element={<Navigate to="/dashboard?module=ledger" replace />} />
                    <Route path="/balance-sheet" element={<Navigate to="/dashboard?module=balance" replace />} />
                    <Route path="/agents" element={<Navigate to="/dashboard?module=branches" replace />} />
                    {/* بخش‌های سازمانی: صفحهٔ مرجع هر ماژول با وضعیت و وابستگی‌های واقعی */}
                    <Route path="/enterprise/:moduleKey" element={<EnterpriseModuleScreen />} />
                  </Route>
                </Route>

                {/* پنل سازنده */}
                <Route element={<A1Guard allowedRoles={['creator', 'admin']} />}>
                  <Route path="/builder" element={<Builder />} />
                  <Route path="/main-settings" element={<MainSettings />} />
                </Route>

                {/* پنل مشتری */}
                <Route element={<A1Guard requiredRole="customer" />}>
                  <Route element={<A1CustomerLayout />}>
                    <Route path="/customer" element={<CustomerHomePage />} />
                    <Route path="/customer/wallet" element={<CustomerWallet />} />
                    <Route path="/customer/account" element={<CustomerAccount />} />
                    <Route path="/customer/transfer" element={<CustomerTransfer />} />
                    <Route path="/customer/withdraw" element={<CustomerWithdraw />} />
                    <Route path="/customer/orders" element={<CustomerOrders />} />
                    <Route path="/customer/notifications" element={<CustomerNotifications />} />
                    <Route path="/customer/profile" element={<CustomerProfile />} />
                    <Route path="/customer/support" element={<CustomerSupport />} />
                    <Route path="/customer/shop" element={<CustomerShop />} />
                    <Route path="/customer/messages" element={<CustomerMessages />} />
                    <Route path="/customer/chat" element={<CustomerMessages />} />
                    <Route path="/customer/recharge" element={<CustomerServices kind="recharge" />} />
                    <Route path="/customer/afghan5" element={<CustomerServices kind="afghan5" />} />
                    <Route path="/customer/games" element={<CustomerServices kind="games" />} />
                  </Route>
                </Route>

                {/* پنل فروشنده و رسید */}
                <Route element={<A1Guard />}>
                  <Route path="/seller" element={<SellerPanel />} />
                  <Route path="/receipt" element={<Receipt />} />
                </Route>

                <Route path="*" element={<PageNotFound />} />
              </Routes>
              <Toaster />
            </Router>
          </DemoAuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;