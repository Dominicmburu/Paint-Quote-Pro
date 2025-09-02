import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/images/flotto_logo.png"
                alt="Flotto Logo"
                className="h-20 w-20"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-2xl font-bold text-[#4bb4f5]" style={{ display: 'none' }}>F</span>
              <span className="text-2xl font-bold">Flotto</span>
            </div>
            <p className="text-gray-300 mb-4">
              Professional quoting software for painters and plasterers. AI-powered solutions that save you time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#4bb4f5]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/features" className="text-gray-300 hover:text-[#4bb4f5] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-gray-300 hover:text-[#4bb4f5] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-[#4bb4f5] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-[#4bb4f5] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#4bb4f5]">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4 text-[#4bb4f5]" />
                <span className="text-sm">hello@flotto.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4 text-[#4bb4f5]" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-[#4bb4f5] mt-0.5" />
                <span className="text-sm">123 Business Ave<br />Suite 100<br />Business City, BC 12345</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Flotto. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/privacy-policy"
                className="text-gray-400 hover:text-[#4bb4f5] text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms-of-service"
                className="text-gray-400 hover:text-[#4bb4f5] text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/cookie-policy"
                className="text-gray-400 hover:text-[#4bb4f5] text-sm transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;