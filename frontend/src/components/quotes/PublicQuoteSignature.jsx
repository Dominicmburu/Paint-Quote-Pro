// src/components/quotes/PublicQuoteSignature.jsx - Updated version
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Download, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const PublicQuoteSignature = () => {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [signaturePad, setSignaturePad] = useState(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        acceptTerms: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadQuote();
        loadSignaturePadScript();
    }, [quoteId]);

    // Initialize signature pad after script loads and canvas is available
    useEffect(() => {
        if (scriptLoaded && canvasRef.current && !signaturePad) {
            initializeSignaturePad();
        }
    }, [scriptLoaded, quote]); // Also depend on quote so it initializes after the form is rendered

    const loadQuote = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/public`);

            if (!response.ok) {
                throw new Error('Quote not found');
            }

            const data = await response.json();
            setQuote(data.quote);

            // Pre-fill form if client data exists
            if (data.quote.client_company_name) {
                setFormData(prev => ({
                    ...prev,
                    clientName: data.quote.client_company_name,
                    clientEmail: data.quote.client_email || ''
                }));
            }
        } catch (error) {
            console.error('Failed to load quote:', error);
            setError('Failed to load quote. Please check the link and try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadSignaturePadScript = () => {
        // Check if SignaturePad is already available
        if (window.SignaturePad) {
            setScriptLoaded(true);
            return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector('script[src*="signature_pad"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => setScriptLoaded(true));
            return;
        }

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ SignaturePad script loaded');
            setScriptLoaded(true);
        };
        script.onerror = () => {
            console.error('❌ Failed to load SignaturePad script');
            setError('Failed to load signature functionality. Please refresh the page.');
        };
        document.head.appendChild(script);
    };

    const initializeSignaturePad = () => {
        if (!canvasRef.current || !window.SignaturePad || signaturePad) {
            return;
        }

        try {
            console.log('🎨 Initializing signature pad...');

            // Set canvas size first
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // Set the actual size in memory (scaled to account for extra pixel density)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            // Scale the drawing context so everything will work at the higher resolution
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            // Set the size in CSS pixels
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';

            const pad = new window.SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 1)', // White background
                penColor: 'rgb(0, 0, 0)',
                maxWidth: 3,
                minWidth: 1,
                throttle: 16,
                minDistance: 5
            });

            // Add event listeners for better mobile support
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });

            setSignaturePad(pad);
            console.log('✅ Signature pad initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize signature pad:', error);
            setError('Failed to initialize signature pad. Please refresh the page.');
        }
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (signaturePad && canvasRef.current) {
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // Clear the pad and resize
                const imageData = signaturePad.toData();

                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;

                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);

                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';

                signaturePad.clear();
                if (imageData.length > 0) {
                    signaturePad.fromData(imageData);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [signaturePad]);

    const clearSignature = () => {
        if (signaturePad) {
            signaturePad.clear();
            console.log('🧹 Signature cleared');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        setError(''); // Clear previous errors

        if (!formData.clientName.trim()) {
            setError('Please enter your full name.');
            return false;
        }

        if (!formData.clientEmail.trim()) {
            setError('Please enter your email address.');
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.clientEmail)) {
            setError('Please enter a valid email address.');
            return false;
        }

        if (!signaturePad) {
            setError('Signature pad is not ready. Please wait a moment and try again.');
            return false;
        }

        if (signaturePad.isEmpty()) {
            setError('Please provide your digital signature.');
            return false;
        }

        if (!formData.acceptTerms) {
            setError('Please accept the terms and conditions.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        try {
            setSigning(true);

            const signatureData = signaturePad.toDataURL('image/png');
            console.log('📝 Signature data length:', signatureData.length);

            const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_name: formData.clientName,
                    client_email: formData.clientEmail,
                    signature_data: signatureData
                })
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess('Quote signed successfully! You will receive a confirmation email shortly.');

                // Redirect to confirmation page after 3 seconds
                setTimeout(() => {
                    window.location.href = `/quotes/${quoteId}/signed`;
                }, 3000);
            } else {
                setError(result.error || 'Failed to sign quote. Please try again.');
            }

        } catch (error) {
            console.error('❌ Signing error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Quote</h2>
                        <p className="text-gray-600">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (quote?.is_signed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Already Signed</h2>
                        <p className="text-gray-600 mb-4">
                            This quote was digitally signed on {new Date(quote.signed_at).toLocaleDateString()}.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Quote #{quote.quote_number}</p>
                            <p className="text-sm text-gray-600">Project: {quote.project_name}</p>
                            <p className="text-lg font-semibold">Total: £{quote.total_amount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-green-600 text-white p-6">
                        <h1 className="text-2xl font-bold">Digital Quote Signature</h1>
                        <p className="text-blue-100 mt-1">Please review and sign the quote below</p>
                    </div>

                    {/* Quote Summary */}
                    <div className="p-6 bg-gray-50 border-b">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h2>
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
                                <p className="text-xl font-bold text-blue-600">£{quote.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Valid Until</p>
                                <p className="font-medium">{new Date(quote.valid_until).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Signature Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Client Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="clientName"
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="clientEmail"
                                        name="clientEmail"
                                        value={formData.clientEmail}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Signature Pad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Digital Signature *
                                </label>
                                <p className="text-sm text-gray-600 mb-2">
                                    Please sign in the box below using your mouse, trackpad, or finger on mobile devices.
                                </p>

                                {/* Signature Status */}
                                {!scriptLoaded && (
                                    <div className="mb-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                        Loading signature functionality...
                                    </div>
                                )}

                                <div className="border-2 border-gray-300 rounded-md bg-white relative">
                                    <canvas
                                        ref={canvasRef}
                                        width="600"
                                        height="200"
                                        className="w-full h-48 cursor-crosshair touch-none"
                                        style={{
                                            touchAction: 'none',
                                            maxWidth: '100%',
                                            height: '200px'
                                        }}
                                    />
                                    {!signaturePad && scriptLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
                                            Initializing signature pad...
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        disabled={!signaturePad}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear Signature
                                    </button>
                                    {signaturePad && !signaturePad.isEmpty() && (
                                        <span className="px-3 py-2 text-sm text-green-600 bg-green-50 rounded-md">
                                            ✓ Signature captured
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="bg-gray-50 p-4 rounded-md">
                                <label className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I accept the terms and conditions of this quotation and authorize the work to proceed as specified.
                                        I understand this digital signature has the same legal effect as a handwritten signature.
                                    </span>
                                </label>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                    <p className="text-green-800 text-sm">{success}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={signing || !signaturePad || !scriptLoaded}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {signing ? 'Signing...' :
                                        !scriptLoaded ? 'Loading...' :
                                            !signaturePad ? 'Initializing...' :
                                                'Sign Quote Digitally'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicQuoteSignature;