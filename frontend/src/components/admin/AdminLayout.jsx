import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Building,
  CreditCard,
  FileText,
  Quote,
  TrendingUp,
  Settings,
  Activity,
  FileDown,
  HeadphonesIcon,
  DollarSign,
  Menu,
  X,
  ArrowLeft,
  Shield,
  LogOut
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin' || location.pathname === '/admin/'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users')
    },
    {
      name: 'Companies',
      href: '/admin/companies',
      icon: Building,
      current: location.pathname.startsWith('/admin/companies')
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCard,
      current: location.pathname.startsWith('/admin/subscriptions')
    },
    {
      name: 'Projects',
      href: '/admin/projects',
      icon: FileText,
      current: location.pathname.startsWith('/admin/projects')
    },
    {
      name: 'Quotes',
      href: '/admin/quotes',
      icon: Quote,
      current: location.pathname.startsWith('/admin/quotes')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp,
      current: location.pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Billing',
      href: '/admin/billing',
      icon: DollarSign,
      current: location.pathname.startsWith('/admin/billing')
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: HeadphonesIcon,
      current: location.pathname.startsWith('/admin/support')
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: FileDown,
      current: location.pathname.startsWith('/admin/reports')
    },
    {
      name: 'Activity Logs',
      href: '/admin/logs',
      icon: Activity,
      current: location.pathname.startsWith('/admin/logs')
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings')
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Shield className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-purple-700">Admin Panel</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      item.current
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Shield className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-purple-700">Admin Panel</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="hidden md:block">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to App
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Admin Mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;