// components/project/ClientInformation.jsx
import React, { useEffect } from 'react';
import { Users, Check, AlertCircle, Eye } from 'lucide-react';
import { useClientForm } from '../../hooks/ClientContext'; 

const ClientInformation = ({ project, onClientUpdate }) => {
    console.log('🔄 ClientInformation: Component rendering with project:', project);

    const {
        clients,
        selectedClientId,
        selectedClient,
        useManualEntry,
        manualClientData,
        loading,
        error,
        success,
        handleClientSelection,
        handleManualEntryToggle,
        handleManualInputChange,
        handleSubmit,
        initializeFromProject,
        hasClients
    } = useClientForm();

    // 🔍 Log all context values
    console.log('📊 ClientInformation: Context state:', {
        clientsCount: clients?.length || 0,
        clients: clients,
        selectedClientId,
        selectedClient,
        useManualEntry,
        manualClientData,
        loading,
        error,
        success,
        hasClients
    });

    // Initialize client data from project on mount
    useEffect(() => {
        console.log('🚀 ClientInformation: useEffect triggered with project:', project);
        console.log('🚀 ClientInformation: initializeFromProject function:', initializeFromProject);
        
        if (project) {
            console.log('✅ ClientInformation: Initializing from project:', {
                projectId: project.id,
                clientId: project.client_id,
                clientName: project.client_name,
                clientEmail: project.client_email,
                clientPhone: project.client_phone,
                clientAddress: project.client_address
            });
            initializeFromProject(project);
        } else {
            console.log('❌ ClientInformation: No project provided to initialize from');
        }
    }, [project, initializeFromProject]);

    // 🔍 Log when clients data changes
    useEffect(() => {
        console.log('📈 ClientInformation: Clients data updated:', {
            count: clients?.length || 0,
            clients: clients,
            hasClients: hasClients
        });
    }, [clients, hasClients]);

    // 🔍 Log when selection changes
    useEffect(() => {
        console.log('🎯 ClientInformation: Selection changed:', {
            selectedClientId,
            selectedClient,
            useManualEntry
        });
    }, [selectedClientId, selectedClient, useManualEntry]);

    // 🔍 Log when manual data changes
    useEffect(() => {
        console.log('✏️ ClientInformation: Manual data changed:', manualClientData);
    }, [manualClientData]);

    // 🔍 Log loading/error states
    useEffect(() => {
        if (loading) console.log('⏳ ClientInformation: Loading state activated');
        if (error) console.log('❌ ClientInformation: Error occurred:', error);
        if (success) console.log('✅ ClientInformation: Success message:', success);
    }, [loading, error, success]);

    const onSubmit = async (e) => {
        console.log('📤 ClientInformation: Form submission started');
        console.log('📤 ClientInformation: Project ID:', project?.id);
        console.log('📤 ClientInformation: Current form state:', {
            useManualEntry,
            selectedClientId,
            manualClientData: manualClientData
        });

        try {
            const success = await handleSubmit(e, project.id, onClientUpdate);
            console.log('📤 ClientInformation: Form submission result:', success);
            return success;
        } catch (error) {
            console.error('💥 ClientInformation: Form submission error:', error);
            throw error;
        }
    };

    // 🔍 Log render decisions
    console.log('🎨 ClientInformation: Render decisions:', {
        showClientSelection: !useManualEntry,
        showManualEntry: useManualEntry,
        showSelectedClientPreview: !useManualEntry && selectedClient,
        clientsAvailable: clients?.length > 0
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 mr-3 text-purple-600" />
                Client Information
                {/* 🔍 Debug info in dev mode */}
                {process.env.NODE_ENV === 'development' && (
                    <span className="ml-4 text-xs bg-gray-100 px-2 py-1 rounded">
                        Clients: {clients?.length || 0} | Mode: {useManualEntry ? 'Manual' : 'Select'} | Loading: {loading ? 'Yes' : 'No'}
                    </span>
                )}
            </h3>

            {/* 🔍 Debug panel in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <h4 className="font-bold mb-2">🔍 Debug Info</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div><strong>Clients loaded:</strong> {clients?.length || 0}</div>
                        <div><strong>Has clients:</strong> {hasClients ? 'Yes' : 'No'}</div>
                        <div><strong>Selected ID:</strong> {selectedClientId || 'None'}</div>
                        <div><strong>Manual mode:</strong> {useManualEntry ? 'Yes' : 'No'}</div>
                        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
                        <div><strong>Error:</strong> {error || 'None'}</div>
                    </div>
                </div>
            )}

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

            <form onSubmit={onSubmit} className="space-y-6">
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
                                onChange={() => {
                                    console.log('🔄 ClientInformation: Switching to existing client selection');
                                    handleManualEntryToggle(false);
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Select from existing clients ({clients?.length || 0} available)
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="clientMethod"
                                checked={useManualEntry}
                                onChange={() => {
                                    console.log('🔄 ClientInformation: Switching to manual entry');
                                    handleManualEntryToggle(true);
                                }}
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
                                onChange={(e) => {
                                    console.log('🎯 ClientInformation: Client selection changed to:', e.target.value);
                                    handleClientSelection(e.target.value);
                                }}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required={!useManualEntry}
                            >
                                <option value="">Select a client...</option>
                                {clients?.map((client) => {
                                    console.log('🔍 ClientInformation: Rendering client option:', client);
                                    return (
                                        <option key={client.id} value={client.id}>
                                            {client.company_name ? `${client.company_name} - ${client.email}` : client.email}
                                        </option>
                                    );
                                })}
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
                                    {selectedClient.full_address && (
                                        <div className="md:col-span-2">
                                            <span className="font-medium text-gray-600">Address:</span>
                                            <p className="text-gray-900">{selectedClient.full_address}</p>
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
                                onChange={(e) => {
                                    console.log('✏️ ClientInformation: Email changed to:', e.target.value);
                                    handleManualInputChange(e);
                                }}
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

                        {/* Additional fields that were in the original */}
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
                                placeholder="NL91ABNA0417164300"
                            />
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => console.log('🔘 ClientInformation: Submit button clicked')}
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