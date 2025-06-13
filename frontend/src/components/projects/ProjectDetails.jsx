import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Upload, 
  Download, 
  FileText, 
  Brain, 
  Calculator,
  Trash2,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import ImageUpload from './ImageUpload';
import FloorPlanAnalysis from './FloorPlanAnalysis';
import ManualInput from './ManualInput';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.project);
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFloorPlan = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/projects/${id}/analyze`);
      setProject(response.data.project);
      setActiveTab('analysis');
    } catch (err) {
      setError('Failed to analyze floor plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/projects/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'upload', name: 'Upload Images', icon: Upload },
    { id: 'analysis', name: 'AI Analysis', icon: Brain },
    { id: 'manual', name: 'Manual Input', icon: Calculator }
  ];

  if (loading && !project) {
    return <Loading message="Loading project details..." />;
  }

  if (error && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-purple-600 hover:text-purple-500"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700">{project?.name}</h1>
          <span className={`ml-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project?.status)}`}>
            {project?.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to={`/projects/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md font-medium transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Link>

          {project?.status === 'ready' && (
            <Link
              to={`/projects/${id}/quote`}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Quote
            </Link>
          )}

          <button
            onClick={handleDeleteProject}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-purple-700 mb-4">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900">{project?.description || 'No description provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                  <dd className="text-sm text-gray-900 capitalize">{project?.project_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                  <dd className="text-sm text-gray-900 capitalize">{project?.property_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{new Date(project?.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {/* Client Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-purple-700 mb-4">Client Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{project?.client_name || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{project?.client_email || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{project?.client_phone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">{project?.client_address || 'Not provided'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <ImageUpload 
            projectId={id} 
            project={project}
            onUploadComplete={loadProject}
          />
        )}

        {activeTab === 'analysis' && (
          <FloorPlanAnalysis 
            project={project}
            onAnalyze={handleAnalyzeFloorPlan}
            loading={loading}
          />
        )}

        {activeTab === 'manual' && (
          <ManualInput 
            project={project}
            onSave={loadProject}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;