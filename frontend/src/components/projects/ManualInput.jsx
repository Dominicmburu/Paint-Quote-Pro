// import React, { useState, useEffect } from 'react';
// import { Save, Plus, Trash2, Calculator } from 'lucide-react';
// import api from '../../services/api';

// const ManualInput = ({ project, onSave }) => {
//     const [measurements, setMeasurements] = useState({
//         rooms: [],
//         total_area: 0,
//         notes: ''
//     });
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         if (project?.manual_measurements) {
//             setMeasurements(project.manual_measurements);
//         }
//     }, [project]);

//     const addRoom = () => {
//         const newRoom = {
//             id: Date.now(),
//             name: '',
//             walls: [
//                 {
//                     id: Date.now() + 1,
//                     name: 'North Wall',
//                     length: 0,
//                     height: 2.4,
//                     area: 0,
//                     doors: 0,
//                     windows: 0
//                 }
//             ],
//             ceiling: {
//                 area: 0,
//                 height: 2.4
//             },
//             total_wall_area: 0,
//             paint_type: 'interior_standard'
//         };

//         setMeasurements(prev => ({
//             ...prev,
//             rooms: [...prev.rooms, newRoom]
//         }));
//     };

//     const removeRoom = (roomId) => {
//         setMeasurements(prev => ({
//             ...prev,
//             rooms: prev.rooms.filter(room => room.id !== roomId)
//         }));
//         calculateTotals();
//     };

//     const updateRoom = (roomId, field, value) => {
//         setMeasurements(prev => ({
//             ...prev,
//             rooms: prev.rooms.map(room => 
//                 room.id === roomId 
//                     ? { ...room, [field]: value }
//                     : room
//             )
//         }));
//     };

//     const addWall = (roomId) => {
//         const wallNames = ['North Wall', 'South Wall', 'East Wall', 'West Wall'];
//         setMeasurements(prev => ({
//             ...prev,
//             rooms: prev.rooms.map(room => {
//                 if (room.id === roomId) {
//                     const nextWallName = wallNames[room.walls.length] || `Wall ${room.walls.length + 1}`;
//                     const newWall = {
//                         id: Date.now(),
//                         name: nextWallName,
//                         length: 0,
//                         height: 2.4,
//                         area: 0,
//                         doors: 0,
//                         windows: 0
//                     };
//                     return {
//                         ...room,
//                         walls: [...room.walls, newWall]
//                     };
//                 }
//                 return room;
//             })
//         }));
//     };

//     const removeWall = (roomId, wallId) => {
//         setMeasurements(prev => ({
//             ...prev,
//             rooms: prev.rooms.map(room => 
//                 room.id === roomId 
//                     ? { ...room, walls: room.walls.filter(wall => wall.id !== wallId) }
//                     : room
//             )
//         }));
//         calculateTotals();
//     };

//     const updateWall = (roomId, wallId, field, value) => {
//         setMeasurements(prev => ({
//             ...prev,
//             rooms: prev.rooms.map(room => {
//                 if (room.id === roomId) {
//                     return {
//                         ...room,
//                         walls: room.walls.map(wall => {
//                             if (wall.id === wallId) {
//                                 const updatedWall = { ...wall, [field]: parseFloat(value) || 0 };
//                                 // Calculate wall area
//                                 updatedWall.area = updatedWall.length * updatedWall.height;
//                                 return updatedWall;
//                             }
//                             return wall;
//                         })
//                     };
//                 }
//                 return room;
//             })
//         }));
//         calculateTotals();
//     };

//     const calculateTotals = () => {
//         setMeasurements(prev => {
//             const updatedRooms = prev.rooms.map(room => {
//                 const totalWallArea = room.walls.reduce((sum, wall) => sum + (wall.area || 0), 0);
//                 return {
//                     ...room,
//                     total_wall_area: totalWallArea
//                 };
//             });

//             const totalArea = updatedRooms.reduce((sum, room) => {
//                 return sum + room.total_wall_area + (room.ceiling?.area || 0);
//             }, 0);

//             return {
//                 ...prev,
//                 rooms: updatedRooms,
//                 total_area: totalArea
//             };
//         });
//     };

//     const handleSave = async () => {
//         if (!project?.id) return;

//         setLoading(true);
//         setError('');

//         try {
//             await api.post(`/projects/${project.id}/manual-measurements`, measurements);
//             if (onSave) {
//                 onSave();
//             }
//         } catch (err) {
//             setError(err.response?.data?.error || 'Failed to save measurements');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="space-y-6">
//             {error && (
//                 <div className="bg-red-50 border border-red-200 rounded-md p-4">
//                     <p className="text-sm text-red-600">{error}</p>
//                 </div>
//             )}

//             {/* Header */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-medium text-purple-700 flex items-center">
//                         <Calculator className="h-5 w-5 mr-2" />
//                         Manual Measurements
//                     </h3>
//                     <button
//                         onClick={addRoom}
//                         className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
//                     >
//                         <Plus className="h-4 w-4 mr-2" />
//                         Add Room
//                     </button>
//                 </div>

//                 <p className="text-gray-600">
//                     Enter room dimensions manually. This data will be used to calculate paint quantities and costs.
//                 </p>
//             </div>

//             {/* Rooms */}
//             {measurements.rooms.map((room, roomIndex) => (
//                 <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                     <div className="flex items-center justify-between mb-6">
//                         <h4 className="text-lg font-medium text-gray-900">Room {roomIndex + 1}</h4>
//                         <button
//                             onClick={() => removeRoom(room.id)}
//                             className="text-red-600 hover:text-red-700"
//                         >
//                             <Trash2 className="h-4 w-4" />
//                         </button>
//                     </div>

//                     {/* Room Name */}
//                     <div className="mb-6">
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Room Name
//                         </label>
//                         <input
//                             type="text"
//                             value={room.name}
//                             onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                             placeholder="e.g., Kitchen, Living Room, Bedroom 1"
//                         />
//                     </div>

//                     {/* Walls */}
//                     <div className="mb-6">
//                         <div className="flex items-center justify-between mb-4">
//                             <h5 className="text-md font-medium text-gray-900">Walls</h5>
//                             <button
//                                 onClick={() => addWall(room.id)}
//                                 className="inline-flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
//                             >
//                                 <Plus className="h-3 w-3 mr-1" />
//                                 Add Wall
//                             </button>
//                         </div>

//                         <div className="space-y-4">
//                             {room.walls.map((wall) => (
//                                 <div key={wall.id} className="border border-gray-200 rounded-lg p-4">
//                                     <div className="flex items-center justify-between mb-3">
//                                         <input
//                                             type="text"
//                                             value={wall.name}
//                                             onChange={(e) => updateWall(room.id, wall.id, 'name', e.target.value)}
//                                             className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
//                                             placeholder="Wall name"
//                                         />
//                                         <button
//                                             onClick={() => removeWall(room.id, wall.id)}
//                                             className="text-red-600 hover:text-red-700"
//                                         >
//                                             <Trash2 className="h-3 w-3" />
//                                         </button>
//                                     </div>

//                                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//                                         <div>
//                                             <label className="block text-xs font-medium text-gray-700 mb-1">
//                                                 Length (m)
//                                             </label>
//                                             <input
//                                                 type="number"
//                                                 step="0.1"
//                                                 value={wall.length}
//                                                 onChange={(e) => updateWall(room.id, wall.id, 'length', e.target.value)}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-xs font-medium text-gray-700 mb-1">
//                                                 Height (m)
//                                             </label>
//                                             <input
//                                                 type="number"
//                                                 step="0.1"
//                                                 value={wall.height}
//                                                 onChange={(e) => updateWall(room.id, wall.id, 'height', e.target.value)}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-xs font-medium text-gray-700 mb-1">
//                                                 Doors
//                                             </label>
//                                             <input
//                                                 type="number"
//                                                 min="0"
//                                                 value={wall.doors}
//                                                 onChange={(e) => updateWall(room.id, wall.id, 'doors', e.target.value)}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-xs font-medium text-gray-700 mb-1">
//                                                 Windows
//                                             </label>
//                                             <input
//                                                 type="number"
//                                                 min="0"
//                                                 value={wall.windows}
//                                                 onChange={(e) => updateWall(room.id, wall.id, 'windows', e.target.value)}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-xs font-medium text-gray-700 mb-1">
//                                                 Area (m²)
//                                             </label>
//                                             <input
//                                                 type="text"
//                                                 value={wall.area.toFixed(2)}
//                                                 readOnly
//                                                 className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Ceiling */}
//                     <div className="mb-4">
//                         <h5 className="text-md font-medium text-gray-900 mb-3">Ceiling</h5>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Area (m²)
//                                 </label>
//                                 <input
//                                     type="number"
//                                     step="0.1"
//                                     value={room.ceiling?.area || 0}
//                                     onChange={(e) => updateRoom(room.id, 'ceiling', { 
//                                         ...room.ceiling, 
//                                         area: parseFloat(e.target.value) || 0 
//                                     })}
//                                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Paint Type
//                                 </label>
//                                 <select
//                                     value={room.paint_type}
//                                     onChange={(e) => updateRoom(room.id, 'paint_type', e.target.value)}
//                                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                 >
//                                     <option value="interior_standard">Interior Standard</option>
//                                     <option value="kitchen_bathroom">Kitchen/Bathroom</option>
//                                     <option value="exterior">Exterior</option>
//                                     <option value="primer">Primer</option>
//                                 </select>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Room Summary */}
//                     <div className="bg-gray-50 rounded-lg p-4">
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                             <div>
//                                 <span className="font-medium text-gray-700">Total Wall Area:</span>
//                                 <span className="ml-2 text-gray-900">{room.total_wall_area.toFixed(2)} m²</span>
//                             </div>
//                             <div>
//                                 <span className="font-medium text-gray-700">Ceiling Area:</span>
//                                 <span className="ml-2 text-gray-900">{(room.ceiling?.area || 0).toFixed(2)} m²</span>
//                             </div>
//                             <div>
//                                 <span className="font-medium text-gray-700">Total Paintable:</span>
//                                 <span className="ml-2 text-gray-900">{(room.total_wall_area + (room.ceiling?.area || 0)).toFixed(2)} m²</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             ))}

//             {/* Notes */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h4>
//                 <textarea
//                     value={measurements.notes}
//                     onChange={(e) => setMeasurements(prev => ({ ...prev, notes: e.target.value }))}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     rows={4}
//                     placeholder="Any additional notes about the measurements, special requirements, or conditions..."
//                 />
//             </div>

//             {/* Summary & Save */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between">
//                     <div>
//                         <h4 className="text-lg font-medium text-gray-900">Project Summary</h4>
//                         <p className="text-gray-600">
//                             <span className="font-medium">Total Area:</span> {measurements.total_area.toFixed(2)} m²
//                         </p>
//                         <p className="text-gray-600">
//                             <span className="font-medium">Rooms:</span> {measurements.rooms.length}
//                         </p>
//                     </div>
//                     <button
//                         onClick={handleSave}
//                         disabled={loading || measurements.rooms.length === 0}
//                         className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
//                     >
//                         {loading ? (
//                             <>
//                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                                 Saving...
//                             </>
//                         ) : (
//                             <>
//                                 <Save className="h-4 w-4 mr-2" />
//                                 Save Measurements
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </div>

//             {/* Instructions */}
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Measurement Tips:</h4>
//                 <ul className="text-sm text-blue-800 space-y-1">
//                     <li>• Measure walls in meters for best accuracy</li>
//                     <li>• Count doors and windows to deduct from paintable area</li>
//                     <li>• Standard door: ~2m², Standard window: ~1.5m²</li>
//                     <li>• Include ceiling measurements if painting ceilings</li>
//                     <li>• Use "Kitchen/Bathroom" paint type for moisture-prone areas</li>
//                 </ul>
//             </div>
//         </div>
//     );
// };

// export default ManualInput;