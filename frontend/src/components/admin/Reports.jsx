import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Calendar, 
  Filter,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  FileText,
  Clock,
  Download,
  Eye,
  Settings,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportParams, setReportParams] = useState({
    startDate: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'pdf',
    includeCharts: true,
    includeRawData: false
  });

  useEffect(() => {
    loadReports();
    loadReportTemplates();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportTemplates = async () => {
    try {
      const response = await api.get('/admin/reports/templates');
      setReportTemplates(response.data);
    } catch (error) {
      console.error('Failed to load report templates:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedTemplate) return;

    try {
      setGeneratingReport(true);
      const response = await api.post('/admin/reports/generate', {
        template: selectedTemplate,
        ...reportParams
      });
      
      if (reportParams.format === 'pdf' || reportParams.format === 'excel') {
        // Handle file download
        const blob = new Blob([response.data], { 
          type: reportParams.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedTemplate}_report_${new Date().toISOString().split('T')[0]}.${reportParams.format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      loadReports(); // Refresh the reports list
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId, filename) => {
    try {
      const response = await api.get(`/admin/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const deleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await api.delete(`/admin/reports/${reportId}`);
        loadReports();
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'user_analytics':
        return <Users className="h-6 w-6 text-blue-600" />;
      case 'financial':
        return <DollarSign className="h-6 w-6 text-green-600" />;
      case 'project_summary':
        return <FileText className="h-6 w-6 text-purple-600" />;
      case 'company_overview':
        return <Building className="h-6 w-6 text-yellow-600" />;
      case 'performance':
        return <TrendingUp className="h-6 w-6 text-red-600" />;
      default:
        return <FileDown className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <Loading message="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Reports</h1>
          <p className="text-gray-600">Generate and manage business reports</p>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a template</option>
                {reportTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={reportParams.startDate}
                  onChange={(e) => setReportParams({...reportParams, startDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={reportParams.endDate}
                  onChange={(e) => setReportParams({...reportParams, endDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={reportParams.format}
                onChange={(e) => setReportParams({...reportParams, format: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportParams.includeCharts}
                    onChange={(e) => setReportParams({...reportParams, includeCharts: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Include Charts</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportParams.includeRawData}
                    onChange={(e) => setReportParams({...reportParams, includeRawData: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Include Raw Data</label>
                </div>
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={!selectedTemplate || generatingReport}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingReport ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Templates Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Available Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                {getReportIcon(template.type)}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Est. {template.estimated_time || '2-5'} minutes
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-purple-700">Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reports generated yet. Create your first report above.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getReportIcon(report.type)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          <div className="text-sm text-gray-500">{report.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {report.format?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        by {report.created_by_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(report.file_size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {report.status === 'completed' && (
                          <button
                            onClick={() => downloadReport(report.id, report.filename)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <FileDown className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-lg font-semibold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-lg font-semibold text-gray-900">
                {reports.filter(r => new Date(r.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Most Popular</p>
              <p className="text-lg font-semibold text-gray-900">User Analytics</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Templates</p>
              <p className="text-lg font-semibold text-gray-900">{reportTemplates.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;