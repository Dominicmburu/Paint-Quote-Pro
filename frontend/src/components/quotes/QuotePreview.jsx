// Updated QuotePreview.jsx - Simple row display optimized for Total Wall Area approach
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
      console.log('📊 Loaded quote with Total Wall Area approach:', response.data.quote);
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

  // 🔧 FIXED: Organize line items for Total Wall Area approach
  const organizeLineItems = (lineItems, measurementDetails) => {
    const organized = {
      rooms: {},
      interior: [],
      exterior: [],
      special: [],
      general: []
    };

    // Group line items by category
    lineItems.forEach(item => {
      const category = item.category || 'general';
      
      if (category === 'room_work') {
        const roomName = item.room || 'Unknown Room';
        if (!organized.rooms[roomName]) {
          organized.rooms[roomName] = {
            room_data: null,
            wall_items: [],
            ceiling_items: [],
            totals: { wall_total: 0, ceiling_total: 0, room_total: 0 }
          };
        }
        
        if (item.surface === 'walls') {
          organized.rooms[roomName].wall_items.push(item);
          organized.rooms[roomName].totals.wall_total += item.total;
        } else if (item.surface === 'ceiling') {
          organized.rooms[roomName].ceiling_items.push(item);
          organized.rooms[roomName].totals.ceiling_total += item.total;
        }
        
        organized.rooms[roomName].totals.room_total += item.total;
      } else {
        organized[category].push(item);
      }
    });

    // Add room data from measurement details
    if (measurementDetails && measurementDetails.rooms) {
      measurementDetails.rooms.forEach(roomData => {
        const roomName = roomData.name;
        if (organized.rooms[roomName]) {
          organized.rooms[roomName].room_data = roomData;
        }
      });
    }

    return organized;
  };

  // Calculate summary statistics
  const calculateSummary = (organizedItems, measurementDetails) => {
    const roomsData = measurementDetails?.rooms || [];
    
    return {
      total_rooms: Object.keys(organizedItems.rooms).length,
      total_wall_area: roomsData.reduce((sum, room) => sum + (parseFloat(room.total_wall_area) || 0), 0),
      total_ceiling_area: roomsData.reduce((sum, room) => sum + (parseFloat(room.total_ceiling_area) || 0), 0),
      total_interior_items: organizedItems.interior.length,
      total_exterior_items: organizedItems.exterior.length,
      total_special_jobs: organizedItems.special.length,
      cost_breakdown: {
        rooms: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.totals.room_total, 0),
        interior: organizedItems.interior.reduce((sum, item) => sum + item.total, 0),
        exterior: organizedItems.exterior.reduce((sum, item) => sum + item.total, 0),
        special: organizedItems.special.reduce((sum, item) => sum + item.total, 0),
        general: organizedItems.general.reduce((sum, item) => sum + item.total, 0)
      }
    };
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

  const organizedItems = organizeLineItems(quote.line_items || [], quote.measurement_details || {});
  const measurementDetails = quote.measurement_details || {};
  const summary = calculateSummary(organizedItems, measurementDetails);

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
                <h1 className="text-2xl font-bold">Quote Preview - Total Wall Area</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm opacity-90">#{quote.quote_number}</p>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    Total Wall Area Approach
                  </span>
                  <span className="text-xs bg-green-500 bg-opacity-80 px-2 py-1 rounded-full">
                    Real-time Calculated
                  </span>
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
                  <h3 className="text-lg font-semibold mb-2">Total Wall Area Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="opacity-75">Rooms:</div>
                      <div className="font-medium">{summary.total_rooms}</div>
                    </div>
                    <div>
                      <div className="opacity-75">Wall Area:</div>
                      <div className="font-medium">{summary.total_wall_area.toFixed(1)}m²</div>
                    </div>
                    <div>
                      <div className="opacity-75">Ceiling Area:</div>
                      <div className="font-medium">{summary.total_ceiling_area.toFixed(1)}m²</div>
                    </div>
                    <div>
                      <div className="opacity-75">Items:</div>
                      <div className="font-medium">{summary.total_interior_items + summary.total_exterior_items}</div>
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
                    { id: 'special', label: 'Special Jobs', icon: AlertTriangle }
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

                    {/* Client and Project Information */}
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

                {/* Room Details Tab - Simple Row Display */}
                {activeTab === 'rooms' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">💡 Total Wall Area Approach</h4>
                      <p className="text-sm text-blue-800">
                        This quote uses the total wall area method where each room shows the complete wall surface area and ceiling area with selected treatments applied across the entire area.
                      </p>
                    </div>

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
                                Total: £{roomData.totals.room_total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Room Area Information */}
                          {roomData.room_data && (
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-blue-700">
                              <div>
                                <span className="font-medium">Total Wall Area:</span> {parseFloat(roomData.room_data.total_wall_area || 0).toFixed(2)}m²
                              </div>
                              <div>
                                <span className="font-medium">Ceiling Area:</span> {parseFloat(roomData.room_data.total_ceiling_area || 0).toFixed(2)}m²
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          {/* Wall Work - Simple Row Display */}
                          {roomData.wall_items.length > 0 && (
                            <div className="mb-6">
                              <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <Square className="h-4 w-4 mr-2 text-blue-600" />
                                Wall Treatments
                              </h5>
                              <div className="space-y-2">
                                {roomData.wall_items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Treatment'}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity.toFixed(2)}m² × £{item.unit_price.toFixed(2)}/m²
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-gray-900">£{item.total.toFixed(2)}</div>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                  <span className="font-medium text-blue-900">Wall Work Subtotal:</span>
                                  <span className="font-bold text-blue-900">£{roomData.totals.wall_total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ceiling Work - Simple Row Display */}
                          {roomData.ceiling_items.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <Layers className="h-4 w-4 mr-2 text-green-600" />
                                Ceiling Treatments
                              </h5>
                              <div className="space-y-2">
                                {roomData.ceiling_items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Treatment'}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity.toFixed(2)}m² × £{item.unit_price.toFixed(2)}/m²
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-gray-900">£{item.total.toFixed(2)}</div>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                                  <span className="font-medium text-green-900">Ceiling Work Subtotal:</span>
                                  <span className="font-bold text-green-900">£{roomData.totals.ceiling_total.toFixed(2)}</span>
                                </div>
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

                {/* Interior Work Tab - Simple Row Display */}
                {activeTab === 'interior' && (
                  <div className="space-y-4">
                    {organizedItems.interior.length > 0 ? (
                      <>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-orange-900 flex items-center">
                            <DoorClosed className="h-5 w-5 mr-2" />
                            Interior Work Items
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          {organizedItems.interior.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-4 px-6 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.description.replace('Interior - ', '')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.quantity} {item.unit} × £{item.unit_price.toFixed(2)} each
                                </div>
                                {item.specifications?.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.specifications.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">£{item.total.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center py-3 px-4 bg-orange-100 rounded-lg border-2 border-orange-300">
                            <span className="font-bold text-orange-900">Interior Work Total:</span>
                            <span className="font-bold text-orange-900 text-lg">£{summary.cost_breakdown.interior.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <DoorClosed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Interior Work</h3>
                        <p className="text-gray-500">No interior work items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Exterior Work Tab - Simple Row Display */}
                {activeTab === 'exterior' && (
                  <div className="space-y-4">
                    {organizedItems.exterior.length > 0 ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                            <Building2 className="h-5 w-5 mr-2" />
                            Exterior Work Items
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          {organizedItems.exterior.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-4 px-6 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.description.replace('Exterior - ', '')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.quantity} {item.unit} × £{item.unit_price.toFixed(2)} each
                                </div>
                                {item.specifications?.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.specifications.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">£{item.total.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                            <span className="font-bold text-blue-900">Exterior Work Total:</span>
                            <span className="font-bold text-blue-900 text-lg">£{summary.cost_breakdown.exterior.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Exterior Work</h3>
                        <p className="text-gray-500">No exterior work items in this quote.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Jobs Tab - Simple Row Display */}
                {activeTab === 'special' && (
                  <div className="space-y-4">
                    {organizedItems.special.length > 0 ? (
                      <>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-purple-900 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Special Jobs
                          </h4>
                        </div>
                        
                        <div className="space-y-4">
                          {organizedItems.special.map((item, index) => (
                            <div key={index} className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 text-lg">
                                    {item.description.replace('Special Job - ', '')}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {item.quantity} {item.unit} × £{item.unit_price.toFixed(2)} per {item.unit}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-purple-900 text-xl">£{item.total.toFixed(2)}</div>
                                </div>
                              </div>
                              
                              {/* Job specifications */}
                              {item.specifications && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    {item.specifications.category && (
                                      <div><span className="font-medium">Category:</span> {item.specifications.category}</div>
                                    )}
                                    {item.specifications.difficulty && (
                                      <div><span className="font-medium">Difficulty:</span> {item.specifications.difficulty}</div>
                                    )}
                                    {item.specifications.location && (
                                      <div><span className="font-medium">Location:</span> {item.specifications.location}</div>
                                    )}
                                  </div>
                                  <div>
                                    {item.specifications.materials_included !== undefined && (
                                      <div>
                                        <span className="font-medium">Materials:</span> 
                                        <span className={item.specifications.materials_included ? 'text-green-600' : 'text-red-600'}>
                                          {item.specifications.materials_included ? ' ✓ Included' : ' ✗ Not Included'}
                                        </span>
                                      </div>
                                    )}
                                    {item.specifications.notes && (
                                      <div><span className="font-medium">Notes:</span> {item.specifications.notes}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Process steps if available */}
                              {item.specifications?.steps && item.specifications.steps.length > 0 && (
                                <div className="mt-4">
                                  <h6 className="font-medium text-gray-900 mb-2">Process Steps:</h6>
                                  <ol className="space-y-1 text-sm">
                                    {item.specifications.steps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex">
                                        <span className="font-medium text-purple-600 mr-2">{stepIndex + 1}.</span>
                                        <span className="text-gray-700">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="flex justify-between items-center py-3 px-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <span className="font-bold text-purple-900">Special Jobs Total:</span>
                            <span className="font-bold text-purple-900 text-lg">£{summary.cost_breakdown.special.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Special Jobs</h3>
                        <p className="text-gray-500">No special job items in this quote.</p>
                      </div>
                    )}
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

              {/* Total Wall Area Features */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">✓ Total Wall Area Features</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Complete wall surface calculations</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Total ceiling area measurements</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Real-time treatment costing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Simplified area-based pricing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Comprehensive specifications</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Professional documentation</span>
                  </div>
                </div>
              </div>

              {/* Quote Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Project Statistics</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Line Items:</span>
                    <span className="font-medium">{quote.line_items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rooms Included:</span>
                    <span className="font-medium">{summary.total_rooms}</span>
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
                    Download PDF
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
                    View Project
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

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Quote Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Total Wall Area approach for simplified pricing</p>
                  <p>• Room measurements are area-based totals</p>
                  <p>• All materials and labor costs included</p>
                  <p>• Special jobs include complete specifications</p>
                  <p>• PDF includes comprehensive project details</p>
                  <p>• Real-time calculations ensure accuracy</p>
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