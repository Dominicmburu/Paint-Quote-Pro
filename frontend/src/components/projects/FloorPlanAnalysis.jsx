// import React, { useState } from 'react';
// import { Brain, Play, Download, Eye, RefreshCw } from 'lucide-react';

// const FloorPlanAnalysis = ({ project, onAnalyze, loading }) => {
//   const [showDetails, setShowDetails] = useState(false);

//   const analysis = project?.floor_plan_analysis;
//   const hasImages = project?.uploaded_images && project.uploaded_images.length > 0;

//   const renderAnalysisResults = () => {
//     if (!analysis) return null;

//     const surfaceAreas = analysis.surface_areas;
//     const totals = surfaceAreas?.totals || {};
//     const rooms = surfaceAreas?.rooms || {};

//     return (
//       <div className="space-y-6">
//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//             <h4 className="text-sm font-medium text-purple-700">Total Floor Area</h4>
//             <p className="text-2xl font-bold text-purple-900">{totals.total_floor_area_m2 || 0} m²</p>
//           </div>
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//             <h4 className="text-sm font-medium text-green-700">Total Wall Area</h4>
//             <p className="text-2xl font-bold text-green-900">{totals.total_wall_area_m2 || 0} m²</p>
//           </div>
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <h4 className="text-sm font-medium text-blue-700">Total Ceiling Area</h4>
//             <p className="text-2xl font-bold text-blue-900">{totals.total_ceiling_area_m2 || 0} m²</p>
//           </div>
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//             <h4 className="text-sm font-medium text-yellow-700">Rooms Detected</h4>
//             <p className="text-2xl font-bold text-yellow-900">{totals.total_rooms || 0}</p>
//           </div>
//         </div>

//         {/* Room Breakdown */}
//         {Object.keys(rooms).length > 0 && (
//           <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
//             <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
//               <h4 className="text-lg font-medium text-gray-900">Room-by-Room Breakdown</h4>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Room
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Floor Area
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Wall Area
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Ceiling Area
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Perimeter
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {Object.entries(rooms).map(([roomName, roomData]) => (
//                     <tr key={roomName}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {roomName}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {roomData.floor_area_m2} m²
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {roomData.wall_area_m2} m²
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {roomData.ceiling_area_m2} m²
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {roomData.perimeter_m} m
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Technical Details */}
//         <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//           <button
//             onClick={() => setShowDetails(!showDetails)}
//             className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
//           >
//             <Eye className="h-4 w-4 mr-2" />
//             {showDetails ? 'Hide' : 'Show'} Technical Details
//           </button>
          
//           {showDetails && (
//             <div className="mt-4 space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <span className="font-medium text-gray-700">Analysis ID:</span>
//                   <span className="ml-2 text-gray-600">{analysis.analysis_id}</span>
//                 </div>
//                 <div>
//                   <span className="font-medium text-gray-700">Timestamp:</span>
//                   <span className="ml-2 text-gray-600">
//                     {new Date(analysis.timestamp).toLocaleString()}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="font-medium text-gray-700">Scale Factor:</span>
//                   <span className="ml-2 text-gray-600">{analysis.scale_factor || 'N/A'}</span>
//                 </div>
//                 <div>
//                   <span className="font-medium text-gray-700">Wall Height:</span>
//                   <span className="ml-2 text-gray-600">
//                     {analysis.constants?.wall_height_m || 2.4}m
//                   </span>
//                 </div>
//               </div>

//               {analysis.gpt_analysis && (
//                 <div>
//                   <h5 className="font-medium text-gray-700 mb-2">AI Analysis Notes:</h5>
//                   <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-600 max-h-40 overflow-y-auto">
//                     {analysis.gpt_analysis.full_analysis || 'No detailed analysis available'}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Download Reports */}
//         <div className="flex space-x-4">
//           <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors">
//             <Download className="h-4 w-4 mr-2" />
//             Download Analysis Report
//           </button>
//           <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors">
//             <Download className="h-4 w-4 mr-2" />
//             Download Surface Area Report
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Analysis Header */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-purple-700 flex items-center">
//             <Brain className="h-5 w-5 mr-2" />
//             AI Floor Plan Analysis
//           </h3>
          
//           {analysis && (
//             <button
//               onClick={onAnalyze}
//               disabled={loading || !hasImages}
//               className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
//             >
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Re-analyze
//             </button>
//           )}
//         </div>

//         {!hasImages ? (
//           <div className="text-center py-8">
//             <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//             <h4 className="text-lg font-medium text-gray-900 mb-2">No Images Uploaded</h4>
//             <p className="text-gray-500 mb-4">
//               Upload floor plan images first to enable AI analysis.
//             </p>
//           </div>
//         ) : !analysis ? (
//           <div className="text-center py-8">
//             <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//             <h4 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h4>
//             <p className="text-gray-500 mb-4">
//               Start AI analysis to automatically calculate surface areas and identify rooms.
//             </p>
//             <button
//               onClick={onAnalyze}
//               disabled={loading}
//               className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
//             >
//               {loading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                   Analyzing...
//                 </>
//               ) : (
//                 <>
//                   <Play className="h-5 w-5 mr-2" />
//                   Start Analysis
//                 </>
//               )}
//             </button>
//           </div>
//         ) : (
//           <div className="text-green-600 flex items-center">
//             <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//             Analysis completed successfully
//           </div>
//         )}
//       </div>

//       {/* Analysis Results */}
//       {analysis && (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-medium text-purple-700 mb-6">Analysis Results</h3>
//           {renderAnalysisResults()}
//         </div>
//       )}

//       {/* Analysis Info */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <h4 className="text-sm font-medium text-blue-900 mb-2">About AI Analysis</h4>
//         <ul className="text-sm text-blue-800 space-y-1">
//           <li>• Uses advanced computer vision to identify rooms and calculate areas</li>
//           <li>• Automatically detects walls, doors, and windows</li>
//           <li>• Provides room-by-room surface area breakdowns</li>
//           <li>• Calculates floor, wall, and ceiling areas separately</li>
//           <li>• Works with hand-drawn sketches and digital floor plans</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default FloorPlanAnalysis;