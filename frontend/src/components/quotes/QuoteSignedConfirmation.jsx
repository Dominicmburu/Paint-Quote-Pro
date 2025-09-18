// src/components/quotes/QuoteSignedConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Download } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const QuoteSignedConfirmation = () => {
    const { quoteId } = useParams();
    const { t } = useTranslation();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuote();
    }, [quoteId]);

    const loadQuote = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/public`);
            const data = await response.json();
            setQuote(data.quote);
        } catch (error) {
            console.error(t('Failed to load quote:'), error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">{t('Quote not found')}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('Quote Signed Successfully!')}</h2>
                    <p className="text-gray-600 mb-4">
                        {t('Thank you for digitally signing the quote. You will receive a confirmation email shortly.')}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-600">{t('Quote #{{number}}', { number: quote.quote_number })}</p>
                        <p className="text-sm text-gray-600">{t('Project: {{name}}', { name: quote.project_name })}</p>
                        <p className="text-lg font-semibold">{t('Total: £{{amount}}', { 
                            amount: quote.total_amount?.toLocaleString() 
                        })}</p>
                    </div>
                    <a 
                        href={`${API_BASE_URL}/quotes/${quoteId}/download-signed`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {t('Download Signed Quote')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default QuoteSignedConfirmation;