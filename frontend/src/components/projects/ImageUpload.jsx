// import React, { useState, useCallback } from 'react';
// import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
// import api from '../../services/api';

// const ImageUpload = ({ projectId, project, onUploadComplete }) => {
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [error, setError] = useState('');
//   const [dragActive, setDragActive] = useState(false);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     setDragActive(false);
    
//     const files = Array.from(e.dataTransfer.files);
//     handleFiles(files);
//   }, []);

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     setDragActive(true);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     e.preventDefault();
//     setDragActive(false);
//   }, []);

//   const handleFileSelect = (e) => {
//     const files = Array.from(e.target.files);
//     handleFiles(files);
//   };

//   const handleFiles = async (files) => {
//     if (files.length === 0) return;

//     // Validate file types
//     const validFiles = files.filter(file => {
//       const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf'];
//       return validTypes.includes(file.type);
//     });

//     if (validFiles.length !== files.length) {
//       setError('Some files were skipped. Only image files and PDFs are allowed.');
//     }

//     if (validFiles.length === 0) {
//       setError('No valid files selected. Please select image files or PDFs.');
//       return;
//     }

//     // Check file sizes
//     const oversizedFiles = validFiles.filter(file => file.size > 32 * 1024 * 1024);
//     if (oversizedFiles.length > 0) {
//       setError('Some files are too large. Maximum file size is 32MB.');
//       return;
//     }

//     await uploadFiles(validFiles);
//   };

//   const uploadFiles = async (files) => {
//     setUploading(true);
//     setError('');
//     setUploadProgress(0);

//     try {
//       const formData = new FormData();
//       files.forEach(file => {
//         formData.append('files', file);
//       });

//       const response = await api.post(`/projects/${projectId}/upload`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           setUploadProgress(progress);
//         },
//       });

//       if (onUploadComplete) {
//         onUploadComplete();
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to upload files');
//     } finally {
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const removeImage = async (imagePath) => {
//     try {
//       await api.delete(`/projects/${projectId}/files/${encodeURIComponent(imagePath)}`);
//       if (onUploadComplete) {
//         onUploadComplete();
//       }
//     } catch (err) {
//       setError('Failed to remove image');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Upload Area */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         <h3 className="text-lg font-medium text-purple-700 mb-4">Upload Floor Plans & Images</h3>
        
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
//             <div className="flex items-center">
//               <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
//               <p className="text-sm text-red-600">{error}</p>
//             </div>
//           </div>
//         )}

//         <div
//           className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
//             dragActive 
//               ? 'border-purple-400 bg-purple-50' 
//               : 'border-gray-300 hover:border-gray-400'
//           }`}
//           onDrop={handleDrop}
//           onDragOver={handleDragOver}
//           onDragLeave={handleDragLeave}
//         >
//           <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//           <p className="text-lg font-medium text-gray-900 mb-2">
//             Drop your files here, or click to browse
//           </p>
//           <p className="text-sm text-gray-500 mb-4">
//             Supports: PNG, JPG, GIF, BMP, TIFF, PDF (max 32MB each)
//           </p>
          
//           <input
//             type="file"
//             multiple
//             accept="image/*,.pdf"
//             onChange={handleFileSelect}
//             className="hidden"
//             id="file-upload"
//             disabled={uploading}
//           />
          
//           <label
//             htmlFor="file-upload"
//             className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:opacity-50"
//           >
//             Choose Files
//           </label>
//         </div>

//         {uploading && (
//           <div className="mt-4">
//             <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
//               <span>Uploading...</span>
//               <span>{uploadProgress}%</span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2">
//               <div 
//                 className="bg-purple-600 h-2 rounded-full transition-all duration-300"
//                 style={{ width: `${uploadProgress}%` }}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Uploaded Images */}
//       {project?.uploaded_images && project.uploaded_images.length > 0 && (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-medium text-purple-700 mb-4">Uploaded Files</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {project.uploaded_images.map((imagePath, index) => (
//               <div key={index} className="relative group">
//                 <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
//                   <img
//                     src={`/api/projects/${projectId}/files/${encodeURIComponent(imagePath)}`}
//                     alt={`Upload ${index + 1}`}
//                     className="w-full h-full object-cover"
//                     onError={(e) => {
//                       e.target.style.display = 'none';
//                       e.target.nextSibling.style.display = 'flex';
//                     }}
//                   />
//                   <div className="hidden w-full h-full items-center justify-center">
//                     <FileImage className="h-8 w-8 text-gray-400" />
//                   </div>
//                 </div>
                
//                 <button
//                   onClick={() => removeImage(imagePath)}
//                   className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
                
//                 <p className="mt-2 text-sm text-gray-600 truncate">
//                   {imagePath.split('/').pop()}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Instructions */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</h4>
//         <ul className="text-sm text-blue-800 space-y-1">
//           <li>• Upload clear, high-resolution floor plans</li>
//           <li>• Ensure all room labels and measurements are visible</li>
//           <li>• Multiple angles and views can improve AI analysis</li>
//           <li>• Hand-drawn sketches work too!</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default ImageUpload;