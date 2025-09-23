import React, { useEffect, useCallback } from 'react';
import { Plus, Trash2, Square, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';
import { useTranslation } from '../../hooks/useTranslation';

const RoomMeasurements = ({ rooms, setRooms, customPricing }) => {
  const { 
    pricing, 
    loading: pricingLoading, 
    error: pricingError, 
    refreshPricing 
  } = usePricing();
  
  const { t } = useTranslation();

  const addRoom = () => {
    const newRoom = {
      id: Date.now(),
      name: `${t('Room')} ${rooms.length + 1}`,
      type: 'general',
      walls_surface_m2: 0,
      area_m2: 0,
      wall_treatments: {
        sanding_filling: false,
        priming: false,
        one_coat: false,
        two_coats: false
      },
      ceiling_treatments: {
        sanding_filling: false,
        priming: false,
        one_coat: false,
        two_coats: false
      }
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

  const updateRoomArea = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: parseFloat(value) || 0 } : room
    ));
  };

  const toggleWallTreatment = (roomId, treatment) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? {
            ...room,
            wall_treatments: {
              ...room.wall_treatments,
              [treatment]: !room.wall_treatments[treatment]
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
            ceiling_treatments: {
              ...room.ceiling_treatments,
              [treatment]: !room.ceiling_treatments[treatment]
            }
          }
        : room
    ));
  };

  // Get pricing for display
  const getPriceDisplay = (category, type) => {
    try {
      if (!pricing) return '€0.00';
      
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
      
      return `€${price.toFixed(2)}`;
    } catch (error) {
      console.error('Error getting price display:', error);
      return '€0.00';
    }
  };

  // Calculate room cost for display
  const calculateRoomCost = (room) => {
    if (!pricing) return 0;

    let roomTotal = 0;
    const wallArea = parseFloat(room.walls_surface_m2) || 0;
    const ceilingArea = parseFloat(room.area_m2) || 0;

    // Wall treatments
    if (room.wall_treatments) {
      if (room.wall_treatments.sanding_filling) {
        roomTotal += wallArea * (pricing.walls?.sanding?.light?.price || 0);
      }
      if (room.wall_treatments.priming) {
        roomTotal += wallArea * (pricing.walls?.priming?.one_coat?.price || 0);
      }
      if (room.wall_treatments.one_coat) {
        roomTotal += wallArea * (pricing.walls?.painting?.one_coat?.price || 0);
      }
      if (room.wall_treatments.two_coats) {
        roomTotal += wallArea * (pricing.walls?.painting?.two_coat?.price || 0);
      }
    }

    // Ceiling treatments
    if (room.ceiling_treatments && ceilingArea > 0) {
      if (room.ceiling_treatments.sanding_filling) {
        roomTotal += ceilingArea * (pricing.ceiling?.preparation?.light?.price || 0);
      }
      if (room.ceiling_treatments.priming) {
        roomTotal += ceilingArea * (pricing.ceiling?.preparation?.light?.price || 0);
      }
      if (room.ceiling_treatments.one_coat) {
        roomTotal += ceilingArea * (pricing.ceiling?.painting?.one_coat?.price || 0);
      }
      if (room.ceiling_treatments.two_coats) {
        roomTotal += ceilingArea * (pricing.ceiling?.painting?.two_coat?.price || 0);
      }
    }

    return roomTotal;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Square className="h-6 w-6 mr-3 text-teal-800" />
          {t('Room Measurements')}
          <div className="ml-4 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {t('Total wall area approach')}
          </div>
        </h2>
        <div className="flex items-center space-x-4">
          {pricingLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {t('Loading pricing...')}
            </div>
          )}
          <button
            onClick={addRoom}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Add Room')}
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

      {/* Total Wall Area Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex items-center text-sm text-blue-800">
          <Square className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">{t('Total Wall Area Approach')}</p>
            <p>{t('Enter the total wall surface area (m²) and ceiling area (m²) for each room, then select treatments.')}</p>
          </div>
        </div>
      </div>

      {/* Current Pricing Display */}
      {pricing && !pricingLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Current Pricing (per m²)')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-medium text-gray-800">{t('Walls:')}</span>
              <div className="text-gray-600">
                {t('Sanding/Filling:')} {getPriceDisplay('walls', 'sanding_filling')}<br />
                {t('Priming:')} {getPriceDisplay('walls', 'priming')}<br />
                {t('1 Coat:')} {getPriceDisplay('walls', 'one_coat')}<br />
                {t('2 Coats:')} {getPriceDisplay('walls', 'two_coats')}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-800">{t('Ceiling:')}</span>
              <div className="text-gray-600">
                {t('Sanding/Filling:')} {getPriceDisplay('ceiling', 'sanding_filling')}<br />
                {t('Priming:')} {getPriceDisplay('ceiling', 'priming')}<br />
                {t('1 Coat:')} {getPriceDisplay('ceiling', 'one_coat')}<br />
                {t('2 Coats:')} {getPriceDisplay('ceiling', 'two_coats')}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-700">
                {t('Pricing loaded • Real-time calculation enabled')}
              </span>
            </div>
          </div>
        </div>
      )}

      {rooms.map((room) => (
        <div key={room.id} className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={room.name}
                onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                placeholder={t('Room Name')}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{t('Room Total')}</div>
                <div className="text-lg font-bold text-teal-600">
                  €{calculateRoomCost(room).toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => removeRoom(room.id)}
                className="text-red-600 hover:text-red-700"
                title={t('Remove Room')}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Room Areas Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Square className="h-5 w-5 mr-2 text-blue-600" />
                {t('Total Wall Area')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Total Wall Surface (m²)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={room.walls_surface_m2 || ''}
                    onChange={(e) => updateRoomArea(room.id, 'walls_surface_m2', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('Total wall surface area for all walls in this room')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2 text-green-600" />
                {t('Ceiling Area')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Ceiling Area (m²)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={room.area_m2 || ''}
                    onChange={(e) => updateRoomArea(room.id, 'area_m2', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('Ceiling area (same as floor area)')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wall Treatments Section */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Square className="h-5 w-5 mr-2 text-blue-600" />
              {t('Wall Treatments')}
              <span className="ml-2 text-sm text-gray-500">
                ({(parseFloat(room.walls_surface_m2) || 0).toFixed(1)}m²)
              </span>
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.wall_treatments?.sanding_filling || false}
                    onChange={() => toggleWallTreatment(room.id, 'sanding_filling')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('Sanding/Filling')}</div>
                    <div className="text-gray-600">{getPriceDisplay('walls', 'sanding_filling')}/m²</div>
                    {room.wall_treatments?.sanding_filling && (
                      <div className="text-blue-600 font-medium">
                        €{((parseFloat(room.walls_surface_m2) || 0) * (pricing?.walls?.sanding?.light?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.wall_treatments?.priming || false}
                    onChange={() => toggleWallTreatment(room.id, 'priming')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('Priming')}</div>
                    <div className="text-gray-600">{getPriceDisplay('walls', 'priming')}/m²</div>
                    {room.wall_treatments?.priming && (
                      <div className="text-blue-600 font-medium">
                        €{((parseFloat(room.walls_surface_m2) || 0) * (pricing?.walls?.priming?.one_coat?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.wall_treatments?.one_coat || false}
                    onChange={() => toggleWallTreatment(room.id, 'one_coat')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('1 Coat Paint')}</div>
                    <div className="text-gray-600">{getPriceDisplay('walls', 'one_coat')}/m²</div>
                    {room.wall_treatments?.one_coat && (
                      <div className="text-blue-600 font-medium">
                        €{((parseFloat(room.walls_surface_m2) || 0) * (pricing?.walls?.painting?.one_coat?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.wall_treatments?.two_coats || false}
                    onChange={() => toggleWallTreatment(room.id, 'two_coats')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('2 Coats Paint')}</div>
                    <div className="text-gray-600">{getPriceDisplay('walls', 'two_coats')}/m²</div>
                    {room.wall_treatments?.two_coats && (
                      <div className="text-blue-600 font-medium">
                        €{((parseFloat(room.walls_surface_m2) || 0) * (pricing?.walls?.painting?.two_coat?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Ceiling Treatments Section */}
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-green-600" />
              {t('Ceiling Treatments')}
              <span className="ml-2 text-sm text-gray-500">
                ({(parseFloat(room.area_m2) || 0).toFixed(1)}m²)
              </span>
            </h4>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.ceiling_treatments?.sanding_filling || false}
                    onChange={() => toggleCeilingTreatment(room.id, 'sanding_filling')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('Sanding/Filling')}</div>
                    <div className="text-gray-600">{getPriceDisplay('ceiling', 'sanding_filling')}/m²</div>
                    {room.ceiling_treatments?.sanding_filling && (
                      <div className="text-green-600 font-medium">
                        €{((parseFloat(room.area_m2) || 0) * (pricing?.ceiling?.preparation?.light?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.ceiling_treatments?.priming || false}
                    onChange={() => toggleCeilingTreatment(room.id, 'priming')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('Priming')}</div>
                    <div className="text-gray-600">{getPriceDisplay('ceiling', 'priming')}/m²</div>
                    {room.ceiling_treatments?.priming && (
                      <div className="text-green-600 font-medium">
                        €{((parseFloat(room.area_m2) || 0) * (pricing?.ceiling?.preparation?.light?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.ceiling_treatments?.one_coat || false}
                    onChange={() => toggleCeilingTreatment(room.id, 'one_coat')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('1 Coat Paint')}</div>
                    <div className="text-gray-600">{getPriceDisplay('ceiling', 'one_coat')}/m²</div>
                    {room.ceiling_treatments?.one_coat && (
                      <div className="text-green-600 font-medium">
                        €{((parseFloat(room.area_m2) || 0) * (pricing?.ceiling?.painting?.one_coat?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={room.ceiling_treatments?.two_coats || false}
                    onChange={() => toggleCeilingTreatment(room.id, 'two_coats')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{t('2 Coats Paint')}</div>
                    <div className="text-gray-600">{getPriceDisplay('ceiling', 'two_coats')}/m²</div>
                    {room.ceiling_treatments?.two_coats && (
                      <div className="text-green-600 font-medium">
                        €{((parseFloat(room.area_m2) || 0) * (pricing?.ceiling?.painting?.two_coat?.price || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Square className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No rooms added yet')}</h3>
          <p className="text-gray-500 mb-6">
            {t('Add rooms manually or they will be populated from AI analysis with total wall areas. Each room will show total wall surface area and ceiling area.')}
          </p>
          <button
            onClick={addRoom}
            className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('Add First Room')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomMeasurements;