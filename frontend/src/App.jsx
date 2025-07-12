import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SubscriptionProvider } from './hooks/useSubscription';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Loading from './components/common/Loading';

// Page Components
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Features from './pages/Features';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';

// Project Components
import ProjectDetails from './components/projects/ProjectDetails';
import CreateProject from './components/projects/CreateProject';
import EditProject from './components/projects/EditProject';
import ProjectList from './components/dashboard/ProjectList';

// Quote Components
import QuoteGenerator from './components/quotes/QuoteGenerator';
import QuoteHistory from './components/quotes/QuoteHistory';
import QuotePreview from './components/quotes/QuotePreview';
import QuoteSettings from './components/quotes/QuoteSettings';

// Settings Components
import Settings from './pages/Settings';
import CompanySettings from './components/settings/CompanySettings';
import UserProfile from './components/settings/UserProfile';
import PaintBrandSettings from './components/settings/PaintBrandSettings';

// Subscription Components
import Subscription from './pages/Subscription';
import PricingPlans from './components/subscription/PricingPlans';
import SubscriptionStatus from './components/subscription/SubscriptionStatus';
import BillingInfo from './components/subscription/BillingInfo';

// Payment and Subscription Status Pages
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import PaymentFailed from './pages/PaymentFailed';
import SubscriptionExpired from './pages/SubscriptionExpired';
import TrialExpired from './pages/TrialExpired';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import CompanyManagement from './components/admin/CompanyManagement';
import SubscriptionOverview from './components/admin/SubscriptionOverview';
import ProjectsOverview from './components/admin/ProjectsOverview';
import QuotesOverview from './components/admin/QuotesOverview';
import Analytics from './components/admin/Analytics';
import Billing from './components/admin/Billing';
import Support from './components/admin/Support';
import Reports from './components/admin/Reports';
import ActivityLogs from './components/admin/ActivityLogs';
import SystemSettings from './components/admin/SystemSettings';
import AdminProfile from './components/admin/AdminProfile';

// Error Pages
import NotFound from './pages/NotFound';

// Styles
import './App.css';
import './styles/globals.css';
// import ProjectCreationPage from './components/projects/ProjectCreationPage';
// import CreateProjectUnified from './components/projects/CreateProjectUnified';
import PricingSettings from './components/settings/PricingSettings';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <div className="App min-h-screen bg-yellow-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Home />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/pricing" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Pricing />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/features" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Features />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/about" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <About />
                  </main>
                  <Footer />
                </>
              } />

              <Route path="/contact" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Contact />
                  </main>
                  <Footer />
                </>
              } />

              {/* Auth Routes */}
              <Route path="/login" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Login />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/register" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Register />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancelled" element={<PaymentCancelled />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />

              {/* Subscription Status Routes - Protected but accessible when expired */}
              <Route path="/subscription/expired" element={
                <ProtectedRoute allowExpired={true}>
                  <SubscriptionExpired />
                </ProtectedRoute>
              } />
              <Route path="/trial/expired" element={
                <ProtectedRoute allowExpired={true}>
                  <TrialExpired />
                </ProtectedRoute>
              } />

              {/* Admin Routes - All admin routes go through AdminLayout */}
              <Route path="/admin/*" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="companies" element={<CompanyManagement />} />
                      <Route path="subscriptions" element={<SubscriptionOverview />} />
                      <Route path="projects" element={<ProjectsOverview />} />
                      <Route path="quotes" element={<QuotesOverview />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="support" element={<Support />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="logs" element={<ActivityLogs />} />
                      <Route path="settings" element={<SystemSettings />} />
                      <Route path="profile" element={<AdminProfile />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/*" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      {/* Protected Routes - Dashboard */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />

                      {/* Protected Routes - Projects */}
                      <Route path="/projects" element={
                        <ProtectedRoute>
                          <ProjectList />
                        </ProtectedRoute>
                      } />

                      <Route path="/projects/new" element={
                        <ProtectedRoute>
                          {/* <CreateProjectUnified /> */}
                          <CreateProject />
                          {/* <ProjectCreationPage/> */}
                        </ProtectedRoute>
                      } />

                      <Route path="/projects/:id" element={
                        <ProtectedRoute>
                          <ProjectDetails />
                        </ProtectedRoute>
                      } />

                      <Route path="/projects/:id/edit" element={
                        <ProtectedRoute>
                          <EditProject />
                        </ProtectedRoute>
                      } />

                      {/* Protected Routes - Quotes */}
                      <Route path="/projects/:id/quote" element={
                        <ProtectedRoute>
                          <QuoteGenerator />
                        </ProtectedRoute>
                      } />

                      <Route path="/quotes/:id" element={
                        <ProtectedRoute>
                          <QuotePreview />
                        </ProtectedRoute>
                      } />

                      <Route path="/quotes" element={
                        <ProtectedRoute>
                          <QuoteHistory />
                        </ProtectedRoute>
                      } />

                      <Route path="/quotes/settings" element={
                        <ProtectedRoute>
                          <QuoteSettings />
                        </ProtectedRoute>
                      } />

                      {/* Protected Routes - Settings */}
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } />

                      <Route path="/settings/company" element={
                        <ProtectedRoute>
                          <CompanySettings />
                        </ProtectedRoute>
                      } />

                      <Route path="/settings/profile" element={
                        <ProtectedRoute>
                          <UserProfile />
                        </ProtectedRoute>
                      } />

                      <Route path="/settings/paint" element={
                        <ProtectedRoute>
                          <PaintBrandSettings />
                        </ProtectedRoute>
                      } />

                      <Route path="/settings/pricing" element={
                        <>
                          <ProtectedRoute>
                            <PricingSettings />
                          </ProtectedRoute>
                        </>
                      } />

                      {/* Protected Routes - Subscription */}
                      <Route path="/subscription" element={
                        <ProtectedRoute>
                          <Subscription />
                        </ProtectedRoute>
                      } />

                      <Route path="/subscription/plans" element={
                        <ProtectedRoute>
                          <PricingPlans />
                        </ProtectedRoute>
                      } />

                      <Route path="/subscription/status" element={
                        <ProtectedRoute>
                          <SubscriptionStatus />
                        </ProtectedRoute>
                      } />

                      <Route path="/subscription/billing" element={
                        <ProtectedRoute>
                          <BillingInfo />
                        </ProtectedRoute>
                      } />

                      {/* Redirects for convenience */}
                      <Route path="/project" element={<Navigate to="/projects" replace />} />
                      <Route path="/quote" element={<Navigate to="/quotes" replace />} />

                      {/* Catch all - 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
          </div>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;