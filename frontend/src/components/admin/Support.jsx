import React, { useState, useEffect } from 'react';
import { 
  HeadphonesIcon, 
  Search, 
  Filter, 
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  Download,
  RefreshCw,
  Eye,
  Send,
  Star,
  TrendingUp,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [stats, setStats] = useState({});
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    loadSupportData();
  }, [dateRange]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, filterStatus, filterPriority, filterCategory]);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/admin/support/tickets?days=${dateRange}`),
        api.get(`/admin/support/stats?days=${dateRange}`)
      ]);
      
      setTickets(ticketsRes.data);
      setStats(statsRes.data.stats);
      setResponseTimeData(statsRes.data.response_time_data || []);
      setCategoryDistribution(statsRes.data.category_distribution || []);
      setSatisfactionData(statsRes.data.satisfaction_data || []);
    } catch (error) {
      console.error('Failed to load support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filterCategory);
    }

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await api.put(`/admin/support/tickets/${ticketId}/status`, { status });
      loadSupportData();
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  const assignTicket = async (ticketId, agentId) => {
    try {
      await api.put(`/admin/support/tickets/${ticketId}/assign`, { agent_id: agentId });
      loadSupportData();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const exportTickets = async () => {
    try {
      const response = await api.get(`/admin/support/export?days=${dateRange}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `support_tickets_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TicketModal = ({ ticket, onClose }) => {
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState(ticket?.status || 'open');

    const sendResponse = async () => {
      try {
        await api.post(`/admin/support/tickets/${ticket.id}/respond`, {
          message: response,
          status: status
        });
        loadSupportData();
        onClose();
      } catch (error) {
        console.error('Failed to send response:', error);
      }
    };

    if (!ticket) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Ticket #{ticket.ticket_id}</h3>
              <p className="text-sm text-gray-600">{ticket.subject}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket Details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Original Message</h4>
                <p className="text-sm text-gray-700">{ticket.description}</p>
              </div>

              {/* Conversation History */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Conversation</h4>
                {(ticket.responses || []).map((resp, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    resp.is_staff ? 'bg-purple-50 ml-4' : 'bg-blue-50 mr-4'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {resp.is_staff ? resp.staff_name : ticket.customer_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(resp.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{resp.message}</p>
                  </div>
                ))}
              </div>

              {/* Response Form */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Send Response</h4>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your response..."
                />
                <div className="flex justify-between items-center mt-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="open">Keep Open</option>
                    <option value="in_progress">Mark In Progress</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                  <button
                    onClick={sendResponse}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Send Response
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket Info Sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span>{ticket.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{ticket.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p>{ticket.customer_email}</p>
                  </div>
                  {ticket.company_name && (
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <p>{ticket.company_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Subscription:</span>
                    <p>{ticket.subscription_plan || 'None'}</p>
                  </div>
                </div>
              </div>

              {ticket.satisfaction_rating && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Customer Feedback</h4>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < ticket.satisfaction_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {ticket.satisfaction_rating}/5
                    </span>
                  </div>
                  {ticket.feedback && (
                    <p className="text-sm text-gray-700 italic">"{ticket.feedback}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  if (loading) {
    return <Loading message="Loading support data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Customer Support</h1>
          <p className="text-gray-600">Manage support tickets and customer inquiries</p>
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
            onClick={loadSupportData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportTickets}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_tickets || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                +{stats.ticket_growth || 0}% from last period
              </p>
            </div>
            <HeadphonesIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved_tickets || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                {((stats.resolved_tickets || 0) / (stats.total_tickets || 1) * 100).toFixed(1)}% resolution rate
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avg_response_time || 0}h</p>
              <p className="text-xs text-yellow-600 mt-1">
                Target: 4h
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.avg_satisfaction || 0).toFixed(1)}</p>
              <p className="text-xs text-purple-600 mt-1">
                Out of 5.0
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Response Time Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Response Time Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}h`, 'Response Time']} />
              <Line type="monotone" dataKey="response_time" stroke="#7C3AED" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Ticket Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Satisfaction Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Customer Satisfaction Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={satisfactionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Bar dataKey="satisfaction" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
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
                placeholder="Search tickets..."
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterCategory('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HeadphonesIcon className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{ticket.ticket_id}</div>
                        <div className="text-sm text-gray-500">
                          {ticket.subject?.substring(0, 40)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.customer_name}</div>
                        <div className="text-sm text-gray-500">{ticket.customer_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {ticket.category?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTicketModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Mark In Progress"
                        disabled={ticket.status === 'in_progress'}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                        className="text-green-600 hover:text-green-900"
                        title="Mark Resolved"
                        disabled={ticket.status === 'resolved'}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Agent Performance</h4>
          <div className="space-y-3">
            {(stats.agent_performance || []).map((agent, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{agent.name}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold">{agent.resolved_tickets}</div>
                  <div className="text-xs text-gray-500">{agent.avg_response_time}h avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Common Issues</h4>
          <div className="space-y-3">
            {(stats.common_issues || []).map((issue, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{issue.title}</span>
                <span className="text-sm font-semibold">{issue.count} tickets</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">SLA Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">First Response (4h)</span>
              <span className="text-sm font-semibold">{(stats.first_response_sla || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolution Time (24h)</span>
              <span className="text-sm font-semibold">{(stats.resolution_sla || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-semibold">{(stats.satisfaction_sla || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
};

export default Support;