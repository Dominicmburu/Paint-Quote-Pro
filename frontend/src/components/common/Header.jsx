import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { Menu, X, User, Settings, LogOut, Palette } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const { user, company, isAuthenticated, logout } = useAuth();
  const translation = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Header - Translation context:', translation);
    console.log('Header - Current language:', translation?.currentLanguage);
    console.log('Header - t function:', typeof translation?.t);
  }, [translation]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Fallback if translation is not available
  const t = translation?.t || ((text) => {
    console.warn('Translation function not available, returning original text:', text);
    return text;
  });

  // Test translation function
  const testTranslation = (key) => {
    console.log(`Translating "${key}":`, t(key));
    return t(key);
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
                  {testTranslation('Features')}
                </Link>
                <Link
                  to="/pricing"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/pricing') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  {testTranslation('Pricing')}
                </Link>
                <Link
                  to="/about"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/about') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  {testTranslation('About')}
                </Link>
                <Link
                  to="/contact"
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive('/contact') ? 'text-[#4bb4f5] bg-blue-50' : 'text-slate-700 hover:text-[#6bc5f7]'
                  }`}
                >
                  {testTranslation('Contact')}
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
                  {testTranslation('Dashboard')}
                </Link>
              </>
            )}
          </nav>

          {/* Right side - Language Switcher + Auth Buttons / User Menu */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher - Only show if translation is available */}
            {translation && <LanguageSwitcher />}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-[#6bc5f7] px-2 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <span className="hidden sm:inline">{testTranslation('Sign In')}</span>
                  <span className="sm:hidden">{testTranslation('Login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="mybtn-sm"
                >
                  <span className="hidden sm:inline">{testTranslation('Get Started')}</span>
                  <span className="sm:hidden">{testTranslation('Join')}</span>
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
                      <span>{testTranslation('Settings')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{testTranslation('Sign Out')}</span>
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
                    {testTranslation('Features')}
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
                    {testTranslation('Pricing')}
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
                    {testTranslation('About')}
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
                    {testTranslation('Contact')}
                  </Link>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <Link
                      to="/login"
                      className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-[#6bc5f7] hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {testTranslation('Sign In')}
                    </Link>
                    <Link
                      to="/register"
                      className="mybtn-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {testTranslation('Get Started')}
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
                    {testTranslation('Dashboard')}
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
                    {testTranslation('Settings')}
                  </Link>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      {testTranslation('Sign Out')}
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