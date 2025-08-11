import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, AlertCircle, Eye } from 'lucide-react';
import clientService from '../../services/clientService';

const ClientInformation = ({ project, onClientUpdate }) => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(project?.client_id || '');
    const [selectedClient, setSelectedClient] = useState(null);
    const [useManualEntry, setUseManualEntry] = useState(!project?.client_id);
    const [loading, setLoading] = useState(false);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [manualClientData, setManualClientData] = useState({
        company_name: project?.client_name || '',
        contact_name: '',
        email: project?.client_email || '', // This is the only required field
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

        // Subscribe to client updates from the service
        const unsubscribe = clientService.subscribe((updatedClients) => {
            setClients(updatedClients);
        });

        return unsubscribe;
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
        setClientsLoading(true);
        try {
            const clientsData = await clientService.getClients();
            setClients(clientsData);
        } catch (err) {
            console.error('Failed to load clients:', err);
            setError('Failed to load existing clients');
            // Set empty array to allow manual entry
            setClients([]);
        } finally {
            setClientsLoading(false);
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
            // Validate email is provided (only mandatory field)
            if (useManualEntry && !manualClientData.email) {
                setError('Email is required');
                setLoading(false);
                return;
            }

            if (!useManualEntry && !selectedClientId) {
                setError('Please select a client or enter client details manually');
                setLoading(false);
                return;
            }

            // Validate manual client data if using manual entry
            if (useManualEntry) {
                const validation = clientService.validateClientData(manualClientData);
                if (!validation.isValid) {
                    const firstError = Object.values(validation.errors)[0];
                    setError(firstError);
                    setLoading(false);
                    return;
                }
            }

            const updateData = {
                client_id: useManualEntry ? null : selectedClientId,
                client_data: useManualEntry ? manualClientData : null,
                client_name: useManualEntry ? manualClientData.company_name : '',
                client_email: useManualEntry ? manualClientData.email : '',
                client_phone: useManualEntry ? manualClientData.phone : '',
                client_address: useManualEntry ? manualClientData.address : ''
            };

            const response = await clientService.updateProjectClient(project.id, updateData);

            setSuccess('Client information updated successfully!');

            // If a new client was created, update the UI
            if (useManualEntry && response.client_id) {
                setSelectedClientId(response.client_id);
                setUseManualEntry(false);
            }

            if (onClientUpdate) {
                onClientUpdate(response.project);
            }

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to update client information:', err);
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
        // Clear any validation errors when user starts typing
        if (error) {
            setError('');
        }
    };

    const refreshClients = async () => {
        setClientsLoading(true);
        try {
            await clientService.refreshClients();
            // The subscription will automatically update our state
        } catch (err) {
            console.error('Failed to refresh clients:', err);
            setError('Failed to refresh client list');
        } finally {
            setClientsLoading(false);
        }
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
                                disabled={clientsLoading}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Select from existing clients 
                                {clientsLoading ? (
                                    <span className="ml-2 text-gray-500">(Loading...)</span>
                                ) : (
                                    <span className="ml-1">({clients.length} available)</span>
                                )}
                                {!clientsLoading && clients.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={refreshClients}
                                        className="ml-2 text-purple-600 hover:text-purple-700 text-xs underline"
                                        disabled={clientsLoading}
                                    >
                                        Refresh
                                    </button>
                                )}
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
                                disabled={clientsLoading}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                                required={!useManualEntry}
                            >
                                <option value="">
                                    {clientsLoading ? 'Loading clients...' : 'Select a client...'}
                                </option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.company_name ? `${client.company_name} - ${client.email}` : client.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* No clients message */}
                        {!clientsLoading && clients.length === 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    No existing clients found. You can create a new client by selecting "Enter client details manually" above.
                                </p>
                            </div>
                        )}

                        {/* Selected Client Preview */}
                        {selectedClient && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center mb-3">
                                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                                    <h4 className="text-sm font-medium text-blue-900">Selected Client Details</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {selectedClient.company_name && (
                                        <div>
                                            <span className="font-medium text-gray-600">Company:</span>
                                            <p className="text-gray-900">{selectedClient.company_name}</p>
                                        </div>
                                    )}
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
                                    {selectedClient.address && (
                                        <div className="md:col-span-2">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-900">{selectedClient.address}</p>
                                        </div>
                                    )}
                                    {selectedClient.website && (
                                        <div className="md:col-span-2">
                                            <span className="font-medium text-gray-600">Website:</span>
                                            <p className="text-gray-900">
                                                <a 
                                                    href={selectedClient.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 underline"
                                                >
                                                    {selectedClient.website}
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Client Entry - EMAIL ONLY MANDATORY */}
                {useManualEntry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email - REQUIRED FIELD */}
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                                <span className="text-red-500 text-xs ml-1">(Required)</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required={useManualEntry}
                                value={manualClientData.email}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="client@example.com"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This is the only required field. All other information is optional.
                            </p>
                        </div>

                        {/* Optional Fields */}
                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={manualClientData.company_name}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="ABC Company Ltd"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Name <span className="text-gray-400">(Optional)</span>
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
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone <span className="text-gray-400">(Optional)</span>
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

                        <div>
                            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                                Postcode <span className="text-gray-400">(Optional)</span>
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

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                Address <span className="text-gray-400">(Optional)</span>
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
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                City <span className="text-gray-400">(Optional)</span>
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
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                                Website <span className="text-gray-400">(Optional)</span>
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

                        {/* Additional Business Fields */}
                        <div>
                            <label htmlFor="btw_number" className="block text-sm font-medium text-gray-700 mb-2">
                                BTW Number <span className="text-gray-400">(Optional)</span>
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
                                KVK Number <span className="text-gray-400">(Optional)</span>
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

                        <div className="md:col-span-2">
                            <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-2">
                                IBAN <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="iban"
                                name="iban"
                                value={manualClientData.iban}
                                onChange={handleManualInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="NL91 ABNA 0417 1643 00"
                            />
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading || clientsLoading}
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