// components/projects/FloorPlanUpload.jsx
import React, { useState } from 'react';
import { Upload, FileImage, X, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

const FloorPlanUpload = ({ 
  projectId, 
  uploadedImages, 
  onFileUpload, 
  uploading, 
  uploadProgress = 0,
  hasExistingData = false, // New prop to indicate if there's existing room data
  onDataOverwriteWarning // New prop to handle overwrite warnings
}) => {
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // If there's existing data, show warning first
      if (hasExistingData && uploadedImages.length > 0) {
        setPendingFiles(files);
        setShowOverwriteWarning(true);
      } else {
        // No existing data, upload directly
        onFileUpload(files);
      }
    }
  };

  const handleConfirmOverwrite = () => {
    if (pendingFiles) {
      onFileUpload(pendingFiles);
      setPendingFiles(null);
    }
    setShowOverwriteWarning(false);
    if (onDataOverwriteWarning) {
      onDataOverwriteWarning(true);
    }
  };

  const handleCancelOverwrite = () => {
    setPendingFiles(null);
    setShowOverwriteWarning(false);
    // Reset file input
    const fileInput = document.getElementById('floor-plan-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    // This would need to be implemented in the parent component
    // For now, we'll just show a message
    console.log(`Remove image at index ${indexToRemove}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Floor Plan Upload</h3>

      {/* Overwrite Warning Modal */}
      {showOverwriteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Replace Existing Analysis?</h4>
            </div>
            <p className="text-gray-600 mb-6">
              You have existing room measurements and analysis data. Uploading new floor plans and running AI analysis will completely replace your current data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmOverwrite}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                Replace Data
              </button>
              <button
                onClick={handleCancelOverwrite}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Overwrite Warning */}
      {hasExistingData && uploadedImages.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Existing Data Will Be Replaced
              </p>
              <p className="text-sm text-orange-600">
                New floor plan uploads will overwrite existing room measurements when analyzed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {uploadedImages.length > 0 ? 'Replace Floor Plans' : 'Upload Floor Plans'}
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Drop your floor plan images here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Supports: PNG, JPG, PDF (max 32MB each)
        </p>
        
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
          id="floor-plan-upload"
          disabled={uploading}
        />
        
        <label
          htmlFor="floor-plan-upload"
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white cursor-pointer transition-colors ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : uploadedImages.length > 0 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {uploading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : uploadedImages.length > 0 ? (
            'Replace Files'
          ) : (
            'Choose Files'
          )}
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Uploaded Images ({uploadedImages.length})
            </h4>
            {hasExistingData && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Ready for fresh analysis
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((imagePath, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={`/api/projects/${projectId}/files/${imagePath.split('/').pop()}`}
                    alt={`Floor Plan ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <div class="text-center">
                            <svg class="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-xs text-gray-500">Image unavailable</p>
                          </div>
                        </div>
                      `;
                    }}
                  />
                </div>
                
                {/* Image Actions */}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    Floor Plan {index + 1}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(`/api/projects/${projectId}/files/${imagePath.split('/').pop()}`, '_blank')}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      title="View full size"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    {/* Optional: Add remove button
                    <button
                      onClick={() => removeImage(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Analysis Prompt */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileImage className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Ready for AI Analysis
                </p>
                <p className="text-sm text-blue-600">
                  {hasExistingData 
                    ? 'Run AI analysis to replace current room data with fresh measurements from these floor plans.'
                    : 'Run AI analysis to automatically detect rooms, walls, and ceilings from your floor plans.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {uploadedImages.length === 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Upload Tips:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use clear, high-resolution floor plan images</li>
            <li>• Ensure room labels and dimensions are visible</li>
            <li>• Multiple views can improve analysis accuracy</li>
            <li>• PDF files are supported for architectural drawings</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FloorPlanUpload;