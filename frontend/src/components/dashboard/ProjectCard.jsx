import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, MoreVertical } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/helpers';

const ProjectCard = ({ project }) => {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      analyzing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      quoted: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <FileText className="h-4 w-4" />,
      analyzing: <Clock className="h-4 w-4 animate-spin" />,
      ready: <CheckCircle className="h-4 w-4" />,
      quoted: <FileText className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />
    };
    return icons[status] || <FileText className="h-4 w-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <Link 
            to={`/projects/${project.id}`}
            className="flex-1"
          >
            <h3 className="text-lg font-semibold text-purple-700 hover:text-purple-800 transition-colors truncate">
              {project.name}
            </h3>
          </Link>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusIcon(project.status)}
              <span className="capitalize">{project.status}</span>
            </span>
            
            <button className="text-gray-400 hover:text-gray-500">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Project Details */}
        {project.client_name && (
          <p className="text-gray-600 mb-2">
            <span className="font-medium">Client:</span> {project.client_name}
          </p>
        )}

        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Project Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {project.project_type} • {project.property_type}
          </span>
          <span>
            {formatDate(project.created_at)}
          </span>
        </div>
      </div>

      {/* Quote Info */}
      {project.quote_data && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Quote Total:</span>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(project.quote_data.total_amount)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Link
            to={`/projects/${project.id}`}
            className="flex-1 text-center px-3 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </Link>
          
          {project.status === 'ready' && (
            <Link
              to={`/projects/${project.id}/quote`}
              className="flex-1 text-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Create Quote
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;