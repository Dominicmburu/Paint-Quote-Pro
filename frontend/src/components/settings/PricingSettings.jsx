// components/settings/PricingSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, RefreshCw, Settings, RotateCcw } from 'lucide-react';
import api from '../../services/api';

const PricingSettings = () => {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPricingSettings();
  }, []);

  const loadPricingSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/settings/pricing');
      setPricing(response.data.pricing);
    } catch (error) {
      setError('Failed to load pricing settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = (category, type, subtype, newPrice) => {
    setPricing(prev => {
      const updated = { ...prev };
      if (subtype) {
        if (!updated[category]) updated[category] = {};
        if (!updated[category][type]) updated[category][type] = {};
        if (!updated[category][type][subtype]) updated[category][type][subtype] = {};
        updated[category][type][subtype].price = parseFloat(newPrice) || 0;
      } else {
        if (!updated[category]) updated[category] = {};
        if (!updated[category][type]) updated[category][type] = {};
        updated[category][type].price = parseFloat(newPrice) || 0;
      }
      return updated;
    });
  };

  const updateAdditionalFee = (type, newValue) => {
    setPricing(prev => ({
      ...prev,
      additional: {
        ...prev.additional,
        [type]: parseFloat(newValue) || 0
      }
    }));
  };

  const savePricingSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await api.post('/settings/pricing', { pricing });
      setSuccessMessage('Pricing settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to save pricing settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all pricing to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setResetting(true);
      setError('');
      const response = await api.post('/settings/pricing/reset');
      setPricing(response.data.pricing);
      setSuccessMessage('Pricing settings reset to defaults successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to reset pricing settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const formatCategoryName = (category) => {
    const categoryNames = {
      walls: 'Walls',
      ceiling: 'Ceiling',
      interior: 'Interior',
      exterior: 'Exterior',
      specialJobs: 'Special Jobs',
      additional: 'Additional Fees'
    };
    return categoryNames[category] || category;
  };

  const formatTypeName = (type) => {
    const typeNames = {
      sanding: 'Sanding',
      priming: 'Priming',
      painting: 'Painting',
      preparation: 'Preparation',
      doors: 'Doors',
      fixedWindows: 'Fixed Windows',
      turnWindows: 'Turn Windows',
      dormerWindows: 'Dormer Windows',
      fasciaBoards: 'Fascia Boards',
      rainPipe: 'Rain Pipe',
      stairs: 'Stairs',
      radiators: 'Radiators',
      skirtingBoards: 'Skirting Boards',
      otherItems: 'Other Items',
      special: 'Special Repairs',
      woodwork: 'Woodwork'
    };
    return typeNames[type] || type.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatSubtypeName = (subtype) => {
    const subtypeNames = {
      light: 'Light',
      medium: 'Medium',
      heavy: 'Heavy',
      one_coat: 'One Coat',
      two_coat: 'Two Coats',
      three_coat: 'Three Coats',
      easy_prep: 'Easy Prep',
      medium_prep: 'Medium Prep',
      heavy_prep: 'Heavy Prep',
      small: 'Small',
      big: 'Large',
      large: 'Large',
      front_door: 'Front Door',
      garage_door: 'Garage Door',
      outside_door: 'Outside Door',
      water_damage: 'Water Damage',
      fire_smoke_damage: 'Fire/Smoke Damage',
      mold_remediation: 'Mold Remediation',
      nicotine_stained_walls: 'Nicotine Stained Walls',
      uneven_wall_surfaces: 'Uneven Wall Surfaces',
      level_1: 'Level 1',
      level_2: 'Level 2',
      level_3: 'Level 3',
      level_4: 'Level 4'
    };
    return subtypeNames[subtype] || subtype.replace(/([A-Z])/g, ' $1').trim();
  };

  const PriceInput = ({ value, onChange, prefix = '£' }) => (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        {prefix}
      </span>
      <input
        type="number"
        value={value}
        onChange={onChange}
        step="0.01"
        min="0"
        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>
  );

  const renderPricingSection = (category, categoryData) => {
    if (category === 'additional') {
      return (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {formatCategoryName(category)}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cleanup Fee
                  </label>
                  <PriceInput
                    value={categoryData.cleanup_fee || 0}
                    onChange={(e) => updateAdditionalFee('cleanup_fee', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed cleanup fee per project</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials Markup (%)
                  </label>
                  <PriceInput
                    value={(categoryData.materials_markup || 0) * 100}
                    onChange={(e) => updateAdditionalFee('materials_markup', e.target.value / 100)}
                    prefix="%"
                  />
                  <p className="text-xs text-gray-500 mt-1">Markup percentage on materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {formatCategoryName(category)}
          </h3>
          <div className="space-y-6">
            {Object.entries(categoryData).map(([type, typeData]) => (
              <div key={type} className="border-b border-gray-100 pb-4 last:border-b-0">
                <h4 className="text-md font-medium text-gray-800 mb-3">
                  {formatTypeName(type)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(typeData).map(([subtype, subtypeData]) => (
                    <div key={subtype} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {formatSubtypeName(subtype)}
                      </label>
                      <PriceInput
                        value={subtypeData.price || 0}
                        onChange={(e) => updatePrice(category, type, subtype, e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        {subtypeData.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p>Loading pricing settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-teal-600" />
                  Pricing Settings
                </h1>
                <p className="text-gray-600">Configure default pricing for quotes and estimates</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetToDefaults}
                disabled={resetting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </>
                )}
              </button>
              <button
                onClick={savePricingSettings}
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md font-medium"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
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

        {/* Pricing Summary Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Pricing Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• These prices are used as defaults for all new projects and quotes</li>
            <li>• You can still override prices on individual projects if needed</li>
            <li>• Changes will apply to new calculations, not existing saved projects</li>
            <li>• Regular price reviews help maintain competitive and profitable rates</li>
          </ul>
        </div>

        {/* Pricing Sections */}
        <div className="space-y-8">
          {Object.entries(pricing).map(([category, categoryData]) => {
            // Filter out metadata fields
            if (['id', 'company_id', 'created_at', 'updated_at'].includes(category)) {
              return null;
            }
            return renderPricingSection(category, categoryData);
          })}
        </div>

        {/* Database Info */}
        {pricing.updated_at && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Last updated: {new Date(pricing.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingSettings;