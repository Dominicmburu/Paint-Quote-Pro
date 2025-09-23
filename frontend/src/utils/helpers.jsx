// utils/helpers.js
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatCurrency = (amount, currency = 'GBP') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0.00';
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `€${parseFloat(amount).toFixed(2)}`;
  }
};

export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return parseFloat(number).toFixed(decimals);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    analyzing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    quoted: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Basic UK phone number validation
  const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const generateProjectName = (projectType, propertyType, clientName) => {
  const type = capitalizeFirst(projectType);
  const property = capitalizeFirst(propertyType);
  const client = clientName ? ` - ${clientName}` : '';
  
  return `${type} ${property} Project${client}`;
};

export const calculateProjectProgress = (project) => {
  if (!project) return 0;

  let progress = 0;
  
  // Basic project creation
  if (project.name) progress += 20;
  
  // Client info added
  if (project.client_name || project.client_email) progress += 20;
  
  // Images uploaded
  if (project.uploaded_images && project.uploaded_images.length > 0) progress += 20;
  
  // Analysis or measurements done
  if (project.floor_plan_analysis || project.manual_measurements) progress += 20;
  
  // Quote created
  if (project.quote_data) progress += 20;

  return Math.min(progress, 100);
};

export const getProjectStatusText = (status) => {
  const statusText = {
    draft: 'Draft',
    analyzing: 'Analyzing',
    ready: 'Ready for Quote',
    quoted: 'Quote Sent',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return statusText[status] || 'Unknown';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      return false;
    }
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      textArea.remove();
      return false;
    }
  }
};

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const extension = filename.split('.').pop().toLowerCase();
  return imageExtensions.includes(extension);
};

export const isPdfFile = (filename) => {
  return filename.toLowerCase().endsWith('.pdf');
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const sortProjects = (projects, sortBy = 'created_at', sortOrder = 'desc') => {
  return [...projects].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date sorting
    if (sortBy.includes('_at')) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

export const filterProjects = (projects, filters) => {
  return projects.filter(project => {
    // Status filter
    if (filters.status && filters.status !== 'all' && project.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        project.name,
        project.description,
        project.client_name,
        project.client_email,
        project.property_type,
        project.project_type
      ];
      
      const matchesSearch = searchableFields.some(field => 
        field && field.toLowerCase().includes(searchTerm)
      );
      
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const projectDate = new Date(project.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (projectDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const projectDate = new Date(project.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59); // End of day
      if (projectDate > toDate) return false;
    }

    return true;
  });
};

export const calculateQuoteTotal = (quoteData) => {
  if (!quoteData || !quoteData.line_items) return 0;

  const subtotal = quoteData.line_items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  const vatRate = quoteData.vat_rate || 0.2;
  const vatAmount = subtotal * vatRate;
  
  return subtotal + vatAmount;
};

export const formatQuoteLineItem = (item) => {
  return {
    ...item,
    total: item.quantity * item.unit_price,
    unit_price_formatted: formatCurrency(item.unit_price),
    total_formatted: formatCurrency(item.quantity * item.unit_price)
  };
};

export const generateQuoteNumber = (companyId, projectId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `PQ${year}${month}${day}-${companyId}-${projectId}`;
};

export const parseError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getProgressColor = (progress) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const formatArea = (area, unit = 'm²') => {
  if (area === null || area === undefined || isNaN(area)) {
    return `0 ${unit}`;
  }
  return `${parseFloat(area).toFixed(2)} ${unit}`;
};

export const calculatePaintQuantity = (area, coatsNeeded = 2, coverage = 10) => {
  // area in m², coverage in m²/litre
  const totalArea = area * coatsNeeded;
  const litresNeeded = totalArea / coverage;
  
  // Round up to nearest 0.5L
  return Math.ceil(litresNeeded * 2) / 2;
};

export const formatPaintQuantity = (litres) => {
  if (litres >= 1) {
    return `${formatNumber(litres, 1)}L`;
  } else {
    return `${formatNumber(litres * 1000, 0)}ml`;
  }
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

export const generateColorPalette = (baseColor = '#7C3AED') => {
  // Generate a color palette based on the base purple color
  return {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: baseColor,
    700: '#6D28D9',
    800: '#581C87',
    900: '#3B0764'
  };
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// URL helpers
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

// Validation helpers
export const validators = {
  required: (value) => !!value || 'This field is required',
  email: (value) => validateEmail(value) || 'Please enter a valid email address',
  phone: (value) => validatePhone(value) || 'Please enter a valid phone number',
  minLength: (min) => (value) => 
    (value && value.length >= min) || `Minimum ${min} characters required`,
  maxLength: (max) => (value) =>
    (!value || value.length <= max) || `Maximum ${max} characters allowed`,
  numeric: (value) => !isNaN(value) || 'Please enter a valid number',
  positive: (value) => (parseFloat(value) > 0) || 'Value must be positive'
};

export default {
  formatDate,
  formatCurrency,
  formatNumber,
  formatFileSize,
  truncateText,
  capitalizeFirst,
  getStatusColor,
  validateEmail,
  validatePhone,
  generateProjectName,
  calculateProjectProgress,
  getProjectStatusText,
  debounce,
  downloadFile,
  copyToClipboard,
  isImageFile,
  isPdfFile,
  getFileExtension,
  sortProjects,
  filterProjects,
  calculateQuoteTotal,
  formatQuoteLineItem,
  generateQuoteNumber,
  parseError,
  getProgressColor,
  formatArea,
  calculatePaintQuantity,
  formatPaintQuantity,
  exportToCSV,
  generateColorPalette,
  storage,
  buildUrl,
  getQueryParams,
  validators
};