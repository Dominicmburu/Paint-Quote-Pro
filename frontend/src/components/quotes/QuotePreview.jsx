import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download, Send, Edit, Eye, ArrowLeft, CheckCircle, AlertCircle,
  Building, Square, DoorClosed, Building2, AlertTriangle, FileText,
  Ruler, Layers, Info, Settings
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { useTranslation } from '../../hooks/useTranslation';

const QuotePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      setError(t('Failed to load quote'));
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

      setSuccessMessage(t('Comprehensive quote PDF downloaded successfully!'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(t('Failed to download quote PDF'));
    }
  };

  const sendQuote = async () => {
    try {
      setSending(true);
      await api.post(`/quotes/${id}/send`, {
        client_email: quote.client_email
      });

      setSuccessMessage(t('Comprehensive quote sent successfully to client!'));
      setTimeout(() => setSuccessMessage(''), 5000);

      loadQuote();
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to send quote'));
    } finally {
      setSending(false);
    }
  };

  // 🔧 FIXED: Organize line items - NO GENERAL CATEGORY
  const organizeLineItems = (lineItems, measurementDetails) => {
    const organized = {
      rooms: {},
      interior: [],
      exterior: [],
      special: []
      // 🔧 REMOVED: general: []
    };

    console.log('🔍 Organizing line items:', lineItems);
    console.log('🔍 Measurement details:', measurementDetails);

    // Group line items by category
    lineItems.forEach(item => {
      const category = item.category || 'special';  // Default to special instead of general

      if (category === 'room_work') {
        const roomName = item.room || t('Unknown Room');
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
        console.log(`✅ Added ${item.surface} item for ${roomName}: €${item.total}`);
      } else if (category in organized) {
        organized[category].push(item);
        console.log(`✅ Added ${category} item: ${item.description}`);
      } else {
        // Put unknown categories in special instead of general
        organized.special.push(item);
        console.log(`✅ Added unknown category '${category}' item to special: ${item.description}`);
      }
    });

    // Add room data from measurement details
    if (measurementDetails && measurementDetails.rooms) {
      measurementDetails.rooms.forEach(roomData => {
        const roomName = roomData.name;
        if (organized.rooms[roomName]) {
          organized.rooms[roomName].room_data = roomData;
          console.log(`✅ Added room data for ${roomName}:`, roomData);
        }
      });
    }

    console.log('📊 Final organized items:', organized);
    return organized;
  };

  // 🔧 FIXED: Calculate summary - NO GENERAL CATEGORY
  const calculateSummary = (organizedItems, measurementDetails) => {
    const roomsData = measurementDetails?.rooms || [];

    // Calculate total areas from room data
    const totalWallArea = roomsData.reduce((sum, room) => {
      const wallArea = parseFloat(room.total_wall_area || room.walls_surface_m2 || 0);
      return sum + wallArea;
    }, 0);

    const totalCeilingArea = roomsData.reduce((sum, room) => {
      const ceilingArea = parseFloat(room.total_ceiling_area || room.area_m2 || 0);
      return sum + ceilingArea;
    }, 0);

    return {
      total_rooms: Object.keys(organizedItems.rooms).length,
      total_wall_area: totalWallArea,
      total_ceiling_area: totalCeilingArea,
      total_interior_items: organizedItems.interior.length,
      total_exterior_items: organizedItems.exterior.length,
      total_special_jobs: organizedItems.special.length,
      cost_breakdown: {
        rooms: Object.values(organizedItems.rooms).reduce((sum, room) => sum + room.totals.room_total, 0),
        interior: organizedItems.interior.reduce((sum, item) => sum + item.total, 0),
        exterior: organizedItems.exterior.reduce((sum, item) => sum + item.total, 0),
        special: organizedItems.special.reduce((sum, item) => sum + item.total, 0)
        // 🔧 REMOVED: general: organizedItems.general.reduce((sum, item) => sum + item.total, 0)
      }
    };
  };

  if (loading) {
    return <Loading message={t("Loading comprehensive quote...")} />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('Quote Not Found')}</h2>
          <p className="text-gray-600 mb-4">{t('The requested comprehensive quote could not be found.')}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Back to Dashboard')}
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
      <div className="bg-gradient-to-r from-[#4bb4f5] to-[#4bb4f5] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                to={`/projects/${quote.project?.id}`}
                className="text-white hover:text-gray-200 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{t('Quote Preview - Total Wall Area')}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm opacity-90">#{quote.quote_number}</p>
                  <span className="text-xs bg-white text-slate-900 bg-opacity-20 px-2 py-1 rounded-full">
                    {t('Total Wall Area')}
                  </span>
                  <span className="text-xs bg-green-500 bg-opacity-80 px-2 py-1 rounded-full">
                    {t('Real-time Calculated')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-slate-900 rounded-md font-medium transition-colors"
              >
                <Download className="h-4 w-4 mr-2 text-slate-900" />
                {t('Download PDF')}
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
                      {t('Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('Send to Client')}
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
            <div className="bg-gradient-to-r from-[#4bb4f5] to-[#4bb4f5] text-white rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('Project Overview')}</h3>
                  <div className="space-y-1 text-sm opacity-90">
                    <div>{quote.project_name}</div>
                    <div>{quote.property_address}</div>
                    <div>{t('Client:')} {quote.client_company_name || t('Not specified')}</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('Total Wall Area Summary')}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="opacity-75">{t('Rooms:')}</div>
                      <div className="font-medium">{summary.total_rooms}</div>
                    </div>
                    <div>
                      <div className="opacity-75">{t('Wall Area:')}</div>
                      <div className="font-medium">{summary.total_wall_area.toFixed(1)}m²</div>
                    </div>
                    <div>
                      <div className="opacity-75">{t('Ceiling Area:')}</div>
                      <div className="font-medium">{summary.total_ceiling_area.toFixed(1)}m²</div>
                    </div>
                    <div>
                      <div className="opacity-75">{t('Items:')}</div>
                      <div className="font-medium">{summary.total_interior_items + summary.total_exterior_items}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('Quote Total')}</h3>
                  <div className="text-3xl font-bold">€{quote.total_amount.toFixed(2)}</div>
                  <div className="text-sm opacity-90">{t('Valid until:')} {new Date(quote.valid_until).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs - REMOVED GENERAL TAB */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: t('Overview'), icon: FileText },
                    { id: 'rooms', label: t('Room Details'), icon: Building },
                    { id: 'interior', label: t('Interior Work'), icon: DoorClosed },
                    { id: 'exterior', label: t('Exterior Work'), icon: Building2 },
                    { id: 'special', label: t('Special Jobs'), icon: AlertTriangle }
                    // 🔧 REMOVED: general tab
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                        ? 'border-[#4bb4f5] text-[#4bb4f5]'
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
                {/* Overview Tab - UPDATED WITHOUT GENERAL SERVICES */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('Quote Summary')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-3">{t('Work Breakdown')}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>{t('Room Work:')}</span>
                              <span className="font-medium">€{summary.cost_breakdown.rooms.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Interior Items:')}</span>
                              <span className="font-medium">€{summary.cost_breakdown.interior.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Exterior Items:')}</span>
                              <span className="font-medium">€{summary.cost_breakdown.exterior.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Special Jobs:')}</span>
                              <span className="font-medium">€{summary.cost_breakdown.special.toFixed(2)}</span>
                            </div>
                            {/* 🔧 REMOVED: General Services row */}
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-3">{t('Quote Totals')}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>{t('Subtotal:')}</span>
                              <span className="font-medium">€{quote.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('VAT (20%):')}</span>
                              <span className="font-medium">€{quote.vat_amount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-green-200 pt-2 mt-2">
                              <div className="flex justify-between font-bold">
                                <span>{t('Total Amount:')}</span>
                                <span className="text-lg">€{quote.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Client and Project Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">{t('Project & Client Information')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{t('Project Details')}</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><strong>{t('Project:')}</strong> {quote.project_name}</div>
                            <div><strong>{t('Address:')}</strong> {quote.property_address}</div>
                            <div><strong>{t('Type:')}</strong> {quote.project_type}</div>
                            <div><strong>{t('Property:')}</strong> {quote.property_type}</div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{t('Client Information')}</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><strong>{t('Company:')}</strong> {quote.client_company_name || t('Not specified')}</div>
                            <div><strong>{t('Contact:')}</strong> {quote.client_contact_name || t('Not specified')}</div>
                            <div><strong>{t('Email:')}</strong> {quote.client_email || t('Not specified')}</div>
                            <div><strong>{t('Phone:')}</strong> {quote.client_phone || t('Not specified')}</div>
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
                      <h4 className="font-medium text-blue-900 mb-2">💡 {t('Total Wall Area Approach')}</h4>
                      <p className="text-sm text-blue-800">
                        {t('This quote uses the total wall area method where each room shows the complete wall surface area and ceiling area with selected treatments applied across the entire area.')}
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
                                {t('Total:')} €{roomData.totals.room_total.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Room Area Information */}
                          {roomData.room_data && (
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-blue-700">
                              <div>
                                <span className="font-medium">{t('Total Wall Area:')}</span> {parseFloat(roomData.room_data.total_wall_area || roomData.room_data.walls_surface_m2 || 0).toFixed(2)}m²
                              </div>
                              <div>
                                <span className="font-medium">{t('Ceiling Area:')}</span> {parseFloat(roomData.room_data.total_ceiling_area || roomData.room_data.area_m2 || 0).toFixed(2)}m²
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
                                {t('Wall Treatments')}
                              </h5>
                              <div className="space-y-2">
                                {roomData.wall_items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || t('Treatment')}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity.toFixed(2)}m² × €{item.unit_price.toFixed(2)}/m²
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-gray-900">€{item.total.toFixed(2)}</div>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                  <span className="font-medium text-blue-900">{t('Wall Work Subtotal:')}</span>
                                  <span className="font-bold text-blue-900">€{roomData.totals.wall_total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ceiling Work - Simple Row Display */}
                          {roomData.ceiling_items.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <Layers className="h-4 w-4 mr-2 text-[#4bb4f5]" />
                                {t('Ceiling Treatments')}
                              </h5>
                              <div className="space-y-2">
                                {roomData.ceiling_items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {item.treatment?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || t('Treatment')}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity.toFixed(2)}m² × €{item.unit_price.toFixed(2)}/m²
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-gray-900">€{item.total.toFixed(2)}</div>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                                  <span className="font-medium text-green-900">{t('Ceiling Work Subtotal:')}</span>
                                  <span className="font-bold text-green-900">€{roomData.totals.ceiling_total.toFixed(2)}</span>
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No Room Work')}</h3>
                        <p className="text-gray-500">{t('No room-specific work items in this quote.')}</p>
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
                            {t('Interior Work Items')}
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
                                  {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)} {t('each')}
                                </div>
                                {item.specifications?.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.specifications.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">€{item.total.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-between items-center py-3 px-4 bg-orange-100 rounded-lg border-2 border-orange-300">
                            <span className="font-bold text-orange-900">{t('Interior Work Total:')}</span>
                            <span className="font-bold text-orange-900 text-lg">€{summary.cost_breakdown.interior.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <DoorClosed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No Interior Work')}</h3>
                        <p className="text-gray-500">{t('No interior work items in this quote.')}</p>
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
                            {t('Exterior Work Items')}
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
                                  {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)} {t('each')}
                                </div>
                                {item.specifications?.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.specifications.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">€{item.total.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                            <span className="font-bold text-blue-900">{t('Exterior Work Total:')}</span>
                            <span className="font-bold text-blue-900 text-lg">€{summary.cost_breakdown.exterior.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No Exterior Work')}</h3>
                        <p className="text-gray-500">{t('No exterior work items in this quote.')}</p>
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
                          <h4 className="text-lg font-semibold text-[#4bb4f5] flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            {t('Special Jobs')}
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
                                    {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)} {t('per')} {item.unit}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-[#4bb4f5] text-xl">€{item.total.toFixed(2)}</div>
                                </div>
                              </div>

                              {/* Job specifications */}
                              {item.specifications && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    {item.specifications.category && (
                                      <div><span className="font-medium">{t('Category:')}</span> {item.specifications.category}</div>
                                    )}
                                    {item.specifications.difficulty && (
                                      <div><span className="font-medium">{t('Difficulty:')}</span> {item.specifications.difficulty}</div>
                                    )}
                                    {item.specifications.location && (
                                      <div><span className="font-medium">{t('Location:')}</span> {item.specifications.location}</div>
                                    )}
                                  </div>
                                  <div>
                                    {item.specifications.materials_included !== undefined && (
                                      <div>
                                        <span className="font-medium">{t('Materials:')}</span>
                                        <span className={item.specifications.materials_included ? 'text-green-600' : 'text-red-600'}>
                                          {item.specifications.materials_included ? t(' ✓ Included') : t(' ✗ Not Included')}
                                        </span>
                                      </div>
                                    )}
                                    {item.specifications.notes && (
                                      <div><span className="font-medium">{t('Notes:')}</span> {item.specifications.notes}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Process steps if available */}
                              {item.specifications?.steps && item.specifications.steps.length > 0 && (
                                <div className="mt-4">
                                  <h6 className="font-medium text-gray-900 mb-2">{t('Process Steps:')}</h6>
                                  <ol className="space-y-1 text-sm">
                                    {item.specifications.steps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex">
                                        <span className="font-medium text-[#4bb4f5] mr-2">{stepIndex + 1}.</span>
                                        <span className="text-gray-700">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="flex justify-between items-center py-3 px-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <span className="font-bold text-[#4bb4f5]">{t('Special Jobs Total:')}</span>
                            <span className="font-bold text-[#4bb4f5] text-lg">€{summary.cost_breakdown.special.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No Special Jobs')}</h3>
                        <p className="text-gray-500">{t('No special job items in this quote.')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quote Totals - Always Visible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('Quote Summary')}</h3>
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('Subtotal:')}</span>
                  <span className="font-medium text-gray-900">€{quote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('VAT (20%):')}</span>
                  <span className="font-medium text-gray-900">€{quote.vat_amount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">{t('Total Amount:')}</span>
                    <span className="text-2xl font-bold text-[#4bb4f5]">€{quote.total_amount.toFixed(2)}</span>
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
                <h4 className="font-semibold text-gray-900 mb-4">{t('Quote Status')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('Status:')}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        quote.status === 'accepted' ? 'bg-green-100 text-[#4bb4f5]' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {t(quote.status.charAt(0).toUpperCase() + quote.status.slice(1))}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>{t('Created:')} {new Date(quote.created_at).toLocaleDateString()}</p>
                    {quote.sent_at && (
                      <p>{t('Sent:')} {new Date(quote.sent_at).toLocaleDateString()}</p>
                    )}
                    <p>{t('Valid until:')} {new Date(quote.valid_until).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Total Wall Area Features */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">✓ {t('Total Wall Area Features')}</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Complete wall surface calculations')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Total ceiling area measurements')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Real-time treatment costing')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Simplified area-based pricing')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Comprehensive specifications')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{t('Professional documentation')}</span>
                  </div>
                </div>
              </div>

              {/* Quote Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">{t('Project Statistics')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Total Line Items:')}</span>
                    <span className="font-medium">{quote.line_items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Rooms Included:')}</span>
                    <span className="font-medium">{summary.total_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Total Wall Area:')}</span>
                    <span className="font-medium">{summary.total_wall_area.toFixed(1)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Total Ceiling Area:')}</span>
                    <span className="font-medium">{summary.total_ceiling_area.toFixed(1)}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Interior Items:')}</span>
                    <span className="font-medium">{summary.total_interior_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Exterior Items:')}</span>
                    <span className="font-medium">{summary.total_exterior_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('Special Jobs:')}</span>
                    <span className="font-medium">{summary.total_special_jobs}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">{t('Cost Breakdown')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('Room Work:')}</span>
                    <div className="text-right">
                      <div className="font-medium">€{summary.cost_breakdown.rooms.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.rooms / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('Interior Work:')}</span>
                    <div className="text-right">
                      <div className="font-medium">€{summary.cost_breakdown.interior.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.interior / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('Exterior Work:')}</span>
                    <div className="text-right">
                      <div className="font-medium">€{summary.cost_breakdown.exterior.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.exterior / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('Special Jobs:')}</span>
                    <div className="text-right">
                      <div className="font-medium">€{summary.cost_breakdown.special.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((summary.cost_breakdown.special / quote.subtotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>                  
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">{t('Quick Actions')}</h4>
                <div className="space-y-3">
                  <button
                    onClick={downloadPDF}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Download PDF')}
                  </button>

                  {quote.status === 'draft' && quote.client_email && (
                    <button
                      onClick={sendQuote}
                      disabled={sending}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#4bb4f5] hover:bg-[#4bb4f5] disabled:opacity-50 text-white rounded-md text-sm transition-colors"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('Sending...')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t('Send to Client')}
                        </>
                      )}
                    </button>
                  )}

                  <Link
                    to={`/projects/${quote.project?.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-md text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('View Project')}
                  </Link>

                  <Link
                    to={`/quotes/${quote.id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md text-sm transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('Edit Quote')}
                  </Link>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💡 {t('Quote Information')}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• {t('Total Wall Area approach for simplified pricing')}</p>
                  <p>• {t('Room measurements are area-based totals')}</p>
                  <p>• {t('All materials and labor costs included')}</p>
                  <p>• {t('Special jobs include complete specifications')}</p>
                  <p>• {t('PDF includes comprehensive project details')}</p>
                  <p>• {t('Real-time calculations ensure accuracy')}</p>
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