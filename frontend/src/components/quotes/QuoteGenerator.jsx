// components/quotes/QuoteGenerator.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, Send, Calculator, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuoteGenerator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [quoteData, setQuoteData] = useState({
    title: '',
    description: '',
    line_items: [],
    valid_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.project);
      
      // Set default quote title
      setQuoteData(prev => ({
        ...prev,
        title: `Paint Quote - ${response.data.project.name}`,
        description: `Professional painting quote for ${response.data.project.name}`
      }));
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      unit: 'm²',
      unit_price: 0,
      total: 0
    };
    
    setQuoteData(prev => ({
      ...prev,
      line_items: [...prev.line_items, newItem]
    }));
  };

  const updateLineItem = (itemId, field, value) => {
    setQuoteData(prev => ({
      ...prev,
      line_items: prev.line_items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total when quantity or unit_price changes
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total = (parseFloat(updatedItem.quantity) || 0) * (parseFloat(updatedItem.unit_price) || 0);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (itemId) => {
    setQuoteData(prev => ({
      ...prev,
      line_items: prev.line_items.filter(item => item.id !== itemId)
    }));
  };

  const autoGenerateQuote = async () => {
    try {
      setGenerating(true);
      const response = await api.post(`/quotes/project/${id}/auto-generate`, {
        title: quoteData.title,
        description: quoteData.description,
        valid_days: quoteData.valid_days
      });
      
      setQuoteData(prev => ({
        ...prev,
        line_items: response.data.quote.line_items
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to auto-generate quote');
    } finally {
      setGenerating(false);
    }
  };

  const generateQuote = async () => {
    if (quoteData.line_items.length === 0) {
      setError('Please add at least one line item to the quote');
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post(`/quotes/project/${id}`, quoteData);
      
      // Navigate to quote preview or download
      const quoteId = response.data.quote.id;
      navigate(`/quotes/${quoteId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quote');
    } finally {
      setGenerating(false);
    }
  };

  const calculateSubtotal = () => {
    return quoteData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateVAT = (subtotal) => {
    const vatRate = 0.20; // 20% VAT
    return subtotal * vatRate;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = calculateVAT(subtotal);
    return subtotal + vat;
  };

  if (loading) {
    return <Loading message="Loading project..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-700">Generate Quote</h1>
        <p className="text-gray-600 mt-2">Create a professional quote for {project?.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quote Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-purple-700 mb-4">Quote Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Title
                </label>
                <input
                  type="text"
                  value={quoteData.title}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter quote title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={quoteData.description}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief description of the work to be done"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid for (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={quoteData.valid_days}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, valid_days: parseInt(e.target.value) || 30 }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Auto-Generate */}
          {project?.floor_plan_analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">AI-Powered Quote Generation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Generate line items automatically based on your floor plan analysis
                  </p>
                </div>
                <button
                  onClick={autoGenerateQuote}
                  disabled={generating}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Auto Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-700">Line Items</h3>
              <button
                onClick={addLineItem}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {quoteData.line_items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No line items added yet</p>
                <p className="text-sm">Add items manually or use auto-generate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteData.line_items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">Item {index + 1}</h4>
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Description of work"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total (£)
                        </label>
                        <input
                          type="text"
                          value={item.total?.toFixed(2) || '0.00'}
                          disabled
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateQuote}
              disabled={generating || quoteData.line_items.length === 0}
              className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Generate Quote
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quote Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-medium text-purple-700 mb-4">Quote Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{quoteData.line_items.length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">£{calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (20%):</span>
                <span className="font-medium">£{calculateVAT(calculateSubtotal()).toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-green-600">£{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {project && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Project Info</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Client:</span>
                    <span className="ml-2">{project.client_name || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Project:</span>
                    <span className="ml-2">{project.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valid until:</span>
                    <span className="ml-2">
                      {new Date(Date.now() + quoteData.valid_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;