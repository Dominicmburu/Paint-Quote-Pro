import React from 'react';
import { Building, User, Mail, Phone, MapPin, CreditCard, Globe } from 'lucide-react';

const ClientForm = ({ clientData, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2 text-purple-600" />
          Company Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={clientData.company_name || ''}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="VanDuinenDeco"
            />
            {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTW Nummer
            </label>
            <input
              type="text"
              value={clientData.btw_number || ''}
              onChange={(e) => handleChange('btw_number', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="NL002454009B19"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KVK Nummer
            </label>
            <input
              type="text"
              value={clientData.kvk_number || ''}
              onChange={(e) => handleChange('kvk_number', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="63892359"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN
            </label>
            <input
              type="text"
              value={clientData.iban || ''}
              onChange={(e) => handleChange('iban', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="NL76KNAB0613683102"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={clientData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="www.vanduinendeco.nl"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-purple-600" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={clientData.contact_name || ''}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="John van Duinen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={clientData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="info@vanduinendeco.nl"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={clientData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0630809048"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-purple-600" />
          Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={clientData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Hermelijnvlinder 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postcode
            </label>
            <input
              type="text"
              value={clientData.postcode || ''}
              onChange={(e) => handleChange('postcode', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="3822ZH"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={clientData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Amersfoort"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;