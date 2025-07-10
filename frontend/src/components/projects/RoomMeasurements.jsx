import React, { useEffect, useCallback } from 'react';
import { Plus, Trash2, Square, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';

const RoomMeasurements = ({ rooms, setRooms, onCostChange }) => {
  const { 
    pricing, 
    loading: pricingLoading, 
    error: pricingError, 
    getRoomPricing,
    refreshPricing 
  } = usePricing();

  // Calculate total cost whenever rooms or pricing changes
  const calculateTotalCost = useCallback(() => {
    if (!pricing?.walls || !pricing?.ceiling) {
      console.log('⚠️ Pricing not loaded yet, skipping cost calculation');
      onCostChange(0);
      return;
    }

    let total = 0;
    
    try {
      console.log('🔍 Database pricing structure:', pricing);
      
      rooms.forEach(room => {
        // Calculate wall costs
        (room.walls || []).forEach(wall => {
          const area = parseFloat(wall.area) || 0;
          
          if (wall.sanding_filling) {
            // Use light sanding as default for sanding/filling
            const price = pricing.walls?.sanding?.light?.price || 0;
            total += area * price;
            console.log(`Wall sanding/filling: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (wall.priming) {
            // Use single coat priming as default
            const price = pricing.walls?.priming?.one_coat?.price || 0;
            total += area * price;
            console.log(`Wall priming: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (wall.one_coat) {
            // Use single coat painting
            const price = pricing.walls?.painting?.one_coat?.price || 0;
            total += area * price;
            console.log(`Wall 1 coat: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (wall.two_coats) {
            // Use double coat painting
            const price = pricing.walls?.painting?.two_coat?.price || 0;
            total += area * price;
            console.log(`Wall 2 coats: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
        });

        // Calculate ceiling costs
        if (room.ceiling) {
          const area = parseFloat(room.ceiling.area) || 0;
          
          if (room.ceiling.sanding_filling) {
            // Use light preparation as default for sanding/filling
            const price = pricing.ceiling?.preparation?.light?.price || 0;
            total += area * price;
            console.log(`Ceiling sanding/filling: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (room.ceiling.priming) {
            // For ceiling priming, we'll use light preparation price as there's no separate priming
            const price = pricing.ceiling?.preparation?.light?.price || 0;
            total += area * price;
            console.log(`Ceiling priming: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (room.ceiling.one_coat) {
            // Use single coat ceiling painting
            const price = pricing.ceiling?.painting?.one_coat?.price || 0;
            total += area * price;
            console.log(`Ceiling 1 coat: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
          if (room.ceiling.two_coats) {
            // Use double coat ceiling painting
            const price = pricing.ceiling?.painting?.two_coat?.price || 0;
            total += area * price;
            console.log(`Ceiling 2 coats: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
          }
        }
      });

      // Ensure total is a valid number
      if (isNaN(total) || !isFinite(total)) {
        console.warn('⚠️ Total calculated as NaN or infinite, setting to 0');
        total = 0;
      }

      console.log('💰 Room measurements total cost calculated:', total.toFixed(2));
      onCostChange(total);
    } catch (error) {
      console.error('❌ Error calculating room costs:', error);
      onCostChange(0);
    }
  }, [rooms, pricing, onCostChange]);

  // Recalculate costs when rooms or pricing changes
  useEffect(() => {
    calculateTotalCost();
  }, [calculateTotalCost]);

  const addRoom = () => {
    const newRoom = {
      id: Date.now(),
      name: `Room ${rooms.length + 1}`,
      walls: [],
      ceiling: null
    };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const removeRoom = (roomId) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const addWallToRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            walls: [...(room.walls || []), {
              id: Date.now(),
              length: 0,
              height: 2.4,
              area: 0,
              sanding_filling: false,
              priming: false,
              one_coat: false,
              two_coats: false
            }]
          }
        : room
    ));
  };

  const updateWallInRoom = (roomId, wallId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? {
            ...room,
            walls: (room.walls || []).map(wall => {
              if (wall.id === wallId) {
                const updated = { ...wall, [field]: value };
                if (field === 'length' || field === 'height') {
                  const length = parseFloat(field === 'length' ? value : updated.length) || 0;
                  const height = parseFloat(field === 'height' ? value : updated.height) || 0;
                  updated.area = (length * height).toFixed(2);
                }
                return updated;
              }
              return wall;
            })
          }
        : room
    ));
  };

  const toggleWallTreatment = (roomId, wallId, treatment) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? {
            ...room,
            walls: (room.walls || []).map(wall => 
              wall.id === wallId ? { ...wall, [treatment]: !wall[treatment] } : wall
            )
          }
        : room
    ));
  };

  const removeWallFromRoom = (roomId, wallId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, walls: (room.walls || []).filter(wall => wall.id !== wallId) }
        : room
    ));
  };

  const addCeilingToRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            ceiling: {
              width: 0,
              length: 0,
              area: 0,
              sanding_filling: false,
              priming: false,
              one_coat: false,
              two_coats: false
            }
          }
        : room
    ));
  };

  const updateCeilingInRoom = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            ceiling: { 
              ...room.ceiling, 
              [field]: value,
              area: field === 'width' || field === 'length' ? 
                ((field === 'width' ? parseFloat(value) : parseFloat(room.ceiling.width)) || 0) * 
                ((field === 'length' ? parseFloat(value) : parseFloat(room.ceiling.length)) || 0) :
                room.ceiling.area
            }
          }
        : room
    ));
  };

  const toggleCeilingTreatment = (roomId, treatment) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            ceiling: { 
              ...room.ceiling, 
              [treatment]: !room.ceiling[treatment]
            }
          }
        : room
    ));
  };

  const removeCeilingFromRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, ceiling: null } : room
    ));
  };

  // Get pricing for display
  const getPriceDisplay = (category, type) => {
    try {
      if (!pricing) return '£0.00';
      
      let price = 0;
      
      if (category === 'walls') {
        switch (type) {
          case 'sanding_filling':
            price = pricing.walls?.sanding?.light?.price || 0;
            break;
          case 'priming':
            price = pricing.walls?.priming?.one_coat?.price || 0;
            break;
          case 'one_coat':
            price = pricing.walls?.painting?.one_coat?.price || 0;
            break;
          case 'two_coats':
            price = pricing.walls?.painting?.two_coat?.price || 0;
            break;
          default:
            price = 0;
        }
      } else if (category === 'ceiling') {
        switch (type) {
          case 'sanding_filling':
            price = pricing.ceiling?.preparation?.light?.price || 0;
            break;
          case 'priming':
            price = pricing.ceiling?.preparation?.light?.price || 0;
            break;
          case 'one_coat':
            price = pricing.ceiling?.painting?.one_coat?.price || 0;
            break;
          case 'two_coats':
            price = pricing.ceiling?.painting?.two_coat?.price || 0;
            break;
          default:
            price = 0;
        }
      }
      
      return `£${price.toFixed(2)}`;
    } catch (error) {
      console.error('Error getting price display:', error);
      return '£0.00';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Square className="h-6 w-6 mr-3 text-teal-800" />
          Room Measurements
        </h2>
        <div className="flex items-center space-x-4">
          {pricingLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading pricing...
            </div>
          )}
          <button
            onClick={addRoom}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </button>
        </div>
      </div>

      {/* Pricing Error Alert */}
      {pricingError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Pricing Error</p>
                <p className="text-sm text-yellow-600">{pricingError}</p>
              </div>
            </div>
            <button
              onClick={refreshPricing}
              className="text-yellow-600 hover:text-yellow-700"
              title="Retry loading pricing"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Pricing Display */}
      {pricing && !pricingLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Pricing (per m²)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-medium text-blue-800">Walls:</span>
              <div className="text-blue-600">
                Sanding/Filling: {getPriceDisplay('walls', 'sanding_filling')}<br />
                Priming: {getPriceDisplay('walls', 'priming')}<br />
                1 Coat: {getPriceDisplay('walls', 'one_coat')}<br />
                2 Coats: {getPriceDisplay('walls', 'two_coats')}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Ceiling:</span>
              <div className="text-blue-600">
                Sanding/Filling: {getPriceDisplay('ceiling', 'sanding_filling')}<br />
                Priming: {getPriceDisplay('ceiling', 'priming')}<br />
                1 Coat: {getPriceDisplay('ceiling', 'one_coat')}<br />
                2 Coats: {getPriceDisplay('ceiling', 'two_coats')}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-blue-700">
                Pricing loaded from database • Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {rooms.map((room) => (
        <div key={room.id} className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={room.name}
              onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
            />
            <button
              onClick={() => removeRoom(room.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* Walls Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Square className="h-5 w-5 mr-2 text-blue-600" />
                Walls
              </h4>
              <button
                onClick={() => addWallToRoom(room.id)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                + Add Wall
              </button>
            </div>

            {(room.walls || []).map((wall, index) => (
              <div key={wall.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wall.length || ''}
                      onChange={(e) => updateWallInRoom(room.id, wall.id, 'length', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wall.height || ''}
                      onChange={(e) => updateWallInRoom(room.id, wall.id, 'height', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                    <input
                      type="text"
                      value={wall.area || '0.00'}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatments</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={wall.sanding_filling}
                          onChange={() => toggleWallTreatment(room.id, wall.id, 'sanding_filling')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          Sanding/Filling {getPriceDisplay('walls', 'sanding_filling')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={wall.priming}
                          onChange={() => toggleWallTreatment(room.id, wall.id, 'priming')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          Priming {getPriceDisplay('walls', 'priming')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={wall.one_coat}
                          onChange={() => toggleWallTreatment(room.id, wall.id, 'one_coat')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          1 Coat {getPriceDisplay('walls', 'one_coat')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={wall.two_coats}
                          onChange={() => toggleWallTreatment(room.id, wall.id, 'two_coats')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          2 Coats {getPriceDisplay('walls', 'two_coats')}
                        </span>
                      </label>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {[
                        wall.sanding_filling && 'Sanding/Filling',
                        wall.priming && 'Priming',
                        wall.one_coat && '1 Coat',
                        wall.two_coats && '2 Coats'
                      ].filter(Boolean).join(', ') || 'None'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => removeWallFromRoom(room.id, wall.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Ceiling Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-green-600" />
                Ceiling
              </h4>
              {!room.ceiling ? (
                <button
                  onClick={() => addCeilingToRoom(room.id)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  + Add Ceiling
                </button>
              ) : (
                <button
                  onClick={() => removeCeilingFromRoom(room.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove Ceiling
                </button>
              )}
            </div>

            {room.ceiling && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={room.ceiling.width || ''}
                      onChange={(e) => updateCeilingInRoom(room.id, 'width', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={room.ceiling.length || ''}
                      onChange={(e) => updateCeilingInRoom(room.id, 'length', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                    <input
                      type="text"
                      value={(parseFloat(room.ceiling.width) * parseFloat(room.ceiling.length) || 0).toFixed(2)}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatments</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={room.ceiling.sanding_filling}
                          onChange={() => toggleCeilingTreatment(room.id, 'sanding_filling')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          Sanding/Filling {getPriceDisplay('ceiling', 'sanding_filling')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={room.ceiling.priming}
                          onChange={() => toggleCeilingTreatment(room.id, 'priming')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          Priming {getPriceDisplay('ceiling', 'priming')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={room.ceiling.one_coat}
                          onChange={() => toggleCeilingTreatment(room.id, 'one_coat')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          1 Coat {getPriceDisplay('ceiling', 'one_coat')}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={room.ceiling.two_coats}
                          onChange={() => toggleCeilingTreatment(room.id, 'two_coats')}
                          className="mr-2"
                        />
                        <span className="text-xs">
                          2 Coats {getPriceDisplay('ceiling', 'two_coats')}
                        </span>
                      </label>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {[
                        room.ceiling.sanding_filling && 'Sanding/Filling',
                        room.ceiling.priming && 'Priming',
                        room.ceiling.one_coat && '1 Coat',
                        room.ceiling.two_coats && '2 Coats'
                      ].filter(Boolean).join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Square className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms added yet</h3>
          <p className="text-gray-500 mb-6">
            Add rooms manually or they will be populated from AI analysis
          </p>
          <button
            onClick={addRoom}
            className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomMeasurements;