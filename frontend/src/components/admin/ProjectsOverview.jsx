import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const ProjectsOverview = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [stats, setStats] = useState({});
  const [companies, setCompanies] = useState([]); // Initialize as empty array
  const [projectTrends, setProjectTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [error, setError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProjects();
    loadCompanies();
    loadProjectStats();
  }, [dateRange]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, filterStatus, filterCompany]);

  // FIXED: loadProjects function with new endpoint
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      // Using the new non-conflicting endpoint
      const response = await api.get(`/admin/projects-overview?days=${dateRange}`);

      // Handle both array response and object with data property
      const projectsData = Array.isArray(response.data) ? response.data : [];
      setProjects(projectsData);

    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Failed to load projects');
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = async (projectId) => {
    try {
      setActionLoading(true);
      const response = await api.get(`/admin/projects/${projectId}`);
      setSelectedProject(response.data.project);
      setShowViewModal(true);
    } catch (error) {
      console.error('Failed to fetch project details:', error);
      setError('Failed to load project details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProject = (projectId) => {
    // Navigate to edit page or open edit modal
    // For now, we'll just log the action
    console.log('Edit project:', projectId);
    setError('Edit functionality not yet implemented');
    setTimeout(() => setError(''), 3000);
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      setActionLoading(true);
      await api.delete(`/admin/projects/${selectedProject.id}`);

      // Remove project from local state
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setFilteredProjects(filteredProjects.filter(p => p.id !== selectedProject.id));

      setSuccess('Project deleted successfully');
      setTimeout(() => setSuccess(''), 3000);

      setShowDeleteModal(false);
      setSelectedProject(null);

      // Reload stats
      loadProjectStats();

    } catch (error) {
      console.error('Failed to delete project:', error);
      setError(error.response?.data?.error || 'Failed to delete project');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const ViewProjectModal = () => {
    if (!selectedProject) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedProject(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProject.status)}`}>
                  {selectedProject.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.user_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.client_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.property_type || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Value</label>
                <p className="mt-1 text-sm text-gray-900">
                  €{selectedProject.estimated_value ? selectedProject.estimated_value.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {selectedProject.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.description}</p>
              </div>
            )}

            {selectedProject.client_address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProject.client_address}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedProject(null);
              }}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = () => {
    if (!selectedProject) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete "{selectedProject.name}"? This action cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProject(null);
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteProject}
              disabled={actionLoading}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // FIXED: loadCompanies function with new endpoint
  const loadCompanies = async () => {
    try {
      // Using the new non-conflicting endpoint
      const response = await api.get('/admin/companies-list');

      // Handle both array response and object with data property
      const companiesData = Array.isArray(response.data) ? response.data : [];
      setCompanies(companiesData);

    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]); // Set empty array on error
    }
  };

  // FIXED: loadProjectStats function with new endpoint
  const loadProjectStats = async () => {
    try {
      // Using the new non-conflicting endpoint
      const response = await api.get(`/admin/projects-overview/stats?days=${dateRange}`);

      // Safely extract stats with defaults
      const statsData = response.data.stats || {};
      const trendsData = response.data.trends || [];
      const statusData = response.data.status_distribution || [];

      setStats({
        total_projects: statsData.total_projects || 0,
        completed_projects: statsData.completed_projects || 0,
        in_progress_projects: statsData.in_progress_projects || 0,
        project_growth: statsData.project_growth || 0,
        total_value: statsData.total_value || 0,
        avg_value: statsData.avg_value || 0,
        top_companies: statsData.top_companies || [],
        project_types: statsData.project_types || [],
        recent_activity: statsData.recent_activity || []
      });

      setProjectTrends(trendsData);
      setStatusDistribution(statusData);

    } catch (error) {
      console.error('Failed to load project stats:', error);
      // Set default empty stats
      setStats({
        total_projects: 0,
        completed_projects: 0,
        in_progress_projects: 0,
        project_growth: 0,
        total_value: 0,
        avg_value: 0,
        top_companies: [],
        project_types: [],
        recent_activity: []
      });
      setProjectTrends([]);
      setStatusDistribution([]);
    }
  };

  // FIXED: filterProjects function with null checks
  const filterProjects = () => {
    if (!Array.isArray(projects)) {
      setFilteredProjects([]);
      return;
    }

    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    if (filterCompany !== 'all') {
      filtered = filtered.filter(project => project.company_id?.toString() === filterCompany);
    }

    setFilteredProjects(filtered);
  };

  // FIXED: exportProjects function with new endpoint
  const exportProjects = async () => {
    try {
      // Using the new non-conflicting endpoint
      const response = await api.get(`/admin/projects-overview/export?days=${dateRange}`);

      // Handle CSV data response
      let csvData;
      if (response.data.csv_data) {
        csvData = response.data.csv_data;
      } else {
        csvData = response.data;
      }

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'on_hold':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6'];

  if (loading) {
    return <Loading message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Projects Overview</h1>
          <p className="text-gray-600">Monitor all projects across the platform</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={loadProjects}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportProjects}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats - with safe data access */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_projects || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.project_growth || 0}% from last period
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_projects || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                {((stats.completed_projects || 0) / (stats.total_projects || 1) * 100).toFixed(1)}% completion rate
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.in_progress_projects || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">
                Active projects
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">€{(stats.total_value || 0).toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                Avg: €{(stats.avg_value || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Charts - with safe data checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Project Creation Trends</h3>
          {projectTrends && projectTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="projects" stroke="#7C3AED" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No trend data available</p>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Project Status Distribution</h3>
          {statusDistribution && statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters - with safe companies array handling */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {/* FIXED: Safe iteration over companies array */}
              {Array.isArray(companies) && companies.map(company => (
                <option key={company.id} value={company.id.toString()}>
                  {company.name || 'Unknown Company'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterCompany('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table - with safe data handling */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCompany !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No projects have been created yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name || 'Unnamed Project'}</div>
                          <div className="text-sm text-gray-500">
                            {project.description ?
                              (project.description.length > 50 ? project.description.substring(0, 50) + '...' : project.description)
                              : 'No description'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{project.company_name || 'Individual'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{project.user_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(project.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {project.status ? project.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{project.estimated_value ? project.estimated_value.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewProject(project.id)}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Project"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditProject(project.id)}
                          disabled={actionLoading}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Top Performing Companies</h4>
          <div className="space-y-3">
            {Array.isArray(stats.top_companies) && stats.top_companies.length > 0 ? (
              stats.top_companies.map((company, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{company.name || 'Unknown'}</span>
                  <span className="text-sm font-semibold">{company.project_count || 0} projects</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Project Types</h4>
          <div className="space-y-3">
            {Array.isArray(stats.project_types) && stats.project_types.length > 0 ? (
              stats.project_types.map((type, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type.name || 'Unknown'}</span>
                  <span className="text-sm font-semibold">{type.count || 0}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {Array.isArray(stats.recent_activity) && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-gray-900">{activity.action || 'Unknown Action'}</div>
                  <div className="text-gray-500">{activity.project_name || 'Unknown Project'}</div>
                  <div className="text-xs text-gray-400">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Unknown Date'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {showViewModal && <ViewProjectModal />}
      {showDeleteModal && <DeleteConfirmModal />}
    </div>
  );
};

export default ProjectsOverview;