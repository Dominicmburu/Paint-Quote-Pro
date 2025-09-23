import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Settings, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const QuoteSettings = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  
  const [settings, setSettings] = useState({
    // Company branding
    company_logo_url: '',
    company_header_color: '#7C3AED',
    quote_footer_text: '',
    
    // Quote defaults
    default_valid_days: 30,
    auto_quote_numbering: true,
    quote_number_prefix: 'QT',
    quote_number_start: 1001,
    
    // Pricing settings
    default_vat_rate: 0.20,
    show_vat_breakdown: true,
    default_payment_terms: '30 days',
    
    // Paint brand settings
    preferred_paint_brand: 'Dulux',
    default_paint_coverage: 12, // m² per litre
    wall_paint_price_per_litre: 25.00,
    ceiling_paint_price_per_litre: 22.00,
    primer_price_per_litre: 20.00,
    
    // Labor costs
    hourly_rate: 35.00,
    prep_time_per_m2: 0.15, // hours per m²
    paint_time_per_m2: 0.10, // hours per m²
    
    // Material markups
    material_markup_percentage: 15,
    include_material_markup: true,
    
    // Auto-generation settings
    auto_include_prep_work: true,
    auto_include_cleanup: true,
    auto_deduct_doors_windows: true,
    standard_door_area: 2.0, // m²
    standard_window_area: 1.5, // m²
    
    // Email settings
    auto_send_quote_copy: true,
    quote_email_template: 'default',
    email_subject_template: 'Paint Quote #{quote_number} - {project_name}'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/quotes');
      setSettings({ ...settings, ...response.data.settings });
    } catch (err) {
      // If no settings exist yet, use defaults
      console.log('No existing settings found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await api.post('/settings/quotes', settings);
      setSuccessMessage('Quote settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        company_logo_url: '',
        company_header_color: '#7C3AED',
        quote_footer_text: '',
        default_valid_days: 30,
        auto_quote_numbering: true,
        quote_number_prefix: 'QT',
        quote_number_start: 1001,
        default_vat_rate: 0.20,
        show_vat_breakdown: true,
        default_payment_terms: '30 days',
        preferred_paint_brand: 'Dulux',
        default_paint_coverage: 12,
        wall_paint_price_per_litre: 25.00,
        ceiling_paint_price_per_litre: 22.00,
        primer_price_per_litre: 20.00,
        hourly_rate: 35.00,
        prep_time_per_m2: 0.15,
        paint_time_per_m2: 0.10,
        material_markup_percentage: 15,
        include_material_markup: true,
        auto_include_prep_work: true,
        auto_include_cleanup: true,
        auto_deduct_doors_windows: true,
        standard_door_area: 2.0,
        standard_window_area: 1.5,
        auto_send_quote_copy: true,
        quote_email_template: 'default',
        email_subject_template: 'Paint Quote #{quote_number} - {project_name}'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/quotes')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center">
            <Settings className="h-8 w-8 mr-3" />
            Quote Settings
          </h1>
        </div>
        <p className="text-gray-600">Configure default values and preferences for quote generation</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Company Branding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Company Branding</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo URL
              </label>
              <input
                type="url"
                value={settings.company_logo_url}
                onChange={(e) => handleInputChange('company_logo_url', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.company_header_color}
                  onChange={(e) => handleInputChange('company_header_color', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.company_header_color}
                  onChange={(e) => handleInputChange('company_header_color', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Footer Text
              </label>
              <textarea
                rows={3}
                value={settings.quote_footer_text}
                onChange={(e) => handleInputChange('quote_footer_text', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Thank you for your business. Payment terms: 30 days net."
              />
            </div>
          </div>
        </div>

        {/* Quote Defaults */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Quote Defaults</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Valid Days
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.default_valid_days}
                onChange={(e) => handleInputChange('default_valid_days', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                value={settings.default_payment_terms}
                onChange={(e) => handleInputChange('default_payment_terms', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="15 days">15 days</option>
                <option value="30 days">30 days</option>
                <option value="45 days">45 days</option>
                <option value="60 days">60 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Number Prefix
              </label>
              <input
                type="text"
                value={settings.quote_number_prefix}
                onChange={(e) => handleInputChange('quote_number_prefix', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="QT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Number Start
              </label>
              <input
                type="number"
                min="1"
                value={settings.quote_number_start}
                onChange={(e) => handleInputChange('quote_number_start', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_quote_numbering"
                  checked={settings.auto_quote_numbering}
                  onChange={(e) => handleInputChange('auto_quote_numbering', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_quote_numbering" className="ml-2 text-sm text-gray-700">
                  Auto-generate quote numbers
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* VAT & Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">VAT & Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.default_vat_rate}
                onChange={(e) => handleInputChange('default_vat_rate', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter as decimal (e.g., 0.20 for 20%)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Markup (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.material_markup_percentage}
                onChange={(e) => handleInputChange('material_markup_percentage', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_vat_breakdown"
                  checked={settings.show_vat_breakdown}
                  onChange={(e) => handleInputChange('show_vat_breakdown', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="show_vat_breakdown" className="ml-2 text-sm text-gray-700">
                  Show VAT breakdown in quotes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_material_markup"
                  checked={settings.include_material_markup}
                  onChange={(e) => handleInputChange('include_material_markup', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="include_material_markup" className="ml-2 text-sm text-gray-700">
                  Include material markup in pricing
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Paint & Materials */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Paint & Materials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Paint Brand
              </label>
              <select
                value={settings.preferred_paint_brand}
                onChange={(e) => handleInputChange('preferred_paint_brand', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Dulux">Dulux</option>
                <option value="Farrow & Ball">Farrow & Ball</option>
                <option value="Crown">Crown</option>
                <option value="Johnstone's">Johnstone's</option>
                <option value="Benjamin Moore">Benjamin Moore</option>
                <option value="Sherwin Williams">Sherwin Williams</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paint Coverage (m² per litre)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={settings.default_paint_coverage}
                onChange={(e) => handleInputChange('default_paint_coverage', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wall Paint Price (€/litre)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.wall_paint_price_per_litre}
                onChange={(e) => handleInputChange('wall_paint_price_per_litre', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ceiling Paint Price (€/litre)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.ceiling_paint_price_per_litre}
                onChange={(e) => handleInputChange('ceiling_paint_price_per_litre', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primer Price (€/litre)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.primer_price_per_litre}
                onChange={(e) => handleInputChange('primer_price_per_litre', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Labor Costs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Labor Costs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.hourly_rate}
                onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (hours per m²)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.prep_time_per_m2}
                onChange={(e) => handleInputChange('prep_time_per_m2', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paint Time (hours per m²)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.paint_time_per_m2}
                onChange={(e) => handleInputChange('paint_time_per_m2', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Auto-Generation Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Auto-Generation Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Door Area (m²)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.standard_door_area}
                onChange={(e) => handleInputChange('standard_door_area', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Window Area (m²)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.standard_window_area}
                onChange={(e) => handleInputChange('standard_window_area', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_include_prep_work"
                  checked={settings.auto_include_prep_work}
                  onChange={(e) => handleInputChange('auto_include_prep_work', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_include_prep_work" className="ml-2 text-sm text-gray-700">
                  Auto-include prep work in quotes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_include_cleanup"
                  checked={settings.auto_include_cleanup}
                  onChange={(e) => handleInputChange('auto_include_cleanup', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_include_cleanup" className="ml-2 text-sm text-gray-700">
                  Auto-include cleanup in quotes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_deduct_doors_windows"
                  checked={settings.auto_deduct_doors_windows}
                  onChange={(e) => handleInputChange('auto_deduct_doors_windows', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_deduct_doors_windows" className="ml-2 text-sm text-gray-700">
                  Auto-deduct door and window areas
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Email Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject Template
              </label>
              <input
                type="text"
                value={settings.email_subject_template}
                onChange={(e) => handleInputChange('email_subject_template', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Paint Quote #{quote_number} - {project_name}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{quote_number}'}, {'{project_name}'}, {'{client_name}'}, {'{company_name}'}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_send_quote_copy"
                checked={settings.auto_send_quote_copy}
                onChange={(e) => handleInputChange('auto_send_quote_copy', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_send_quote_copy" className="ml-2 text-sm text-gray-700">
                Auto-send copy of quotes to company email
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={resetToDefaults}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">About Quote Settings</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• These settings will be used as defaults for all new quotes</li>
                <li>• You can override any setting when creating individual quotes</li>
                <li>• Labor costs are calculated automatically based on surface areas</li>
                <li>• Material markups help ensure profitability on paint and supplies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSettings;