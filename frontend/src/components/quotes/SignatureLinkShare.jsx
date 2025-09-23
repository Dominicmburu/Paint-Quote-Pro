import React, { useState } from 'react';
import { Copy, ExternalLink, Mail, MessageCircle } from 'lucide-react';

const SignatureLinkShare = ({ quote, onClose }) => {
  const [copied, setCopied] = useState(false);
  const signatureUrl = `${window.location.origin}/api/quotes/${quote.id}/sign`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(signatureUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openEmailClient = () => {
    const subject = encodeURIComponent(`Quote Signature Required - ${quote.quote_number}`);
    const body = encodeURIComponent(`Dear ${quote.client_company_name || 'Client'},

Please review and sign the attached quote by clicking the link below:

${signatureUrl}

Quote Details:
- Quote Number: ${quote.quote_number}
- Project: ${quote.project_name}
- Total Amount: €${quote.total_amount.toLocaleString()}

This link will allow you to digitally sign the quote. The signature has the same legal validity as a handwritten signature.

Best regards,
${quote.company.name}`);
    
    window.location.href = `mailto:${quote.client_email}?subject=${subject}&body=${body}`;
  };

  return (
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
              value={signatureUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="text-green-600 text-sm mt-1">✓ Copied to clipboard!</p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <button
            onClick={openEmailClient}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send via Email
          </button>
          
          
            <a href={signatureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </a>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureLinkShare;