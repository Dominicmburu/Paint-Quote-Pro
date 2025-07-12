import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Send, Edit, Eye, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      const response = await api.get(`/quotes/${id}`);
      setQuote(response.data.quote);
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
      link.setAttribute('download', `quote_${quote.quote_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMessage('Quote PDF downloaded successfully!');
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
      
      setSuccessMessage('Quote sent successfully to client!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Reload quote to get updated status
      loadQuote();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  // Organize line items by category
  const organizeLineItems = (lineItems) => {
    const organized = {
      rooms: {},
      interior: [],
      exterior: [],
      special: [],
      general: []
    };

    lineItems.forEach(item => {
      const description = item.description;
      
      if (description.includes(' - ') && !description.startsWith('Interior -') && !description.startsWith('Exterior -') && !description.startsWith('Special Job -')) {
        // Room-based items
        const parts = description.split(' - ');
        const roomName = parts[0];
        const workDescription = parts.slice(1).join(' - ');
        
        if (!organized.rooms[roomName]) {
          organized.rooms[roomName] = [];
        }
        organized.rooms[roomName].push({
          ...item,
          workDescription
        });
      } else if (description.startsWith('Interior -')) {
        organized.interior.push(item);
      } else if (description.startsWith('Exterior -')) {
        organized.exterior.push(item);
      } else if (description.startsWith('Special Job -')) {
        organized.special.push(item);
      } else {
        organized.general.push(item);
      }
    });

    return organized;
  };

  if (loading) {
    return <Loading message="Loading quote..." />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600 mb-4">The requested quote could not be found.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quote Preview</h1>
                <p className="text-sm text-gray-600 mt-1">Quote #{quote.quote_number}</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              
              {quote.status === 'draft' && quote.client_email && (
                <button
                  onClick={sendQuote}
                  disabled={sending}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
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
            {/* Quote Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{quote.title}</h2>
                  <p className="opacity-90">{quote.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">#{quote.quote_number}</p>
                  <p className="opacity-90 text-sm">
                    Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Project & Client Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Project:</span>
                      <span className="ml-2 font-medium">{quote.project_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{quote.property_address}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="ml-2 font-medium">{quote.client_company_name || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{quote.client_email || 'Not specified'}</span>
                    </div>
                    {quote.client_phone && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{quote.client_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Room-by-Room Breakdown */}
            {Object.keys(organizedItems.rooms).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Room-by-Room Breakdown</h3>
                
                {Object.entries(organizedItems.rooms).map(([roomName, roomItems]) => (
                  <div key={roomName} className="mb-6 last:mb-0">
                    <h4 className="text-md font-medium text-blue-600 mb-3 pb-2 border-b border-blue-100">
                      {roomName}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (m²)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {roomItems.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.workDescription}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.quantity.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50">
                            <td colSpan="3" className="px-4 py-3 text-sm font-medium text-blue-900">
                              {roomName} Subtotal:
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-900">
                              £{roomItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interior Items */}
            {organizedItems.interior.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interior Items</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="bg-orange-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {organizedItems.interior.map((item, index) => (
                       <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.description.replace('Interior - ', '')}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                         <td className="px-4 py-3 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-orange-100">
                       <td colSpan="3" className="px-4 py-3 text-sm font-medium text-orange-900">
                         Interior Items Subtotal:
                       </td>
                       <td className="px-4 py-3 text-sm font-bold text-orange-900">
                         £{organizedItems.interior.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </div>
           )}

           {/* Exterior Items */}
           {organizedItems.exterior.length > 0 && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Exterior Items</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="bg-blue-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {organizedItems.exterior.map((item, index) => (
                       <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.description.replace('Exterior - ', '')}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                         <td className="px-4 py-3 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-blue-100">
                       <td colSpan="3" className="px-4 py-3 text-sm font-medium text-blue-900">
                         Exterior Items Subtotal:
                       </td>
                       <td className="px-4 py-3 text-sm font-bold text-blue-900">
                         £{organizedItems.exterior.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </div>
           )}

           {/* Special Jobs */}
           {organizedItems.special.length > 0 && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Jobs</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="bg-purple-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {organizedItems.special.map((item, index) => (
                       <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.description.replace('Special Job - ', '')}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                         <td className="px-4 py-3 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-purple-100">
                       <td colSpan="3" className="px-4 py-3 text-sm font-medium text-purple-900">
                         Special Jobs Subtotal:
                       </td>
                       <td className="px-4 py-3 text-sm font-bold text-purple-900">
                         £{organizedItems.special.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </div>
           )}

           {/* General Items */}
           {organizedItems.general.length > 0 && (
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Services</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="bg-green-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {organizedItems.general.map((item, index) => (
                       <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                         <td className="px-4 py-3 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                         <td className="px-4 py-3 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-green-100">
                       <td colSpan="3" className="px-4 py-3 text-sm font-medium text-green-900">
                         Additional Services Subtotal:
                       </td>
                       <td className="px-4 py-3 text-sm font-bold text-green-900">
                         £{organizedItems.general.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </div>
           )}

           {/* Quote Totals */}
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

           {/* Terms & Conditions */}
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
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
               </ul>
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

             {/* Quote Statistics */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h4 className="font-semibold text-gray-900 mb-4">Quote Statistics</h4>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Total Items:</span>
                   <span className="font-medium">{quote.line_items?.length || 0}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Rooms:</span>
                   <span className="font-medium">{Object.keys(organizedItems.rooms).length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Interior Items:</span>
                   <span className="font-medium">{organizedItems.interior.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Exterior Items:</span>
                   <span className="font-medium">{organizedItems.exterior.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Special Jobs:</span>
                   <span className="font-medium">{organizedItems.special.length}</span>
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
               </div>
             </div>

             {/* Project Summary */}
             {quote.project && (
               <div className="bg-blue-50 rounded-lg p-4">
                 <h4 className="font-semibold text-blue-900 mb-2">Project Summary</h4>
                 <div className="space-y-1 text-sm text-blue-800">
                   <div><strong>Project:</strong> {quote.project_name}</div>
                   <div><strong>Client:</strong> {quote.client_company_name || 'Not specified'}</div>
                   <div><strong>Property:</strong> {quote.project?.property_type}</div>
                   <div><strong>Status:</strong> {quote.project?.status}</div>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default QuotePreview;