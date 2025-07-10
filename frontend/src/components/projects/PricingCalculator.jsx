import React, { useState } from 'react';
import { DollarSign, Save } from 'lucide-react';
import api from '../../services/api';

const PricingCalculator = ({ rooms, interiorItems, exteriorItems, specialJobs, totalCost, onGenerate, generating, customPricing, setCustomPricing }) => {
  const [localPricing, setLocalPricing] = useState(customPricing || {});

  const updatePricing = (category, type, subType, condition, value) => {
    setLocalPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: {
          ...prev[category]?.[type],
          [subType]: {
            ...prev[category]?.[type]?.[subType],
            [condition]: parseFloat(value) || 0
          }
        }
      }
    }));
  };

  const savePricing = async () => {
    try {
      const response = await api.post('/settings/pricing', { pricing: localPricing });
      setCustomPricing(response.data.pricing);
    } catch (err) {
      console.error('Failed to save pricing:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Adjust Pricing</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Interior Pricing</h4>
        {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards'].map(type => (
          <div key={type} className="mb-4">
            <h5 className="text-sm font-medium text-gray-900">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}</h5>
            {type === 'doors' ? (
              ['front', 'inside', 'outside'].map(doorType => (
                <div key={doorType} className="ml-4">
                  <h6 className="text-xs font-medium text-gray-700">{doorType.charAt(0).toUpperCase() + doorType.slice(1)}</h6>
                  {['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                    <div key={condition} className="flex items-center space-x-2 mt-1">
                      <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localPricing?.interior?.[type]?.[doorType]?.[condition] || customPricing?.interior?.[type]?.[doorType]?.[condition] || 0}
                        onChange={(e) => updatePricing('interior', type, doorType, condition, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ))
            ) : type === 'skirtingBoards' ? (
              ['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                <div key={condition} className="flex items-center space-x-2 mt-1">
                  <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')} (per m):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localPricing?.interior?.[type]?.perMeter?.[condition] || customPricing?.interior?.[type]?.perMeter?.[condition] || 0}
                    onChange={(e) => updatePricing('interior', type, 'perMeter', condition, e.target.value)}
                    className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
              ))
            ) : (
              ['small', 'medium', 'big'].map(size => (
                <div key={size} className="ml-4">
                  <h6 className="text-xs font-medium text-gray-700">{size.charAt(0).toUpperCase() + size.slice(1)}</h6>
                  {['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                    <div key={condition} className="flex items-center space-x-2 mt-1">
                      <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localPricing?.interior?.[type]?.[size]?.[condition] || customPricing?.interior?.[type]?.[size]?.[condition] || 0}
                        onChange={(e) => updatePricing('interior', type, size, condition, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ))}
        {['stairs', 'radiators'].map(type => (
          <div key={type} className="mb-4">
            <h5 className="text-sm font-medium text-gray-900">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}</h5>
            <div className="flex items-center space-x-2 mt-1">
              <label className="text-xs text-gray-600">Base Price:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={localPricing?.interior?.[type]?.base || customPricing?.interior?.[type]?.base || 0}
                onChange={(e) => updatePricing('interior', type, 'base', 'base', e.target.value)}
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Exterior Pricing</h4>
        {['doors', 'fixedWindows', 'turnWindows', 'dormerWindows', 'fasciaBoards'].map(type => (
          <div key={type} className="mb-4">
            <h5 className="text-sm font-medium text-gray-900">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}</h5>
            {type === 'doors' ? (
              ['front', 'garage', 'outside'].map(doorType => (
                <div key={doorType} className="ml-4">
                  <h6 className="text-xs font-medium text-gray-700">{doorType.charAt(0).toUpperCase() + doorType.slice(1)}</h6>
                  {['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                    <div key={condition} className="flex items-center space-x-2 mt-1">
                      <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localPricing?.exterior?.[type]?.[doorType]?.[condition] || customPricing?.exterior?.[type]?.[doorType]?.[condition] || 0}
                        onChange={(e) => updatePricing('exterior', type, doorType, condition, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ))
            ) : type === 'fasciaBoards' ? (
              ['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                <div key={condition} className="flex items-center space-x-2 mt-1">
                  <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')} (per m):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localPricing?.exterior?.[type]?.perMeter?.[condition] || customPricing?.exterior?.[type]?.perMeter?.[condition] || 0}
                    onChange={(e) => updatePricing('exterior', type, 'perMeter', condition, e.target.value)}
                    className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
              ))
            ) : (
              (type === 'dormerWindows' ? ['small', 'medium', 'large'] : ['small', 'medium', 'big']).map(size => (
                <div key={size} className="ml-4">
                  <h6 className="text-xs font-medium text-gray-700">{size.charAt(0).toUpperCase() + size.slice(1)}</h6>
                  {['level_1', 'level_2', 'level_3', 'level_4'].map(condition => (
                    <div key={condition} className="flex items-center space-x-2 mt-1">
                      <label className="text-xs text-gray-600">{condition.replace('level_', 'Level ')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localPricing?.exterior?.[type]?.[size]?.[condition] || customPricing?.exterior?.[type]?.[size]?.[condition] || 0}
                        onChange={(e) => updatePricing('exterior', type, size, condition, e.target.value)}
                        className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ))}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-900">Rain Pipe</h5>
          <div className="flex items-center space-x-2 mt-1">
            <label className="text-xs text-gray-600">Base Price (per m):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={localPricing?.exterior?.rainPipe?.perMeter?.base || customPricing?.exterior?.rainPipe?.perMeter?.base || 0}
              onChange={(e) => updatePricing('exterior', 'rainPipe', 'perMeter', 'base', e.target.value)}
              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Special Jobs Pricing</h4>
        {['water_damage', 'fire_smoke_damage', 'mold_remediation', 'nicotine_stained_walls', 'uneven_wall_surfaces'].map(type => (
          <div key={type} className="flex items-center space-x-2 mt-1">
            <label className="text-xs text-gray-600">{type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={localPricing?.specialJobs?.[type]?.price || customPricing?.specialJobs?.[type]?.price || 0}
              onChange={(e) => updatePricing('specialJobs', type, 'price', 'price', e.target.value)}
              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={savePricing}
          className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Pricing
        </button>
      </div>
      <div className="bg-teal-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-teal-900 mb-4">Total Cost</h3>
        <p className="text-2xl font-bold text-teal-600">£{totalCost.toFixed(2)}</p>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Quote...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Generate Quote
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingCalculator;