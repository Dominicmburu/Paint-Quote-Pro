// // contexts/ClientContext.js
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import api from '../services/api';

// const ClientContext = createContext();

// export const useClientContext = () => {
//   const context = useContext(ClientContext);
//   if (!context) {
//     throw new Error('useClientContext must be used within a ClientProvider');
//   }
//   return context;
// };

// export const ClientProvider = ({ children }) => {
//   const [clients, setClients] = useState([]);
//   const [selectedClientId, setSelectedClientId] = useState('');
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [useManualEntry, setUseManualEntry] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const [manualClientData, setManualClientData] = useState({
//     company_name: '',
//     contact_name: '',
//     email: '',
//     phone: '',
//     address: '',
//     postcode: '',
//     city: '',
//     btw_number: '',
//     kvk_number: '',
//     iban: '',
//     website: ''
//   });

//   // Load clients from API
//   const loadClients = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/clients');
//       setClients(response.data.clients || []);
//       setError('');
//     } catch (err) {
//       console.error('Failed to load clients:', err);
//       setError('Failed to load clients');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Initialize clients on mount
//   useEffect(() => {
//     loadClients();
//   }, [loadClients]);

//   // Update selected client when selectedClientId changes
//   useEffect(() => {
//     if (selectedClientId && clients.length > 0) {
//       const client = clients.find(c => c.id === parseInt(selectedClientId));
//       setSelectedClient(client || null);
//     } else {
//       setSelectedClient(null);
//     }
//   }, [selectedClientId, clients]);

//   // Initialize client data from project
//   const initializeFromProject = useCallback((project) => {
//     if (project) {
//       setSelectedClientId(project.client_id || '');
//       setUseManualEntry(!project.client_id);
//       setManualClientData({
//         company_name: project.client_name || '',
//         contact_name: '',
//         email: project.client_email || '',
//         phone: project.client_phone || '',
//         address: project.client_address || '',
//         postcode: '',
//         city: '',
//         btw_number: '',
//         kvk_number: '',
//         iban: '',
//         website: ''
//       });
//     }
//   }, []);

//   // Handle client selection
//   const handleClientSelection = useCallback((clientId) => {
//     setSelectedClientId(clientId);
//     if (clientId) {
//       setUseManualEntry(false);
//     }
//   }, []);

//   // Toggle manual entry mode
//   const handleManualEntryToggle = useCallback((useManual) => {
//     setUseManualEntry(useManual);
//     if (useManual) {
//       setSelectedClientId('');
//       setSelectedClient(null);
//     }
//   }, []);

//   // Update manual client data
//   const updateManualClientData = useCallback((field, value) => {
//     setManualClientData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   }, []);

//   // Reset manual client data
//   const resetManualClientData = useCallback(() => {
//     setManualClientData({
//       company_name: '',
//       contact_name: '',
//       email: '',
//       phone: '',
//       address: '',
//       postcode: '',
//       city: '',
//       btw_number: '',
//       kvk_number: '',
//       iban: '',
//       website: ''
//     });
//   }, []);

//   // Save client information to project
//   const saveClientToProject = useCallback(async (projectId, onUpdate) => {
//     setLoading(true);
//     setError('');

//     try {
//       // Validate email is provided (only mandatory field)
//       if (useManualEntry && !manualClientData.email) {
//         setError('Email is required');
//         return false;
//       }

//       if (!useManualEntry && !selectedClientId) {
//         setError('Please select a client or enter client details manually');
//         return false;
//       }

//       const updateData = {
//         client_id: useManualEntry ? null : selectedClientId,
//         client_data: useManualEntry ? manualClientData : null,
//         client_name: useManualEntry ? manualClientData.company_name : '',
//         client_email: useManualEntry ? manualClientData.email : '',
//         client_phone: useManualEntry ? manualClientData.phone : '',
//         client_address: useManualEntry ? manualClientData.address : ''
//       };

//       const response = await api.put(`/projects/${projectId}/client`, updateData);

//       setSuccess('Client information updated successfully!');

//       // Refresh clients list
//       await loadClients();

//       // If manual entry created a new client, switch to that client
//       if (useManualEntry && response.data.client_id) {
//         setSelectedClientId(response.data.client_id);
//         setUseManualEntry(false);
//       }

//       // Call update callback if provided
//       if (onUpdate) {
//         onUpdate(response.data.project);
//       }

//       // Clear success message after 3 seconds
//       setTimeout(() => setSuccess(''), 3000);

//       return true;
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to update client information');
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   }, [useManualEntry, manualClientData, selectedClientId, loadClients]);

//   // Clear messages
//   const clearError = useCallback(() => setError(''), []);
//   const clearSuccess = useCallback(() => setSuccess(''), []);

//   // Get client by ID
//   const getClientById = useCallback((id) => {
//     return clients.find(client => client.id === parseInt(id));
//   }, [clients]);

//   // Create new client
//   const createClient = useCallback(async (clientData) => {
//     try {
//       setLoading(true);
//       const response = await api.post('/clients', clientData);
//       await loadClients(); // Refresh the list
//       return response.data;
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to create client');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [loadClients]);

//   // Update existing client
//   const updateClient = useCallback(async (clientId, clientData) => {
//     try {
//       setLoading(true);
//       const response = await api.put(`/clients/${clientId}`, clientData);
//       await loadClients(); // Refresh the list
//       return response.data;
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to update client');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [loadClients]);

//   // Delete client
//   const deleteClient = useCallback(async (clientId) => {
//     try {
//       setLoading(true);
//       await api.delete(`/clients/${clientId}`);
//       await loadClients(); // Refresh the list
      
//       // If the deleted client was selected, clear selection
//       if (parseInt(selectedClientId) === parseInt(clientId)) {
//         setSelectedClientId('');
//         setSelectedClient(null);
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to delete client');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [loadClients, selectedClientId]);

//   const value = {
//     // State
//     clients,
//     selectedClientId,
//     selectedClient,
//     useManualEntry,
//     manualClientData,
//     loading,
//     error,
//     success,

//     // Actions
//     loadClients,
//     handleClientSelection,
//     handleManualEntryToggle,
//     updateManualClientData,
//     resetManualClientData,
//     saveClientToProject,
//     initializeFromProject,
//     clearError,
//     clearSuccess,
//     getClientById,
//     createClient,
//     updateClient,
//     deleteClient,

//     // Computed values
//     hasClients: clients.length > 0,
//     isClientSelected: !!selectedClientId,
//     isManualEntryValid: useManualEntry ? !!manualClientData.email : true,
//   };

//   return (
//     <ClientContext.Provider value={value}>
//       {children}
//     </ClientContext.Provider>
//   );
// };

// // Custom hook with additional utilities
// export const useClientForm = () => {
//   const clientContext = useClientContext();

//   const handleManualInputChange = useCallback((e) => {
//     const { name, value } = e.target;
//     clientContext.updateManualClientData(name, value);
//   }, [clientContext]);

//   const handleSubmit = useCallback(async (e, projectId, onUpdate) => {
//     e.preventDefault();
//     return await clientContext.saveClientToProject(projectId, onUpdate);
//   }, [clientContext]);

//   const getSelectedOptionsDisplay = useCallback(() => {
//     if (clientContext.useManualEntry) {
//       return `Manual Entry: ${clientContext.manualClientData.email || 'No email'}`;
//     } else if (clientContext.selectedClient) {
//       return `Selected: ${clientContext.selectedClient.company_name || clientContext.selectedClient.email}`;
//     }
//     return 'No selection';
//   }, [clientContext]);

//   return {
//     ...clientContext,
//     handleManualInputChange,
//     handleSubmit,
//     getSelectedOptionsDisplay,
//   };
// };