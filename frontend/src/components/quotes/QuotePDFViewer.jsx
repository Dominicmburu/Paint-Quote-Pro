// src/components/quotes/QuotePDFViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const QuotePDFViewer = () => {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadQuote();
    }, [quoteId]);

    const loadQuote = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/public`);
            
            if (!response.ok) {
                throw new Error('Quote not found');
            }
            
            const data = await response.json();
            setQuote(data.quote);
        } catch (error) {
            console.error('Failed to load quote:', error);
            setError('Failed to load quote details');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Handle download without exposing backend URL
    const downloadPDF = async () => {
        try {
            const downloadUrl = quote.is_signed 
                ? `${API_BASE_URL}/quotes/${quoteId}/download-signed`
                : `${API_BASE_URL}/quotes/${quoteId}/download-public`;
            
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const filename = quote.is_signed 
                ? `signed_quote_${quote.quote_number}.pdf`
                : `quote_${quote.quote_number}.pdf`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error || 'Quote not found'}</p>
                        <button 
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="text-gray-600 hover:text-gray-900 mr-4"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    Quote PDF - #{quote.quote_number}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {quote.is_signed ? 'Signed Quote' : 'Quote Document'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* ✅ FIXED: Use button instead of direct URL */}
                            <button
                                onClick={downloadPDF}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Quote Summary */}
                    <div className="p-6 bg-gray-50 border-b">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Quote Details</h2>
                            {quote.is_signed && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    ✅ Signed
                                </span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Quote Number</p>
                                <p className="font-medium">{quote.quote_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Project</p>
                                <p className="font-medium">{quote.project_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-xl font-bold text-blue-600">£{quote.total_amount?.toLocaleString()}</p>
                            </div>
                        </div>

                        {quote.is_signed && quote.signed_at && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <strong>Signed on:</strong> {new Date(quote.signed_at).toLocaleDateString()} at {new Date(quote.signed_at).toLocaleTimeString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PDF Viewer */}
                    <div className="p-6">
                        <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Quote PDF Document</h3>
                            <p className="text-gray-600 mb-6">
                                Click the download button to view the full PDF document.
                            </p>
                            
                            <div className="space-y-3">
                                {/* ✅ FIXED: Use button instead of direct URL */}
                                <button
                                    onClick={downloadPDF}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    {quote.is_signed ? 'Download Signed Quote PDF' : 'Download Quote PDF'}
                                </button>
                                
                                {!quote.is_signed && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Need to sign this quote?</p>
                                        <button
                                            onClick={() => navigate(`/quotes/${quoteId}/sign`)}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Sign Quote Digitally
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotePDFViewer;