// components/projects/ProjectInfoForm.jsx
import React from 'react';
import { FileText, Home, Building } from 'lucide-react';

const ProjectInfoForm = ({ projectData, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-purple-600" />
        Project Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name *
          </label>
          <input
            type="text"
            value={projectData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Kitchen Renovation - Smith House"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            value={projectData.project_type || 'interior'}
            onChange={(e) => handleChange('project_type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="interior">Interior</option>
            <option value="exterior">Exterior</option>
            <option value="both">Interior & Exterior</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type *
          </label>
          <select
            value={projectData.property_type || 'residential'}
            onChange={(e) => handleChange('property_type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="residential">
              {/* <Home className="inline h-4 w-4 mr-2" /> */}
              Residential
            </option>
            <option value="commercial">
              {/* <Building className="inline h-4 w-4 mr-2" /> */}
              Commercial
            </option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            value={projectData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Brief description of the painting project, rooms involved, special requirements, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Address *
          </label>
          <textarea
            value={projectData.property_address || ''}
            onChange={(e) => handleChange('property_address', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="123 High Street, London, SW1A 1AA"
          />
          {errors.property_address && <p className="text-red-500 text-xs mt-1">{errors.property_address}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoForm;