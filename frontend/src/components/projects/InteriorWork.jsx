import React, { useState } from 'react';
import { Plus, Trash2, DoorClosed, ChevronDown, ChevronUp, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';
import { useTranslation } from '../../hooks/useTranslation';

const InteriorWork = ({ interiorItems, setInteriorItems, customPricing }) => {
  const { 
    pricing, 
    loading: pricingLoading, 
    error: pricingError, 
    refreshPricing 
  } = usePricing();
  
  const { t } = useTranslation();

  const [expandedSteps, setExpandedSteps] = useState({});

  const woodworkConditions = {
    level_1: {
      name: t('New/Pre-primed'),
      steps: [
        t('Clean surface (dust and degrease with sugar soap)'),
        t('Light sanding to key the surface'),
        t('Prime if bare wood (skip if factory-primed and in good condition)'),
        t('Apply topcoat')
      ]
    },
    level_2: {
      name: t('Good Condition'),
      steps: [
        t('Clean with sugar soap'),
        t('Light sand to dull surface'),
        t('Fill small dents or imperfections (if needed)'),
        t('Spot prime glossy or bare areas'),
        t('Apply topcoat')
      ]
    },
    level_3: {
      name: t('Moderate Wear'),
      steps: [
        t('Scrape away all loose/flaking paint'),
        t('Sand surface to smooth out rough areas'),
        t('Fill cracks or gouges with appropriate filler'),
        t('Spot prime exposed wood'),
        t('Final sand before painting'),
        t('Apply topcoat')
      ]
    },
    level_4: {
      name: t('Heavy Damage'),
      steps: [
        t('Cut out or remove rotten areas (if applicable)'),
        t('Apply wood hardener to soft sections'),
        t('Fill deep damage with 2-part wood filler'),
        t('Sand thoroughly to level surface'),
        t('Apply full primer coat to all areas'),
        t('Apply topcoat')
      ]
    }
  };

  const getPrice = (type, subtype, condition) => {
    if (!pricing?.interior) {
      return 0;
    }

    try {
      if (type === 'doors') {
        // 🚨 FIX: Map condition to correct pricing key
        const conditionMapping = {
          'level_1': 'easy_prep',
          'level_2': 'medium_prep', 
          'level_3': 'heavy_prep',
          'level_4': 'heavy_prep'
        };
        const mappedCondition = conditionMapping[condition] || 'easy_prep';
        return pricing.interior.doors[mappedCondition]?.price || 0;
        
      } else if (type === 'fixedWindows' || type === 'turnWindows') {
        return pricing.interior[type][subtype]?.price || 0;
        
      } else if (type === 'stairs' || type === 'radiators' || type === 'skirtingBoards' || type === 'otherItems') {
        return pricing.interior[type]?.price || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting interior price:', error);
      return 0;
    }
  };

  const addItem = (type) => {
    const newItem = {
      id: Date.now(),
      type,
      quantity: 1,
      description: '',
      cost: 0
    };

    if (['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type)) {
      newItem.condition = 'level_1';
      if (type === 'doors') newItem.doorType = 'inside';
      if (type.includes('Windows')) newItem.size = 'medium';
    }

    setInteriorItems(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const updateItem = (type, id, field, value) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (type, id) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
    setExpandedSteps(prev => {
      const newState = { ...prev };
      delete newState[`${type}_${id}`];
      return newState;
    });
  };

  const toggleSteps = (itemId, type) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`${type}_${itemId}`]: !prev[`${type}_${itemId}`]
    }));
  };

  const getSelectedOptionsDisplay = (item, type) => {
    const options = [];
    if (type === 'doors') {
      options.push(t('Door Type: {{type}}', { 
        type: t(item.doorType?.charAt(0).toUpperCase() + item.doorType?.slice(1)) 
      }));
    } else if (type.includes('Windows')) {
      options.push(t('Size: {{size}}', { 
        size: t(item.size?.charAt(0).toUpperCase() + item.size?.slice(1)) 
      }));
    }
    if (['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type)) {
      options.push(t('Condition: {{condition}}', { 
        condition: woodworkConditions[item.condition]?.name 
      }));
    }
    return options.join(', ') || t('None');
  };

  const getPriceDisplay = (type, item) => {
    if (!pricing?.interior) return t('€0.00');
    
    let price = 0;
    if (type === 'doors') {
      price = getPrice(type, null, item.condition);
    } else if (type === 'fixedWindows' || type === 'turnWindows') {
      price = getPrice(type, item.size, item.condition);
    } else {
      price = getPrice(type, null, item.condition);
    }
    return t('€{{price}}', { price: price.toFixed(2) });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <DoorClosed className="h-6 w-6 mr-3 text-teal-800" />
          {t('Interior Work')}
        </h2>
        <div className="flex items-center space-x-4">
          {pricingLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {t('Loading pricing...')}
            </div>
          )}
          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            {t('Real-time calculation')}
          </div>
        </div>
      </div>

      {/* Pricing Error Alert */}
      {pricingError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{t('Pricing Error')}</p>
                <p className="text-sm text-yellow-600">{pricingError}</p>
              </div>
            </div>
            <button
              onClick={refreshPricing}
              className="text-yellow-600 hover:text-yellow-700"
              title={t('Retry loading pricing')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Pricing Display */}
      {pricing?.interior && !pricingLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">{t('Current Interior Pricing')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="font-medium text-blue-800">{t('Doors:')}</span>
              <div className="text-blue-600">
                {t('Easy Prep: €{{price}}', { price: pricing.interior.doors?.easy_prep?.price || 0 })}<br />
                {t('Medium Prep: €{{price}}', { price: pricing.interior.doors?.medium_prep?.price || 0 })}<br />
                {t('Heavy Prep: €{{price}}', { price: pricing.interior.doors?.heavy_prep?.price || 0 })}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">{t('Fixed Windows:')}</span>
              <div className="text-blue-600">
                {t('Small: €{{price}}', { price: pricing.interior.fixedWindows?.small?.price || 0 })}<br />
                {t('Medium: €{{price}}', { price: pricing.interior.fixedWindows?.medium?.price || 0 })}<br />
                {t('Large: €{{price}}', { price: pricing.interior.fixedWindows?.big?.price || 0 })}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">{t('Other Items:')}</span>
              <div className="text-blue-600">
                {t('Stairs: €{{price}}', { price: pricing.interior.stairs?.price || 0 })}<br />
                {t('Radiators: €{{price}}', { price: pricing.interior.radiators?.price || 0 })}<br />
                {t('Skirting: €{{price}}', { price: pricing.interior.skirtingBoards?.price || 0 })}
              </div>
            </div>
            <div className="text-xs text-blue-700">
              {t('Pricing loaded from database • Real-time updates')}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: 'doors', label: t('Doors') },
          { key: 'fixedWindows', label: t('Fixed Windows') },
          { key: 'turnWindows', label: t('Turn Windows') },
          { key: 'stairs', label: t('Stairs') },
          { key: 'radiators', label: t('Radiators') },
          { key: 'skirtingBoards', label: t('Skirting Boards') }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => addItem(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-300 hover:border-purple-300"
            title={t('Add {{item}}', { item: label })}
          >
            <div className="text-center">
              <div className="font-medium">{label}</div>
            </div>
          </button>
        ))}
      </div>

      {Object.keys(interiorItems).map(type => (
        interiorItems[type].length > 0 && (
          <div key={type} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">
                {t(type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'))}
              </h4>
              <div className="text-sm text-gray-500">
                {t('Items: {{count}}', { count: interiorItems[type].length })}
              </div>
            </div>
            {interiorItems[type].map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Description')}</label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateItem(type, item.id, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('Item description')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {type === 'skirtingBoards' ? t('Length (m)') : t('Quantity')}
                    </label>
                    <input
                      type="number"
                      step={type === 'skirtingBoards' ? '0.1' : '1'}
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(type, item.id, 'quantity', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={type === 'skirtingBoards' ? '0.0' : '1'}
                    />
                  </div>
                  {type === 'doors' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Door Type')}</label>
                      <select
                        value={item.doorType || 'inside'}
                        onChange={(e) => updateItem(type, item.id, 'doorType', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="front">{t('Front Door')}</option>
                        <option value="inside">{t('Inside Door')}</option>
                        <option value="outside">{t('Outside Door')}</option>
                      </select>
                    </div>
                  )}
                  {(type === 'fixedWindows' || type === 'turnWindows') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Size')}</label>
                      <select
                        value={item.size || 'medium'}
                        onChange={(e) => updateItem(type, item.id, 'size', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="small">{t('Small (&lt;0.5m²)')}</option>
                        <option value="medium">{t('Medium (0.5m²-1m²)')}</option>
                        <option value="big">{t('Large (&gt;1m²)')}</option>
                      </select>
                    </div>
                  )}
                  {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Condition')}</label>
                      <select
                        value={item.condition || 'level_1'}
                        onChange={(e) => updateItem(type, item.id, 'condition', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="level_1">{t('Level 1: New/Pre-primed')}</option>
                        <option value="level_2">{t('Level 2: Good Condition')}</option>
                        <option value="level_3">{t('Level 3: Moderate Wear')}</option>
                        <option value="level_4">{t('Level 4: Heavy Damage')}</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Price')}</label>
                      <div className="text-sm text-gray-900 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                        {getPriceDisplay(type, item)}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Calculated Cost')}</label>
                    <div className="text-sm font-medium text-green-700 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                      {t('€{{cost}}', { 
                        cost: ((parseFloat(item.quantity) || 1) * getPrice(type, item.size, item.condition)).toFixed(2) 
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  {t('Selected: {{options}}', { options: getSelectedOptionsDisplay(item, type) })}
                  {getPriceDisplay(type, item) !== t('€0.00') && (
                    <span className="ml-2 text-blue-600">• {t('Unit Price: {{price}}', { price: getPriceDisplay(type, item) })}</span>
                  )}
                </div>

                {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-600">
                      {t('Item Total: €{{total}}', { 
                        total: ((parseFloat(item.quantity) || 1) * getPrice(type, item.size, item.condition)).toFixed(2) 
                      })}
                    </div>
                    <button
                      onClick={() => toggleSteps(item.id, type)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {expandedSteps[`${type}_${item.id}`] ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          {t('Hide Steps')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          {t('Show Steps')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) && expandedSteps[`${type}_${item.id}`] && (
                  <div className="mt-3 bg-gray-100 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      {t('Preparation Steps - {{condition}}', { condition: woodworkConditions[item.condition]?.name })}
                    </h5>
                    <ol className="text-sm text-gray-700 space-y-1">
                      {woodworkConditions[item.condition]?.steps.map((step, index) => (
                        <li key={index} className="flex">
                          <span className="font-medium mr-2">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => removeItem(type, item.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title={t('Remove Item')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ))}

      {Object.values(interiorItems).every(items => items.length === 0) && (
        <div className="text-center py-12">
          <DoorClosed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No interior items added yet')}</h3>
          <p className="text-gray-500 mb-6">
            {t('Click the buttons above to add doors, windows, etc. Total price updates automatically.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default InteriorWork;