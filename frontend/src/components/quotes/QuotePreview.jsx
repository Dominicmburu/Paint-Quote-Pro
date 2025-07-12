// Enhanced QuotePreview.jsx with comprehensive details display
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, Send, Edit, Eye, ArrowLeft, CheckCircle, AlertCircle, 
  Building, Square, DoorClosed, Building2, AlertTriangle, FileText,
  Ruler, Layers, Info, Settings
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuotePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      const response = await api.get(`/quotes/${id}`);
      setQuote(response.data.quote);
      console.log('📊 Loaded comprehensive quote:', response.data.quote);
    } catch (err) {
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/quotes/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprehensive_quote_${quote.quote_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMessage('Comprehensive quote PDF downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to download quote PDF');
    }
  };

  const sendQuote = async () => {
    try {
      setSending(true);
      await api.post(`/quotes/${id}/send`, {
        client_email: quote.client_email
      });
      
      setSuccessMessage('Comprehensive quote sent successfully to client!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      loadQuote();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  // Organize line items by category with comprehensive details
  const organizeLineItems = (lineItems) => {
    const organized = {
      rooms: {},
      interior: [],
      exterior: [],
      special: [],
      general: []
    };

    lineItems.forEach(item => {
      const category = item.category || 'general';
      
      if (category === 'room_work') {
        const roomName = item.room || 'Unknown Room';
        if (!organized.rooms[roomName]) {
          organized.rooms[roomName] = {
            walls: [],
            ceiling: [],
            totals: { wall_area: 0, ceiling_area: 0, room_cost: 0 }
          };
        }
        
        if (item.surface === 'wall') {
          organized.rooms[roomName].walls.push(item);
          organized.rooms[roomName].totals.wall_area += item.measurements?.area || 0;
        } else if (item.surface === 'ceiling') {
          organized.rooms[roomName].ceiling.push(item);
          organized.rooms[roomName].totals.ceiling_area += item.measurements?.area || 0;
        }
        
        organized.rooms[roomName].totals.room_cost += item.total;
      } else {
        organized[category].push(item);
      }
    });

    return organized;
  };

  // Get comprehensive measurement details from quote
  const getMeasurementDetails = () => {
    return quote?.measurement_details || {};
  };

  // Calculate summary statistics
  const calculateSummary = (organizedItems) => {
    const summary = {
      total_rooms: Object.keys(organizedItems.rooms).length,
      total_walls: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.walls.length, 0),
      total_wall_area: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.totals.wall_area, 0),
      total_ceiling_area: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.totals.ceiling_area, 0),
      total_interior_items: organizedItems.interior.length,
      total_exterior_items: organizedItems.exterior.length,
      total_special_jobs: organizedItems.special.length,
      cost_breakdown: {
        rooms: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.totals.room_cost, 0),
        interior: organizedItems.interior.reduce((sum, item) => sum + item.total, 0),
        exterior: organizedItems.exterior.reduce((sum, item) => sum + item.total, 0),
        special: organizedItems.special.reduce((sum, item) => sum + item.total, 0),
        general: organizedItems.general.reduce((sum, item) => sum + item.total, 0)
      }
    };
    return summary;
  };

  if (loading) {
    return <Loading message="Loading comprehensive quote..." />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600 mb-4">The requested comprehensive quote could not be found.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const organizedItems = organizeLineItems(quote.line_items || []);
  const measurementDetails = getMeasurementDetails();
  const summary = calculateSummary(organizedItems);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="text-white hover:text-gray-200 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Comprehensive Quote Preview</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm opacity-90">#{quote.quote_number}</p>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    Full Specifications Included
                  </span>
                  {quote.measurement_details && (
                    <span className="text-xs bg-green-500 bg-opacity-80 px-2 py-1 rounded-full">
                      Complete Measurements
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md font-medium transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              
              {quote.status === 'draft' && quote.client_email && (
                <button
                  onClick={sendQuote}
                  disabled={sending}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Client
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Project Summary Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Project Overview</h3>
                  <div className="space-y-1 text-sm opacity-90">
                    <div>{quote.project_name}</div>
                    <div>{quote.property_address}</div>
                    <div>Client: {quote.client_company_name || 'Not specified'}</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Measurements Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="opacity-75">Rooms:</div>
                      <div className="font-medium">{summary.total_rooms}</div>
                    </div>
                    <div>
                      <div className="opacity-75">Walls:</div>
                      <div className="font-medium">{summary.total_walls}</div>
                    </div>
                    <div>
                      <div className="opacity-75">Wall Area:</div>
                      <div className="font-medium">{summary.total_wall_area.toFixed(1)}m²</div>
                    </div>
                    <div>
                      <div className="opacity-75">Ceiling Area:</div>
                      <div className="font-medium">{summary.total_ceiling_area.toFixed(1)}m²</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quote Total</h3>
                  <div className="text-3xl font-bold">£{quote.total_amount.toFixed(2)}</div>
                  <div className="text-sm opacity-90">Valid until: {new Date(quote.valid_until).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'rooms', label: 'Room Details', icon: Building },
                    { id: 'interior', label: 'Interior Work', icon: DoorClosed },
                    { id: 'exterior', label: 'Exterior Work', icon: Building2 },
                    { id: 'special', label: 'Special Jobs', icon: AlertTriangle },
                    { id: 'specifications', label: 'Specifications', icon: Settings }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-3">Work Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Room Work:</span>
                              <span className="font-medium">£{summary.cost_breakdown.rooms.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Interior Items:</span>
                              <span className="font-medium">£{summary.cost_breakdown.interior.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Exterior Items:</span>
                              <span className="font-medium">£{summary.cost_breakdown.exterior.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Special Jobs:</span>
                              <span className="font-medium">£{summary.cost_breakdown.special.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>General Services:</span>
                              <span className="font-medium">£{summary.cost_breakdown.general.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-3">Quote Totals</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="font-medium">£{quote.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VAT (20%):</span>
                              <span className="font-medium">£{quote.vat_amount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-green-200 pt-2 mt-2">
                              <div className="flex justify-between font-bold">
                                <span>Total Amount:</span>
                                <span className="text-lg">£{quote.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Project & Client Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Project Details</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><strong>Project:</strong> {quote.project_name}</div>
                            <div><strong>Address:</strong> {quote.property_address}</div>
                            <div><strong>Type:</strong> {quote.project_type}</div>
                            <div><strong>Property:</strong> {quote.property_type}</div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Client Information</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><strong>Company:</strong> {quote.client_company_name || 'Not specified'}</div>
                            <div><strong>Contact:</strong> {quote.client_contact_name || 'Not specified'}</div>
                            <div><strong>Email:</strong> {quote.client_email || 'Not specified'}</div>
                            <div><strong>Phone:</strong> {quote.client_phone || 'Not specified'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Details Tab */}
                {activeTab === 'rooms' && (
                  <div className="space-y-6">
                    {Object.entries(organizedItems.rooms).map(([roomName, roomData]) => (
                      <div key={roomName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                              <Building className="h-5 w-5 mr-2" />
                              {roomName}
                            </h4>
                            <div className="text-sm text-blue-700">
                              <span className="bg-blue-100 px-2 py-1 rounded">
                                Total: £{roomData.totals.room_cost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-blue-700">
                            <div>
                              <span className="font-medium">Walls:</span> {roomData.walls.length}
                            </div>
                            <div>
                              <span className="font-medium">Wall Area:</span> {roomData.totals.wall_area.toFixed(2)}m²
                            </div>
                            <div>
                              <span className="font-medium">Ceiling Area:</span> {roomData.totals.ceiling_area.toFixed(2)}m²
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Wall Details */}
                          {roomData.walls.length > 0 && (
                            <div className="mb-6">
                              <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <Square className="h-4 w-4 mr-2 text-gray-600" />
                                Wall Work
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {roomData.walls.map((wall, index) => (
                                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {wall.surface_name || 'Wall'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {wall.measurements ? 
                                            `${wall.measurements.length}m × ${wall.measurements.height}m` : 
                                            'N/A'
                                          }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {wall.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Standard'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {wall.quantity.toFixed(2)}m²
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          £{wall.unit_price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                          £{wall.total.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Ceiling Details */}
                          {roomData.ceiling.length > 0 && (
                            <div>
                              <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <Layers className="h-4 w-4 mr-2 text-gray-600" />
                                Ceiling Work
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {roomData.ceiling.map((ceiling, index) => (
                                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-900">Ceiling</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {ceiling.measurements ? 
                                            `${ceiling.measurements.length}m × ${ceiling.measurements.width}m` : 
                                            'N/A'
                                          }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {ceiling.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Standard'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {ceiling.quantity.toFixed(2)}m²
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          £{ceiling.unit_price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                          £{ceiling.total.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {Object.keys(organizedItems.rooms).length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Room Work</h3>
                        <p className="text-gray-500">No room-specific work items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Interior Work Tab */}
                {activeTab === 'interior' && (
                  <div className="space-y-6">
                    {organizedItems.interior.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-orange-900 flex items-center">
                            <DoorClosed className="h-5 w-5 mr-2" />
                            Interior Work Items
                          </h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Complete specifications and pricing for all interior work
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {organizedItems.interior.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.description.replace('Interior - ', '')}
                                    </div>
                                    {item.specifications?.notes && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {item.specifications.notes}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">
                                      {item.specifications && (
                                        <div className="space-y-1">
                                          {item.specifications.condition_name && (
                                            <div><span className="font-medium">Condition:</span> {item.specifications.condition_name}</div>
                                          )}
                                          {item.specifications.size && (
                                            <div><span className="font-medium">Size:</span> {item.specifications.size}</div>
                                          )}
                                          {item.specifications.door_type && (
                                            <div><span className="font-medium">Type:</span> {item.specifications.door_type}</div>
                                          )}
                                          {item.specifications.location && (
                                            <div><span className="font-medium">Location:</span> {item.specifications.location}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    £{item.unit_price.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    £{item.total.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-orange-100">
                                <td colSpan="4" className="px-4 py-3 text-sm font-medium text-orange-900">
                                  Interior Work Subtotal:
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-orange-900">
                                  £{summary.cost_breakdown.interior.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <DoorClosed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Interior Work</h3>
                        <p className="text-gray-500">No interior work items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Exterior Work Tab */}
                {activeTab === 'exterior' && (
                  <div className="space-y-6">
                    {organizedItems.exterior.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                            <Building2 className="h-5 w-5 mr-2" />
                            Exterior Work Items
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Complete specifications and pricing for all exterior work
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {organizedItems.exterior.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.description.replace('Exterior - ', '')}
                                    </div>
                                    {item.specifications?.notes && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {item.specifications.notes}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">
                                      {item.specifications && (
                                        <div className="space-y-1">
                                          {item.specifications.condition_name && (
                                            <div><span className="font-medium">Condition:</span> {item.specifications.condition_name}</div>
                                          )}
                                          {item.specifications.size && (
                                            <div><span className="font-medium">Size:</span> {item.specifications.size}</div>
                                          )}
                                          {item.specifications.door_type && (
                                            <div><span className="font-medium">Type:</span> {item.specifications.door_type}</div>
                                          )}
                                          {item.specifications.weatherproof && (
                                            <div className="text-green-600"><span className="font-medium">✓ Weatherproof</span></div>
                                          )}
                                          {item.specifications.location && (
                                            <div><span className="font-medium">Location:</span> {item.specifications.location}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    £{item.unit_price.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    £{item.total.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-blue-100">
                                <td colSpan="4" className="px-4 py-3 text-sm font-medium text-blue-900">
                                  Exterior Work Subtotal:
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-900">
                                  £{summary.cost_breakdown.exterior.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Exterior Work</h3>
                        <p className="text-gray-500">No exterior work items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Jobs Tab */}
                {activeTab === 'special' && (
                  <div className="space-y-6">
                    {organizedItems.special.length > 0 ? (
                      <div className="space-y-4">
                        {organizedItems.special.map((job, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-purple-900 flex items-center">
                                  <AlertTriangle className="h-5 w-5 mr-2" />
                                  {job.description.replace('Special Job - ', '')}
                                </h4>
                                <div className="text-sm font-medium text-purple-900">
                                  £{job.total.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Job Details</h5>
                                  <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Quantity:</span> {job.quantity} {job.unit}</div>
                                    <div><span className="font-medium">Unit Price:</span> £{job.unit_price.toFixed(2)}</div>
                                    {job.specifications?.category && (
                                      <div><span className="font-medium">Category:</span> {job.specifications.category}</div>
                                    )}
                                    {job.specifications?.difficulty && (
                                      <div><span className="font-medium">Difficulty:</span> {job.specifications.difficulty}</div>
                                    )}
                                    {job.specifications?.estimated_hours > 0 && (
                                      <div><span className="font-medium">Estimated Hours:</span> {job.specifications.estimated_hours}</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Additional Information</h5>
                                  <div className="space-y-2 text-sm">
                                    {job.specifications?.location && (
                                      <div><span className="font-medium">Location:</span> {job.specifications.location}</div>
                                    )}
                                    {job.specifications?.materials_included !== undefined && (
                                      <div>
                                        <span className="font-medium">Materials:</span> 
                                        <span className={job.specifications.materials_included ? 'text-green-600' : 'text-red-600'}>
                                          {job.specifications.materials_included ? ' ✓ Included' : ' ✗ Not Included'}
                                        </span>
                                      </div>
                                    )}
                                    {job.specifications?.notes && (
                                      <div><span className="font-medium">Notes:</span> {job.specifications.notes}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {job.specifications?.steps && job.specifications.steps.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3">Process Steps</h5>
                                  <ol className="space-y-2">
                                    {job.specifications.steps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex text-sm">
                                        <span className="font-medium text-purple-600 mr-3">{stepIndex + 1}.</span>
                                        <span className="text-gray-700">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium text-purple-900">Special Jobs Total:</span>
                            <span className="text-xl font-bold text-purple-900">
                              £{summary.cost_breakdown.special.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Special Jobs</h3>
                        <p className="text-gray-500">No special job items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Specifications Tab */}
                {activeTab === 'specifications' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Info className="h-5 w-5 mr-2" />
                        Complete Project Specifications
                      </h4>
                      
                      {measurementDetails && Object.keys(measurementDetails).length > 0 && (
                        <div className="space-y-6">
                          {/* Project Summary */}
                          {measurementDetails.summary && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3">Project Summary</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600">Total Rooms:</div>
                                  <div className="font-medium">{measurementDetails.summary.total_rooms}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Total Walls:</div>
                                  <div className="font-medium">{measurementDetails.summary.total_walls}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Wall Area:</div>
                                  <div className="font-medium">{measurementDetails.summary.total_wall_area?.toFixed(2)}m²</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Ceiling Area:</div>
                                  <div className="font-medium">{measurementDetails.summary.total_ceiling_area?.toFixed(2)}m²</div>
                                </div>
                              </div>
                              {measurementDetails.summary.project_notes && (
                                <div className="mt-4">
                                  <div className="text-gray-600 text-sm font-medium">Project Notes:</div>
                                  <div className="text-gray-800 text-sm mt-1">{measurementDetails.summary.project_notes}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Terms & Conditions */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">Terms & Conditions</h5>
                            <div className="text-sm text-gray-600 space-y-2">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Quote valid for 30 days from date of issue</li>
                                <li>50% deposit required before commencement of work</li>
                                <li>Final payment due upon completion</li>
                                <li>All materials and labor included unless otherwise specified</li>
                                <li>Customer to provide access and remove/cover furniture</li>
                                <li>Any variations to be agreed in writing</li>
                                <li>Work carried out during normal business hours (8am-6pm)</li>
                                <li>All waste materials will be disposed of responsibly</li>
                                <li>All work comes with a 12-month guarantee</li>
                                <li>Weather conditions may affect exterior work scheduling</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Totals - Always Visible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">£{quote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (20%):</span>
                  <span className="font-medium text-gray-900">£{quote.vat_amount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">£{quote.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quote Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quote Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Created: {new Date(quote.created_at).toLocaleDateString()}</p>
                    {quote.sent_at && (
                      <p>Sent: {new Date(quote.sent_at).toLocaleDateString()}</p>
                    )}
                    <p>Valid until: {new Date(quote.valid_until).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Comprehensive Quote Features */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">✓ Comprehensive Quote Features</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Complete room measurements</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Wall & ceiling specifications</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Treatment details included</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Interior/exterior breakdown</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Special job specifications</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Complete pricing transparency</span>
                  </div>
                </div>
              </div>

              {/* Quote Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Comprehensive Statistics</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Line Items:</span>
                    <span className="font-medium">{quote.line_items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rooms Detailed:</span>
                    <span className="font-medium">{summary.total_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Walls Measured:</span>
                    <span className="font-medium">{summary.total_walls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Wall Area:</span>
                    <span className="font-medium">{summary.total_wall_area.toFixed(1)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Ceiling Area:</span>
                    <span className="font-medium">{summary.total_ceiling_area.toFixed(1)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interior Items:</span>
                    <span className="font-medium">{summary.total_interior_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exterior Items:</span>
                    <span className="font-medium">{summary.total_exterior_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Special Jobs:</span>
                    <span className="font-medium">{summary.total_special_jobs}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Room Work:</span>
                    <div className="text-right">
                      <div className="font-medium">£{summary.cost_breakdown.rooms.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.rooms / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Interior Work:</span>
                    <div className="text-right">
                      <div className="font-medium">£{summary.cost_breakdown.interior.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.interior / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Exterior Work:</span>
                    <div className="text-right">
                      <div className="font-medium">£{summary.cost_breakdown.exterior.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.exterior / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Special Jobs:</span>
                    <div className="text-right">
                      <div className="font-medium">£{summary.cost_breakdown.special.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.special / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">General Services:</span>
                    <div className="text-right">
                      <div className="font-medium">£{summary.cost_breakdown.general.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.general / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={downloadPDF}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Comprehensive PDF
                  </button>
                  
                  {quote.status === 'draft' && quote.client_email && (
                    <button
                      onClick={sendQuote}
                      disabled={sending}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm transition-colors"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send to Client
                        </>
                      )}
                    </button>
                  )}
                  
                  <Link
                    to={`/projects/${quote.project?.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-md text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Project Details
                  </Link>

                  <Link
                    to={`/quotes/${quote.id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md text-sm transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Quote
                  </Link>
                </div>
              </div>

              {/* Project Summary */}
              {quote.project && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Project Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div><strong>Project:</strong> {quote.project_name}</div>
                    <div><strong>Client:</strong> {quote.client_company_name || 'Not specified'}</div>
                    <div><strong>Property Type:</strong> {quote.project?.property_type}</div>
                    <div><strong>Project Type:</strong> {quote.project?.project_type}</div>
                    <div><strong>Status:</strong> {quote.project?.status}</div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Quote Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• This comprehensive quote includes all project details</p>
                  <p>• Room measurements are precise and detailed</p>
                  <p>• All materials and labor costs are transparent</p>
                  <p>• Special jobs include complete specifications</p>
                  <p>• PDF includes technical drawings if available</p>
                  <p>• Full project specifications documented</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;