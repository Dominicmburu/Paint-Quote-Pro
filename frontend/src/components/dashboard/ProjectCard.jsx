import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, MoreVertical, Edit2, ExternalLink, FileCheck } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import api from '../../services/api';

const ProjectCard = ({ project }) => {
  const [quoteSignature, setQuoteSignature] = useState(null);
  const [loadingSignature, setLoadingSignature] = useState(false);

  // Load quote signature status if project has quotes
  useEffect(() => {
    if (project.quote_data && project.quote_data.quote_id) {
      loadSignatureStatus(project.quote_data.quote_id);
    }
  }, [project.quote_data]);

  const loadSignatureStatus = async (quoteId) => {
    try {
      setLoadingSignature(true);
      const response = await api.get(`/quotes/${quoteId}/signature-status`);
      setQuoteSignature(response.data);
    } catch (error) {
      console.error('Failed to load signature status:', error);
    } finally {
      setLoadingSignature(false);
    }
  };

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

  const getSignatureUrl = () => {
    if (project.quote_data && project.quote_data.quote_id) {
      return `${window.location.origin}/quotes/${project.quote_data.quote_id}/sign`;
    }
    return null;
  };

  const copySignatureLink = async () => {
    const signatureUrl = getSignatureUrl();
    if (signatureUrl) {
      try {
        await navigator.clipboard.writeText(signatureUrl);
        // You could add a toast notification here
        alert('Signature link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link');
      }
    }
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
            <h3 className="text-lg font-semibold text-teal-800 hover:text-teal-900 transition-colors truncate">
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

        {/* Client Info */}
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

      {/* Quote Info with Signature Status */}
      {project.quote_data && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Quote Total:</span>
            <span className="text-lg font-semibold text-teal-600">
              {formatCurrency(project.quote_data.total_amount)}
            </span>
          </div>

          {/* Signature Status */}
          {!loadingSignature && (
            <div className="mt-2">
              {quoteSignature?.is_signed ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <FileCheck className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">Signed</span>
                    {quoteSignature.signature && (
                      <span className="text-gray-500 ml-2">
                        by {quoteSignature.signature.client_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {quoteSignature.signed_at ? formatDate(quoteSignature.signed_at) : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-600 font-medium flex items-center">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Awaiting Signature
                  </span>
                  {/* <button
                    onClick={copySignatureLink}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    title="Copy signature link"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Copy Link
                  </button> */}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Link
            to={`/projects/${project.id}`}
            className="flex-1 text-center px-3 py-2 border border-teal-300 text-teal-800 hover:bg-teal-50 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </Link>

          {/* Quote/Signature Action Button */}
          {/* {project.quote_data && !quoteSignature?.is_signed && (

            <a href={getSignatureUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              title="Open signature link in new tab"
            >
              Get Signature
            </a>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;