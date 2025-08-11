import axios from 'axios';
import { API_BASE_URL } from './api';

class ClientService {
  constructor() {
    this.clients = [];
    this.loading = false;
    this.error = null;
    this.lastFetched = null;
    this.subscribers = new Set();
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Handle API errors and token refresh
  async handleApiError(error, originalRequest) {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const newToken = response.data.access_token;
          localStorage.setItem('accessToken', newToken);
          
          // Retry original request with new token
          return await originalRequest();
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw refreshError;
      }
    }
    throw error;
  }

  // Subscribe to client updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of client changes
  notify() {
    this.subscribers.forEach(callback => callback(this.clients));
  }

  // Fetch all clients
  async fetchClients(force = false) {
    // Only fetch if we don't have clients, it's been more than 5 minutes, or forced
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (!force && this.clients.length > 0 && this.lastFetched > fiveMinutesAgo) {
      return this.clients;
    }

    if (this.loading) {
      return this.clients;
    }

    this.loading = true;
    this.error = null;

    const makeRequest = async () => {
      return await axios.get(`${API_BASE_URL}/clients`, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log('🔄 Fetching clients from database...');
      const response = await makeRequest();
      this.clients = response.data.clients || [];
      this.lastFetched = Date.now();
      this.notify();
      console.log('✅ Clients loaded from database:', this.clients.length, 'clients');
      return this.clients;
    } catch (error) {
      console.error('❌ Failed to fetch clients:', error);
      try {
        await this.handleApiError(error, makeRequest);
        const response = await makeRequest();
        this.clients = response.data.clients || [];
        this.lastFetched = Date.now();
        this.notify();
        return this.clients;
      } catch (retryError) {
        this.error = retryError.response?.data?.error || retryError.message;
        throw retryError;
      }
    } finally {
      this.loading = false;
    }
  }

  // Get all clients (fetch if needed)
  async getClients() {
    if (this.clients.length === 0) {
      await this.fetchClients();
    }
    return this.clients;
  }

  // Get client by ID
  async getClientById(clientId) {
    const makeRequest = async () => {
      return await axios.get(`${API_BASE_URL}/clients/${clientId}`, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log(`🔄 Fetching client ${clientId} from database...`);
      const response = await makeRequest();
      console.log('✅ Client loaded:', response.data.client);
      return response.data.client;
    } catch (error) {
      console.error(`❌ Failed to fetch client ${clientId}:`, error);
      try {
        await this.handleApiError(error, makeRequest);
        const response = await makeRequest();
        return response.data.client;
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  // Create new client
  async createClient(clientData) {
    const makeRequest = async () => {
      return await axios.post(`${API_BASE_URL}/clients`, clientData, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log('🔄 Creating new client...');
      const response = await makeRequest();
      const newClient = response.data.client;
      
      // Update local cache
      this.clients.push(newClient);
      this.notify();
      
      console.log('✅ Client created:', newClient);
      return newClient;
    } catch (error) {
      console.error('❌ Failed to create client:', error);
      try {
        await this.handleApiError(error, makeRequest);
        const response = await makeRequest();
        const newClient = response.data.client;
        
        // Update local cache
        this.clients.push(newClient);
        this.notify();
        
        return newClient;
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  // Update existing client
  async updateClient(clientId, clientData) {
    const makeRequest = async () => {
      return await axios.put(`${API_BASE_URL}/clients/${clientId}`, clientData, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log(`🔄 Updating client ${clientId}...`);
      const response = await makeRequest();
      const updatedClient = response.data.client;
      
      // Update local cache
      const index = this.clients.findIndex(c => c.id === parseInt(clientId));
      if (index !== -1) {
        this.clients[index] = updatedClient;
        this.notify();
      }
      
      console.log('✅ Client updated:', updatedClient);
      return updatedClient;
    } catch (error) {
      console.error(`❌ Failed to update client ${clientId}:`, error);
      try {
        await this.handleApiError(error, makeRequest);
        const response = await makeRequest();
        const updatedClient = response.data.client;
        
        // Update local cache
        const index = this.clients.findIndex(c => c.id === parseInt(clientId));
        if (index !== -1) {
          this.clients[index] = updatedClient;
          this.notify();
        }
        
        return updatedClient;
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  // Delete client
  async deleteClient(clientId) {
    const makeRequest = async () => {
      return await axios.delete(`${API_BASE_URL}/clients/${clientId}`, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log(`🔄 Deleting client ${clientId}...`);
      await makeRequest();
      
      // Update local cache
      this.clients = this.clients.filter(c => c.id !== parseInt(clientId));
      this.notify();
      
      console.log('✅ Client deleted');
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete client ${clientId}:`, error);
      try {
        await this.handleApiError(error, makeRequest);
        await makeRequest();
        
        // Update local cache
        this.clients = this.clients.filter(c => c.id !== parseInt(clientId));
        this.notify();
        
        return true;
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  // Update project client information
  async updateProjectClient(projectId, updateData) {
    const makeRequest = async () => {
      return await axios.put(`${API_BASE_URL}/projects/${projectId}/client`, updateData, {
        headers: this.getAuthHeaders()
      });
    };

    try {
      console.log(`🔄 Updating client information for project ${projectId}...`);
      const response = await makeRequest();
      
      // If a new client was created, refresh our client list
      if (response.data.client_id && updateData.client_data) {
        await this.fetchClients(true);
      }
      
      console.log('✅ Project client information updated');
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update project client information:`, error);
      try {
        await this.handleApiError(error, makeRequest);
        const response = await makeRequest();
        
        // If a new client was created, refresh our client list
        if (response.data.client_id && updateData.client_data) {
          await this.fetchClients(true);
        }
        
        return response.data;
      } catch (retryError) {
        throw retryError;
      }
    }
  }

  // Search clients by query
  searchClients(query) {
    if (!query || query.trim() === '') {
      return this.clients;
    }

    const searchTerm = query.toLowerCase().trim();
    return this.clients.filter(client => {
      return (
        (client.company_name && client.company_name.toLowerCase().includes(searchTerm)) ||
        (client.contact_name && client.contact_name.toLowerCase().includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Get clients formatted for dropdown/select
  getClientsForSelect() {
    return this.clients.map(client => ({
      id: client.id,
      label: client.company_name 
        ? `${client.company_name} - ${client.email}` 
        : client.email,
      value: client.id,
      client: client
    }));
  }

  // Validate client data
  validateClientData(clientData, isUpdate = false) {
    const errors = {};

    // Email is required
    if (!clientData.email || !clientData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Optional field validations
    if (clientData.website && clientData.website.trim()) {
      try {
        new URL(clientData.website);
      } catch {
        errors.website = 'Please enter a valid website URL';
      }
    }

    if (clientData.phone && clientData.phone.trim()) {
      // Basic phone validation (allows various formats)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = clientData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Refresh clients from server
  async refreshClients() {
    return await this.fetchClients(true);
  }

  // Clear cached clients
  clearCache() {
    this.clients = [];
    this.lastFetched = null;
    this.error = null;
  }

  // Check if clients are loaded
  isLoaded() {
    return this.clients.length > 0;
  }

  // Check if clients are loading
  isLoading() {
    return this.loading;
  }

  // Get error if any
  getError() {
    return this.error;
  }

  // Get client count
  getClientCount() {
    return this.clients.length;
  }
}

// Create singleton instance
const clientService = new ClientService();

export default clientService;