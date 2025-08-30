import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X, User, Settings, LogOut, Palette } from 'lucide-react';

const Header = () => {
  const { user, company, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-lg border-b-2 border-[#4bb4f5] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/images/flotto_logo.png" 
                alt="Flotto Logo" 
                className="h-20 w-20"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-2xl font-bold text-slate-800 sm:block hidden">FLOTTO</span>
              <span className="text-xl font-bold text-slate-800 sm:hidden">FLOTTO</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/features"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/features') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/pricing') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/about') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/contact') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  Contact
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-[#6bc5f7] px-2 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="mybtn-sm"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-[#6bc5f7] px-2 py-2 rounded-md transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block">{user?.first_name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-slate-800">{user?.full_name}</p>
                      <p className="text-xs text-slate-500">{company?.name}</p>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-slate-700 hover:text-[#6bc5f7] p-2 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 rounded-lg mb-3 border">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/features"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/features') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    to="/pricing"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/pricing') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/about') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/contact') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <Link
                      to="/login"
                      className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="mybtn-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/settings') 
                        ? 'text-[#4bb4f5] bg-blue-50' 
                        : 'text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;