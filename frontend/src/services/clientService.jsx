import axios from 'axios';
import { API_BASE_URL } from './api';


class ClientService {
  constructor() {
    this.clients = [];
    this.subscribers = new Set();
  }

  // Get auth headers with token
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  // Subscribe to client updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify subscribers of changes
  notify() {
    this.subscribers.forEach(callback => callback(this.clients));
  }

  // Get all clients
  async getClients() {
    try {
      console.log('🔄 Fetching clients...');
      const response = await axios.get(`${API_BASE_URL}/projects/clients/proj`, {
        headers: this.getAuthHeaders()
      });
      this.clients = response.data.clients || [];
      this.notify();
      console.log('✅ Clients loaded:', this.clients.length);
      return this.clients;
    } catch (error) {
      console.error('❌ Failed to fetch clients:', error);
      throw error;
    }
  }

  // Get client by ID
  async getClientById(clientId) {
    try {
      console.log(`🔄 Fetching client ${clientId}...`);
      const response = await axios.get(`${API_BASE_URL}/custm/${clientId}`, {
        headers: this.getAuthHeaders()
      });
      console.log('✅ Client loaded:', response.data.client);
      return response.data.client;
    } catch (error) {
      console.error(`❌ Failed to fetch client ${clientId}:`, error);
      throw error;
    }
  }

  // Create new client
  async createClient(clientData) {
    try {
      console.log('🔄 Creating new client...');
      const response = await axios.post(`${API_BASE_URL}/custm`, clientData, {
        headers: this.getAuthHeaders()
      });
      const newClient = response.data.client;
      
      // Update local cache
      this.clients.push(newClient);
      this.notify();
      
      console.log('✅ Client created:', newClient);
      return newClient;
    } catch (error) {
      console.error('❌ Failed to create client:', error);
      throw error;
    }
  }

  // Update existing client
  async updateClient(clientId, clientData) {
    try {
      console.log(`🔄 Updating client ${clientId}...`);
      const response = await axios.put(`${API_BASE_URL}/custm/${clientId}`, clientData, {
        headers: this.getAuthHeaders()
      });
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
      throw error;
    }
  }

  // Delete client
  async deleteClient(clientId) {
    try {
      console.log(`🔄 Deleting client ${clientId}...`);
      await axios.delete(`${API_BASE_URL}/custm/${clientId}`, {
        headers: this.getAuthHeaders()
      });
      
      // Update local cache
      this.clients = this.clients.filter(c => c.id !== parseInt(clientId));
      this.notify();
      
      console.log('✅ Client deleted');
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete client ${clientId}:`, error);
      throw error;
    }
  }

  // Update project client information
  async updateProjectClient(projectId, updateData) {
    try {
      console.log(`🔄 Updating client information for project ${projectId}...`);
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}/client`, updateData, {
        headers: this.getAuthHeaders()
      });
      
      // If a new client was created, refresh our client list
      if (response.data.client_id && updateData.client_data) {
        await this.getClients();
      }
      
      console.log('✅ Project client information updated');
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update project client information:`, error);
      throw error;
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

  // Validate client data
  validateClientData(clientData) {
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

    // Website validation if provided
    if (clientData.website && clientData.website.trim()) {
      try {
        new URL(clientData.website);
      } catch {
        errors.website = 'Please enter a valid website URL';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Refresh clients from server
  async refreshClients() {
    return await this.getClients();
  }
}

// Create singleton instance
const clientService = new ClientService();

export default clientService;