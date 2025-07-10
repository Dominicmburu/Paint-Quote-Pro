import React, { useState } from 'react';
import { Plus, Trash2, DoorClosed, ChevronDown, ChevronUp } from 'lucide-react';

const InteriorWork = ({ interiorItems, setInteriorItems, onCostChange, customPricing }) => {
  const [expandedSteps, setExpandedSteps] = useState({}); // Track which items' steps are expanded

  const defaultPricing = {
    doors: {
      front: { level_1: 50, level_2: 75, level_3: 100, level_4: 150 },
      inside: { level_1: 40, level_2: 65, level_3: 90, level_4: 130 },
      outside: { level_1: 60, level_2: 85, level_3: 110, level_4: 160 }
    },
    fixedWindows: {
      small: { level_1: 20, level_2: 30, level_3: 40, level_4: 60 },
      medium: { level_1: 30, level_2: 45, level_3: 60, level_4: 90 },
      big: { level_1: 50, level_2: 75, level_3: 100, level_4: 150 }
    },
    turnWindows: {
      small: { level_1: 25, level_2: 35, level_3: 45, level_4: 70 },
      medium: { level_1: 35, level_2: 50, level_3: 70, level_4: 100 },
      big: { level_1: 60, level_2: 85, level_3: 110, level_4: 160 }
    },
    stairs: { base: 25 }, // Flat price per step
    radiators: { base: 35 }, // Flat price per radiator
    skirtingBoards: { perMeter: { level_1: 5, level_2: 8, level_3: 12, level_4: 18 } },
    otherItems: { level_1: 10, level_2: 15, level_3: 20, level_4: 30 }
  };

  const woodworkConditions = {
    level_1: {
      name: 'New/Pre-primed',
      steps: [
        'Clean surface (dust and degrease with sugar soap)',
        'Light sanding to key the surface',
        'Prime if bare wood (skip if factory-primed and in good condition)',
        'Apply topcoat'
      ]
    },
    level_2: {
      name: 'Good Condition',
      steps: [
        'Clean with sugar soap',
        'Light sand to dull surface',
        'Fill small dents or imperfections (if needed)',
        'Spot prime glossy or bare areas',
        'Apply topcoat'
      ]
    },
    level_3: {
      name: 'Moderate Wear',
      steps: [
        'Scrape away all loose/flaking paint',
        'Sand surface to smooth out rough areas',
        'Fill cracks or gouges with appropriate filler',
        'Spot prime exposed wood',
        'Final sand before painting',
        'Apply topcoat'
      ]
    },
    level_4: {
      name: 'Heavy Damage',
      steps: [
        'Cut out or remove rotten areas (if applicable)',
        'Apply wood hardener to soft sections',
        'Fill deep damage with 2-part wood filler',
        'Sand thoroughly to level surface',
        'Apply full primer coat to all areas',
        'Apply topcoat'
      ]
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
    calculateTotalCost();
  };

  const updateItem = (type, id, field, value) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
    calculateTotalCost();
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
    calculateTotalCost();
  };

  const toggleSteps = (itemId, type) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`${type}_${itemId}`]: !prev[`${type}_${itemId}`]
    }));
  };

  const calculateTotalCost = () => {
    let total = 0;
    const pricing = customPricing || defaultPricing;

    Object.keys(interiorItems).forEach(type => {
      interiorItems[type].forEach(item => {
        const quantity = parseFloat(item.quantity) || 1;
        let cost = 0;
        if (type === 'doors') {
          cost = pricing[type][item.doorType][item.condition] || 0;
        } else if (type.includes('Windows')) {
          cost = pricing[type][item.size][item.condition] || 0;
        } else if (type === 'skirtingBoards') {
          cost = pricing[type].perMeter[item.condition] || 0;
        } else if (type === 'otherItems') {
          cost = pricing[type][item.condition] || 0;
        } else {
          cost = pricing[type].base || 0; // For stairs and radiators
        }
        total += quantity * cost;
        item.cost = quantity * cost; // Update item cost
      });
    });

    onCostChange(total);
  };

  const getSelectedOptionsDisplay = (item, type) => {
    const options = [];
    if (type === 'doors') {
      options.push(`Door Type: ${item.doorType.charAt(0).toUpperCase() + item.doorType.slice(1)}`);
    } else if (type.includes('Windows')) {
      options.push(`Size: ${item.size.charAt(0).toUpperCase() + item.size.slice(1)}`);
    }
    if (['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type)) {
      options.push(`Condition: ${woodworkConditions[item.condition].name}`);
    }
    return options.join(', ') || 'None';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <DoorClosed className="h-6 w-6 mr-3 text-teal-800" />
        Interior Work
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: 'doors', label: 'Doors' },
          { key: 'fixedWindows', label: 'Fixed Windows' },
          { key: 'turnWindows', label: 'Turn Windows' },
          { key: 'stairs', label: 'Stairs' },
          { key: 'radiators', label: 'Radiators' },
          { key: 'skirtingBoards', label: 'Skirting Boards' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => addItem(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-300 hover:border-purple-300"
            title={`Add ${label}`}
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
                {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
              </h4>
              <div className="text-sm text-gray-500">
                Total: £{interiorItems[type].reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
              </div>
            </div>
            {interiorItems[type].map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(type, item.id, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {type === 'skirtingBoards' ? 'Length (m)' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      step={type === 'skirtingBoards' ? '0.1' : '1'}
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(type, item.id, 'quantity', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  {type === 'doors' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Door Type</label>
                      <select
                        value={item.doorType}
                        onChange={(e) => updateItem(type, item.id, 'doorType', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="front">Front Door</option>
                        <option value="inside">Inside Door</option>
                        <option value="outside">Outside Door</option>
                      </select>
                    </div>
                  )}
                  {(type === 'fixedWindows' || type === 'turnWindows') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <select
                        value={item.size}
                        onChange={(e) => updateItem(type, item.id, 'size', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="small">{`Small (<0.5m²)`}</option>
                        <option value="medium">Medium (0.5m²-1m²)</option>
                        <option value="big">{`Big (>1m²)`}</option>
                      </select>
                    </div>
                  )}
                  {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateItem(type, item.id, 'condition', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="level_1">Level 1: New/Pre-primed</option>
                        <option value="level_2">Level 2: Good Condition</option>
                        <option value="level_3">Level 3: Moderate Wear</option>
                        <option value="level_4">Level 4: Heavy Damage</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPricing?.[type]?.base || defaultPricing[type].base}
                        onChange={(e) => updateItem(type, item.id, 'cost', parseFloat(item.quantity) * parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {getSelectedOptionsDisplay(item, type)}
                </div>
                {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-600">
                      Cost: £{item.cost.toFixed(2)}
                    </div>
                    <button
                      onClick={() => toggleSteps(item.id, type)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {expandedSteps[`${type}_${item.id}`] ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Steps
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Steps
                        </>
                      )}
                    </button>
                  </div>
                )}
                {['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type) && expandedSteps[`${type}_${item.id}`] && (
                  <div className="mt-3 bg-gray-100 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Preparation Steps</h5>
                    <ol className="text-sm text-gray-700 space-y-1">
                      {woodworkConditions[item.condition].steps.map((step, index) => (
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
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interior items added yet</h3>
          <p className="text-gray-500 mb-6">Click the buttons above to add doors, windows, etc.</p>
        </div>
      )}
    </div>
  );
};

export default InteriorWork;