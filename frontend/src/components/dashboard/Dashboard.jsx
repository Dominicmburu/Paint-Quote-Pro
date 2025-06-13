import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
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

  const handleCreateProject = async () => {
    if (!canCreateProject()) {
      alert('You have reached your project limit for this month. Please upgrade your plan.');
      return;
    }
    // Navigate to project creation or open modal
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDashboardData();
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

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-700">
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
                className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>

          {/* Subscription Alert */}
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

        {/* Quick Stats */}
        {stats && <QuickStats stats={stats} subscription={subscription} />}

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

// ProjectCard component
// const ProjectCard = ({ project }) => {
//   const getStatusColor = (status) => {
//     const colors = {
//       draft: 'bg-gray-100 text-gray-800',
//       analyzing: 'bg-yellow-100 text-yellow-800',
//       ready: 'bg-green-100 text-green-800',
//       quoted: 'bg-blue-100 text-blue-800',
//       completed: 'bg-purple-100 text-purple-800'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800';
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       draft: <FileText className="h-4 w-4" />,
//       analyzing: <Clock className="h-4 w-4" />,
//       ready: <CheckCircle className="h-4 w-4" />,
//       quoted: <FileText className="h-4 w-4" />,
//       completed: <CheckCircle className="h-4 w-4" />
//     };
//     return icons[status] || <FileText className="h-4 w-4" />;
//   };

//   return (
//     <Link
//       to={`/projects/${project.id}`}
//       className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 block"
//     >
//       <div className="flex items-start justify-between mb-4">
//         <h3 className="text-lg font-semibold text-purple-700 truncate">
//           {project.name}
//         </h3>
//         <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
//           {getStatusIcon(project.status)}
//           <span className="capitalize">{project.status}</span>
//         </span>
//       </div>

//       {project.client_name && (
//         <p className="text-gray-600 mb-2">
//           <span className="font-medium">Client:</span> {project.client_name}
//         </p>
//       )}

//       {project.description && (
//         <p className="text-gray-600 text-sm mb-4 line-clamp-2">
//           {project.description}
//         </p>
//       )}

//       <div className="flex items-center justify-between text-sm text-gray-500">
//         <span>
//           {project.project_type} • {project.property_type}
//         </span>
//         <span>
//           {new Date(project.created_at).toLocaleDateString()}
//         </span>
//       </div>

//       {project.quote_data && (
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <div className="flex items-center justify-between">
//             <span className="text-sm text-gray-600">Quote Total:</span>
//             <span className="text-lg font-semibold text-green-600">
//               £{project.quote_data.total_amount?.toFixed(2)}
//             </span>
//           </div>
//         </div>
//       )}
//     </Link>
//   );
// };

// QuickStats component
// const QuickStats = ({ stats, subscription }) => {
//   const statCards = [
//     {
//       title: 'Total Projects',
//       value: stats.total_projects,
//       icon: <FileText className="h-6 w-6 text-purple-600" />,
//       color: 'bg-purple-50 border-purple-200'
//     },
//     {
//       title: 'Ready for Quote',
//       value: stats.ready_projects,
//       icon: <CheckCircle className="h-6 w-6 text-green-600" />,
//       color: 'bg-green-50 border-green-200'
//     },
//     {
//       title: 'This Month',
//       value: `${stats.projects_this_month}${subscription?.max_projects > 0 ? `/${subscription.max_projects}` : ''}`,
//       icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
//       color: 'bg-blue-50 border-blue-200'
//     },
//     {
//       title: 'Days Remaining',
//       value: subscription?.days_remaining || 0,
//       icon: <Clock className="h-6 w-6 text-yellow-600" />,
//       color: 'bg-yellow-50 border-yellow-200'
//     }
//   ];

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//       {statCards.map((stat, index) => (
//         <div key={index} className={`bg-white rounded-lg border p-6 ${stat.color}`}>
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">{stat.title}</p>
//               <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
//             </div>
//             <div className="flex-shrink-0">
//               {stat.icon}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

export default Dashboard;