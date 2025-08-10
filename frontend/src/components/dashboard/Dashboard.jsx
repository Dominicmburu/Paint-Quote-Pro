import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';
import Loading from '../common/Loading';
import ProjectCard from './ProjectCard';
import QuickStats from './QuickStats';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { subscription, canCreateProject, getProjectsRemaining } = useSubscription();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDashboardData();
  }, [currentPage, statusFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load projects and stats in parallel
      const [projectsResponse, statsResponse] = await Promise.all([
        api.get('/projects', {
          params: {
            page: currentPage,
            per_page: 12,
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchTerm || undefined
          }
        }),
        api.get('/projects/stats')
      ]);

      setProjects(projectsResponse.data.projects);
      setStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (!canCreateProject()) {
      alert('You have reached your project limit for this month. Please upgrade your plan.');
      return;
    }
    navigate('/projects/new');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDashboardData();
  };

  // Get counts for different project states including signatures
  const getProjectCounts = () => {
    const counts = {
      total: projects.length,
      quoted: projects.filter(p => p.status === 'quoted').length,
      signed: 0,
      pending_signature: 0
    };

    projects.forEach(project => {
      if (project.status === 'quoted' && project.quote_data) {
        if (project.quote_data.is_signed === true || 
            (project.quote_data.signed_at && project.quote_data.signed_at !== null)) {
          counts.signed++;
        } else {
          counts.pending_signature++;
        }
      }
    });

    return counts;
  };

  const statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'draft', label: 'Draft' },
    { value: 'analyzing', label: 'Analyzing' },
    { value: 'ready', label: 'Ready' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'completed', label: 'Completed' }
  ];

  if (loading && !projects.length) {
    return <Loading />;
  }

  const projectCounts = getProjectCounts();

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {company?.name} • {subscription?.plan_name} Plan
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <Link
                to="/subscription"
                className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
              <button
                onClick={handleCreateProject}
                disabled={!canCreateProject()}
                className="inline-flex items-center px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>

          {/* Subscription Alerts */}
          {subscription && !subscription.is_active && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Subscription Required
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your trial has expired. Upgrade to continue creating projects.
                  </p>
                </div>
                <Link
                  to="/subscription"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}

          {/* Signature Alert */}
          {/* {projectCounts.pending_signature > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <FileCheck className="h-5 w-5 text-blue-400 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Quotes Awaiting Signature
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {projectCounts.pending_signature} quote{projectCounts.pending_signature !== 1 ? 's' : ''} {projectCounts.pending_signature === 1 ? 'is' : 'are'} waiting for client signature.
                  </p>
                </div>
                <button
                  onClick={() => setStatusFilter('quoted')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  View Quotes
                </button>
              </div>
            </div>
          )} */}

          {/* {projectCounts.signed > 0 && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Recently Signed Quotes
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {projectCounts.signed} quote{projectCounts.signed !== 1 ? 's' : ''} {projectCounts.signed === 1 ? 'has' : 'have'} been digitally signed by clients.
                  </p>
                </div>
                <button
                  onClick={() => setStatusFilter('quoted')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  View Signed
                </button>
              </div>
            </div>
          )} */}

          {/* Usage Warning */}
          {subscription && subscription.is_active && subscription.max_projects > 0 && (
            subscription.projects_used_this_month / subscription.max_projects > 0.8
          ) && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Approaching Project Limit
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You've used {subscription.projects_used_this_month} of {subscription.max_projects} projects this month.
                  </p>
                </div>
                <Link
                  to="/subscription"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Quick Stats */}
        {stats && <QuickStats stats={{...stats, projectCounts}} subscription={subscription} />}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first project to get started with Paint Quote Pro.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={handleCreateProject}
                disabled={!canCreateProject()}
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </button>
            )}
          </div>
        )}

        {/* Load More / Pagination */}
        {projects.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Load More Projects
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;