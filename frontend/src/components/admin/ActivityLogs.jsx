import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  Settings,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadLogs();
    loadUsers();
  }, [dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterLevel, filterAction, filterUser]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/logs?days=${dateRange}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm)
      );
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action_type === filterAction);
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(log => log.user_id?.toString() === filterUser);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = async () => {
    try {
      const response = await api.get(`/admin/logs/export?days=${dateRange}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getLogIcon = (actionType, level) => {
    if (level === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
    if (level === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    if (level === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;

    switch (actionType) {
      case 'user_action':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'system_action':
        return <Settings className="h-4 w-4 text-gray-600" />;
      case 'project_action':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'billing_action':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'security_action':
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogBgColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'user_action':
        return 'bg-blue-100 text-blue-800';
      case 'system_action':
        return 'bg-gray-100 text-gray-800';
      case 'project_action':
        return 'bg-purple-100 text-purple-800';
      case 'billing_action':
        return 'bg-green-100 text-green-800';
      case 'security_action':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <Loading message="Loading activity logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Activity Logs</h1>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={loadLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-lg font-semibold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Success</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'success').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Actions</option>
              <option value="user_action">User Actions</option>
              <option value="system_action">System Actions</option>
              <option value="project_action">Project Actions</option>
              <option value="billing_action">Billing Actions</option>
              <option value="security_action">Security Actions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterLevel('all');
                setFilterAction('all');
                setFilterUser('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found for the current filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`rounded-lg border p-4 ${getLogBgColor(log.level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.action_type, log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(log.action_type)}`}>
                        {log.action_type?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        log.level === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.level?.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{log.action}</h4>
                    {log.description && (
                      <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {log.user_email && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.user_email}
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          {log.ip_address}
                        </div>
                      )}
                      {log.user_agent && (
                        <div className="flex items-center truncate">
                          <Settings className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-xs">{log.user_agent}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.duration && (
                    <div className="text-xs text-gray-500 mt-1">
                      Duration: {log.duration}ms
                    </div>
                  )}
                </div>
              </div>
              
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                      View Details
                    </summary>
                    <div className="mt-2 bg-gray-50 rounded p-2">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {filteredLogs.length > 50 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} activities. Use filters to narrow down results.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;