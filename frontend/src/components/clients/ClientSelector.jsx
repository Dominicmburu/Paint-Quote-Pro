// components/clients/ClientSelector.jsx (Fixed)
import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Building } from 'lucide-react';
import api from '../../services/api';

const ClientSelector = ({ selectedClient, onClientSelect, onClientChange, showClientForm }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSelect = (client) => {
    onClientSelect(client);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
        <button
          onClick={onClientChange}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showClientForm ? 'Select Existing' : 'New Client'}
        </button>
      </div>

      {!showClientForm ? (
        <div className="space-y-4">
          {/* Search existing clients */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search existing clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Client list */}
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
            {loading ? (
              <div className="p-3 text-center text-gray-500">Loading clients...</div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{client.company_name}</div>
                  <div className="text-sm text-gray-500">{client.contact_name} • {client.email}</div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'No clients found' : 'No existing clients'}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-sm font-medium text-green-900">Selected Client:</div>
              <div className="text-sm text-green-700">{selectedClient.company_name}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ClientSelector;