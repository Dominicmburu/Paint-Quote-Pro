// hooks/usePricing.js
import { useState, useEffect } from 'react';
import pricingService from '../services/pricingService';

export const usePricing = () => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPricing = async () => {
      try {
        setLoading(true);
        setError(null);
        const pricingData = await pricingService.getPricing();
        if (isMounted) {
          setPricing(pricingData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error('Failed to load pricing:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to pricing updates
    const unsubscribe = pricingService.subscribe((newPricing) => {
      if (isMounted) {
        setPricing(newPricing);
        setError(null);
      }
    });

    // Load initial pricing
    if (pricingService.isLoaded()) {
      setPricing(pricingService.pricing);
      setLoading(false);
    } else {
      loadPricing();
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      await pricingService.refreshPricing();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pricing,
    loading,
    error,
    refreshPricing,
    isLoaded: !!pricing,
    
    // Helper methods for specific pricing
    getRoomPricing: () => pricingService.getRoomPricing(),
    getInteriorPricing: () => pricingService.getInteriorPricing(),
    getExteriorPricing: () => pricingService.getExteriorPricing(),
    getSpecialJobsPricing: () => pricingService.getSpecialJobsPricing(),
    
    // Price getter methods
    getWallPrice: (category, type) => pricingService.getWallPrice(category, type),
    getCeilingPrice: (category, type) => pricingService.getCeilingPrice(category, type),
    getInteriorPrice: (category, type) => pricingService.getInteriorPrice(category, type),
    getExteriorPrice: (category, type) => pricingService.getExteriorPrice(category, type),
    getSpecialJobPrice: (category, type) => pricingService.getSpecialJobPrice(category, type)
  };
};