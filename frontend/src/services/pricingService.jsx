// services/pricingService.js
import api from './api';

class PricingService {
  constructor() {
    this.pricing = null;
    this.loading = false;
    this.error = null;
    this.lastFetched = null;
    this.subscribers = new Set();
  }

  // Subscribe to pricing updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of pricing changes
  notify() {
    this.subscribers.forEach(callback => callback(this.pricing));
  }

  // Fetch pricing from database API
  async fetchPricing(force = false) {
    // Only fetch if we don't have pricing, it's been more than 5 minutes, or forced
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (!force && this.pricing && this.lastFetched > fiveMinutesAgo) {
      return this.pricing;
    }

    if (this.loading) {
      return this.pricing;
    }

    this.loading = true;
    this.error = null;

    try {
      console.log('🔄 Fetching pricing from database...');
      const response = await api.get('/settings/pricing');
      this.pricing = response.data.pricing;
      this.lastFetched = Date.now();
      this.notify();
      console.log('✅ Pricing loaded from database:', this.pricing);
      return this.pricing;
    } catch (error) {
      this.error = error.message;
      console.error('❌ Failed to fetch pricing:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Get current pricing (fetch if needed)
  async getPricing() {
    if (!this.pricing) {
      await this.fetchPricing();
    }
    return this.pricing;
  }

  // Get room/wall pricing
  getRoomPricing() {
    if (!this.pricing?.walls || !this.pricing?.ceiling) {
      throw new Error('Room pricing not available');
    }
    return {
      walls: this.pricing.walls,
      ceiling: this.pricing.ceiling
    };
  }

  // Get interior work pricing
  getInteriorPricing() {
    if (!this.pricing?.interior) {
      throw new Error('Interior pricing not available');
    }
    return this.pricing.interior;
  }

  // Get exterior work pricing  
  getExteriorPricing() {
    if (!this.pricing?.exterior) {
      throw new Error('Exterior pricing not available');
    }
    return this.pricing.exterior;
  }

  // Get special jobs pricing
  getSpecialJobsPricing() {
    if (!this.pricing?.specialJobs) {
      throw new Error('Special jobs pricing not available');
    }
    return this.pricing.specialJobs;
  }

  // Get additional fees
  getAdditionalFees() {
    if (!this.pricing?.additional) {
      throw new Error('Additional fees not available');
    }
    return this.pricing.additional;
  }

  // Get specific wall treatment price
  getWallPrice(category, type) {
    try {
      const wallPricing = this.getRoomPricing().walls;
      return wallPricing[category]?.[type]?.price || 0;
    } catch {
      return 0;
    }
  }

  // Get specific ceiling treatment price
  getCeilingPrice(category, type) {
    try {
      const ceilingPricing = this.getRoomPricing().ceiling;
      return ceilingPricing[category]?.[type]?.price || 0;
    } catch {
      return 0;
    }
  }

  // Get specific interior item price
  getInteriorPrice(category, type) {
    try {
      const interiorPricing = this.getInteriorPricing();
      if (category === 'stairs' || category === 'radiators' || category === 'skirtingBoards' || category === 'otherItems') {
        return interiorPricing[category]?.price || 0;
      }
      return interiorPricing[category]?.[type]?.price || 0;
    } catch {
      return 0;
    }
  }

  // Get specific exterior item price
  getExteriorPrice(category, type) {
    try {
      const exteriorPricing = this.getExteriorPricing();
      if (category === 'fasciaBoards' || category === 'rainPipe' || category === 'otherItems') {
        return exteriorPricing[category]?.price || 0;
      }
      return exteriorPricing[category]?.[type]?.price || 0;
    } catch {
      return 0;
    }
  }

  // Get specific special job price
  getSpecialJobPrice(category, type) {
    try {
      const specialPricing = this.getSpecialJobsPricing();
      return specialPricing[category]?.[type]?.price || 0;
    } catch {
      return 0;
    }
  }

  // Refresh pricing from server
  async refreshPricing() {
    return await this.fetchPricing(true);
  }

  // Clear cached pricing
  clearCache() {
    this.pricing = null;
    this.lastFetched = null;
    this.error = null;
  }

  // Check if pricing is loaded
  isLoaded() {
    return !!this.pricing;
  }

  // Check if pricing is loading
  isLoading() {
    return this.loading;
  }

  // Get error if any
  getError() {
    return this.error;
  }
}

// Create singleton instance
const pricingService = new PricingService();

export default pricingService;