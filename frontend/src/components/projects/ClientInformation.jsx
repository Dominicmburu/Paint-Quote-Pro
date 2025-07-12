import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, AlertCircle, Eye } from 'lucide-react';
import api from '../../services/api';

const ClientInformation = ({ project, onClientUpdate }) => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(project?.client_id || '');
    const [selectedClient, setSelectedClient] = useState(null);
    const [useManualEntry, setUseManualEntry] = useState(!project?.client_id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [manualClientData, setManualClientData] = useState({
        company_name: project?.client_name || '',
        contact_name: '',
        email: project?.client_email || '',
        phone: project?.client_phone || '',
        address: project?.client_address || '',
        postcode: '',
        city: '',
        btw_number: '',
        kvk_number: '',
        iban: '',
        website: ''
    });

    useEffect(() => {
        loadClients();
    }, []);

    // Update selected client when selectedClientId changes
    useEffect(() => {
        if (selectedClientId && clients.length > 0) {
            const client = clients.find(c => c.id === parseInt(selectedClientId));
            setSelectedClient(client || null);
        } else {
            setSelectedClient(null);
        }
    }, [selectedClientId, clients]);

    const loadClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data.clients || []);
        } catch (err) {
            console.error('Failed to load clients:', err);
        }
    };

    const handleClientSelection = (clientId) => {
        setSelectedClientId(clientId);
        if (clientId) {
            setUseManualEntry(false);
        }
    };

    const handleManualEntryToggle = (useManual) => {
        setUseManualEntry(useManual);
        if (useManual) {
            setSelectedClientId('');
            setSelectedClient(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const updateData = {
                client_id: useManualEntry ? null : selectedClientId,
                client_data: useManualEntry ? manualClientData : null,
                client_name: useManualEntry ? manualClientData.company_name : '',
                client_email: useManualEntry ? manualClientData.email : '',
                client_phone: useManualEntry ? manualClientData.phone : '',
                client_address: useManualEntry ? manualClientData.address : ''
            };

            const response = await api.put(`/projects/${project.id}/client`, updateData);
            
            setSuccess('Client information updated successfully!');
            if (onClientUpdate) {
                onClientUpdate(response.data.project);
            }
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update client information');
        } finally {
            setLoading(false);
        }
    };

    const handleManualInputChange = (e) => {
        setManualClientData({
            ...manualClientData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 mr-3 text-purple-600" />
                Client Information
            </h3>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <p className="text-sm text-green-600">{success}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        How would you like to add client information?
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="clientMethod"
                                checked={!useManualEntry}
                                onChange={() => handleManualEntryToggle(false)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Select from existing clients ({clients.length} available)
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="clientMethod"
                                checked={useManualEntry}
                                onChange={() => handleManualEntryToggle(true)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Enter client details manually
                            </span>
                        </label>
                    </div>
                </div>

                {/* Existing Client Selection */}
                {!useManualEntry && (
                    <div>
                        <label htmlFor="client_select" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Client
                        </label>
                        <div className="flex space-x-3">
                            <select
                                id="client_select"
                                value={selectedClientId}
                                onChange={(e) => handleClientSelection(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required={!useManualEntry}
                            >
                                <option value="">Select a client...</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.company_name} - {client.email}
                                    </option>
                                ))}
                            </select>                            
                        </div>

                        {/* Selected Client Preview */}
                        {selectedClient && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center mb-3">
                                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                                    <h4 className="text-sm font-medium text-blue-900">Selected Client Details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600">Company:</span>
                                        <p className="text-gray-900">{selectedClient.company_name}</p>
                                    </div>
                                    {selectedClient.contact_name && (
                                        <div>
                                            <span className="font-medium text-gray-600">Contact:</span>
                                            <p className="text-gray-900">{selectedClient.contact_name}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium text-gray-600">Email:</span>
                                        <p className="text-gray-900">{selectedClient.email}</p>
                                    </div>
                                    {selectedClient.phone && (
                                        <div>
                                            <span className="font-medium text-gray-600">Phone:</span>
                                            <p className="text-gray-900">{selectedClient.phone}</p>
                                        </div>
                                    )}
                                    {selectedClient.full_address && (
                                        <div className="md:col-span-2">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-900">{selectedClient.full_address}</p>
                                        </div>
                                    )}
                                    {selectedClient.btw_number && (
                                        <div>
                                            <span className="font-medium text-gray-600">BTW:</span>
                                            <p className="text-gray-900">{selectedClient.btw_number}</p>
                                        </div>
                                    )}
                                    {selectedClient.kvk_number && (
                                        <div>
                                            <span className="font-medium text-gray-600">KvK:</span>
                                            <p className="text-gray-900">{selectedClient.kvk_number}</p>
                                        </div>
                                    )}
                                    {selectedClient.iban && (
                                        <div>
                                            <span className="font-medium text-gray-600">IBAN:</span>
                                            <p className="text-gray-900">{selectedClient.iban}</p>
                                        </div>
                                    )}
                                    {selectedClient.website && (
                                        <div>
                                            <span className="font-medium text-gray-600">Website:</span>
                                            <p className="text-gray-900">
                                                <a 
                                                    href={selectedClient.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {selectedClient.website}
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-gray-600">Projects:</span>
                                        <p className="text-gray-900">{selectedClient.projects_count} project(s)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Client Entry */}
                {useManualEntry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                required={useManualEntry}
                                value={manualClientData.company_name}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="ABC Company Ltd"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Name
                            </label>
                            <input
                                type="text"
                                id="contact_name"
                                name="contact_name"
                                value={manualClientData.contact_name}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="John Smith"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required={useManualEntry}
                                value={manualClientData.email}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="john@company.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={manualClientData.phone}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="+44 123 456 7890"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                rows={3}
                                value={manualClientData.address}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="123 Business Street, London"
                            />
                        </div>

                        <div>
                            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                                Postcode
                            </label>
                            <input
                                type="text"
                                id="postcode"
                                name="postcode"
                                value={manualClientData.postcode}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="SW1A 1AA"
                            />
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={manualClientData.city}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="London"
                            />
                        </div>

                        <div>
                            <label htmlFor="btw_number" className="block text-sm font-medium text-gray-700 mb-2">
                                BTW Number
                            </label>
                            <input
                                type="text"
                                id="btw_number"
                                name="btw_number"
                                value={manualClientData.btw_number}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="NL123456789B01"
                            />
                        </div>

                        <div>
                            <label htmlFor="kvk_number" className="block text-sm font-medium text-gray-700 mb-2">
                                KvK Number
                            </label>
                            <input
                                type="text"
                                id="kvk_number"
                                name="kvk_number"
                                value={manualClientData.kvk_number}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="12345678"
                            />
                        </div>

                        <div>
                            <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-2">
                                IBAN
                            </label>
                            <input
                                type="text"
                                id="iban"
                                name="iban"
                                value={manualClientData.iban}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="NL91ABNA0417164300"
                            />
                        </div>

                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                                Website
                            </label>
                            <input
                                type="url"
                                id="website"
                                name="website"
                                value={manualClientData.website}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://www.company.com"
                            />
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Save Client Information
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientInformation;