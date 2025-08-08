// src/components/quotes/QuoteManagement.jsx - Updated with frontend URLs
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    Send,
    Download,
    Edit,
    Share2,
    CheckCircle,
    Clock,
    Copy,
    Mail,
    ExternalLink,
    Edit2
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuoteManagement = () => {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [signatureStatus, setSignatureStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadQuoteData();
    }, [quoteId]);

    const loadQuoteData = async () => {
        try {
            setLoading(true);
            const [quoteResponse, signatureResponse] = await Promise.all([
                api.get(`/quotes/${quoteId}`),
                api.get(`/quotes/${quoteId}/signature-status`)
            ]);

            setQuote(quoteResponse.data.quote);
            setSignatureStatus(signatureResponse.data);
        } catch (error) {
            console.error('Failed to load quote data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendQuote = async () => {
        try {
            setSending(true);

            const response = await api.post(`/quotes/${quoteId}/send`, {
                client_email: quote.client_email
            });

            alert('Quote sent successfully with signature link!');
            loadQuoteData(); // Refresh data
        } catch (error) {
            console.error('Failed to send quote:', error);
            alert('Failed to send quote. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // Frontend signature URL instead of backend
    const getSignatureUrl = () => {
        return `${window.location.origin}/quotes/${quoteId}/sign`;
    };

    const copySignatureLink = async () => {
        try {
            await navigator.clipboard.writeText(getSignatureUrl());
            alert('Signature link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy link:', error);
            alert('Failed to copy link');
        }
    };

    const openEmailClient = () => {
        const signatureUrl = getSignatureUrl();
        const subject = encodeURIComponent(`Quote Signature Required - ${quote.quote_number}`);
        const body = encodeURIComponent(`Dear ${quote.client_company_name || 'Client'},

Please review and sign the attached quote by clicking the link below:

${signatureUrl}

Quote Details:
- Quote Number: ${quote.quote_number}
- Project: ${quote.project_name}
- Total Amount: £${quote.total_amount.toLocaleString()}

This link will allow you to digitally sign the quote securely.

Best regards,
${quote.company.name}`);

        window.location.href = `mailto:${quote.client_email}?subject=${subject}&body=${body}`;
    };

    if (loading) {
        return <Loading />;
    }

    if (!quote) {
        return <div className="text-center p-8">Quote not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quote #{quote.quote_number}</h1>
                        <p className="text-gray-600">{quote.title}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        {signatureStatus?.is_signed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Signed
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                <Clock className="h-4 w-4 mr-1" />
                                Awaiting Signature
                            </span>
                        )}
                    </div>
                </div>

                {/* Quote Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Project:</span>
                        <span className="ml-2 font-medium">{quote.project_name}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Client:</span>
                        <span className="ml-2 font-medium">{quote.client_company_name}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="ml-2 font-medium text-lg">£{quote.total_amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Signature Info */}
                {signatureStatus?.is_signed && signatureStatus.signature && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <h3 className="font-medium text-green-800 mb-2">Signature Details</h3>
                        <div className="text-sm text-green-700">
                            <p>Signed by: {signatureStatus.signature.client_name}</p>
                            <p>Email: {signatureStatus.signature.client_email}</p>
                            <p>Signed on: {new Date(signatureStatus.signed_at).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Download PDF */}
                    <a 
                        href={`/api/quotes/${quoteId}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </a>

                    {/* Edit Quote */}
                    <button
                        onClick={() => navigate(`/quotes/${quoteId}/edit`)}
                        disabled={signatureStatus?.is_signed}
                        className="flex items-center justify-center px-4 py-3 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Quote
                    </button>

                    {/* Send Quote Email */}
                    {!signatureStatus?.is_signed && (
                        <button
                            onClick={handleSendQuote}
                            disabled={sending}
                            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {sending ? 'Sending...' : 'Send Email'}
                        </button>
                    )}

                    {/* Sign Quote Button */}
                    {!signatureStatus?.is_signed && (
                        <a 
                            href={getSignatureUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Sign Quote
                        </a>
                    )}

                    {/* Share Signature Link */}
                    {!signatureStatus?.is_signed && (
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Link
                        </button>
                    )}
                </div>
            </div>

            {/* Quote Details Table - Same as before */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Details</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quote.line_items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.quantity} {item.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        £{item.unit_price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        £{item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                    Subtotal:
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    £{quote.subtotal.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                    VAT (20%):
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    £{quote.vat_amount.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                                    Total:
                                </td>
                                <td className="px-6 py-4 text-lg font-bold text-gray-900">
                                    £{quote.total_amount.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Share Signature Link</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Signature URL
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={getSignatureUrl()}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                />
                                <button
                                    onClick={copySignatureLink}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <button
                                onClick={openEmailClient}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Send via Email
                            </button>

                            <a 
                                href={getSignatureUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                            </a>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteManagement;