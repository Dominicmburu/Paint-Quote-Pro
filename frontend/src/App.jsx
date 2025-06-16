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
import PricingPlans from './components/subscription/PricingPlans';
import SubscriptionStatus from './components/subscription/SubscriptionStatus';
import BillingInfo from './components/subscription/BillingInfo';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';

// Error Pages
import NotFound from './pages/NotFound';

// Styles
import './App.css';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <div className="App min-h-screen bg-yellow-50">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
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
                    <CreateProject />
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
                {/* Generate new quote for a specific project */}
                <Route path="/projects/:id/quote" element={
                  <ProtectedRoute>
                    <QuoteGenerator />
                  </ProtectedRoute>
                } />
                
                {/* View/preview a specific quote */}
                <Route path="/quotes/:id" element={
                  <ProtectedRoute>
                    <QuotePreview />
                  </ProtectedRoute>
                } />
                
                {/* Quote management pages */}
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
                
                {/* Protected Routes - Subscription */}
                <Route path="/subscription" element={
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
                
                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
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
          </div>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;