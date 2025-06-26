import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Plus, Trash2, FileText, Calculator, Home, Building,
  User, Mail, Phone, MapPin, Download, Send, Save, RotateCcw, Upload,
  X, Eye, Brain, Play, RefreshCw, AlertCircle, FileImage, CheckCircle,
  Clock, Layers, Square, Paintbrush2, Info, DollarSign
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

// Enhanced Image Component with Fallback URLs
const ImageWithFallback = ({ urls, alt, className, fallbackIcon }) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Reset when URLs change
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(true);
  }, [urls]);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          {fallbackIcon}
          <p className="text-xs text-gray-500 mt-1">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} flex items-center justify-center bg-gray-100 absolute inset-0`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
        </div>
      )}
      <img
        src={urls[currentUrlIndex]}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Enhanced room-based measurements state
  const [rooms, setRooms] = useState([]);
  
  // Enhanced interior and exterior items state
  const [interiorItems, setInteriorItems] = useState({
    doors: [],
    fixedWindows: [],
    turnWindows: [],
    stairs: [],
    radiators: [],
    skirtingBoards: [],
    otherItems: []
  });

  const [exteriorItems, setExteriorItems] = useState({
    doors: [],
    fixedWindows: [],
    turnWindows: [],
    dormerWindows: [],
    fasciaBoards: [],
    rainPipe: [],
    otherItems: []
  });

  const [notes, setNotes] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    roomTotals: {},
    interiorTotal: 0,
    exteriorTotal: 0,
    cleanupFee: 0
  });

  // Enhanced pricing configuration with clear descriptions
  const pricing = {
    walls: {
      sanding: { 
        light: { price: 5.00, description: 'Light sanding - minor imperfections' },
        medium: { price: 8.00, description: 'Medium sanding - moderate preparation' },
        heavy: { price: 12.00, description: 'Heavy sanding - extensive preparation' }
      },
      priming: { 
        one_coat: { price: 4.50, description: 'Single primer coat' },
        two_coat: { price: 7.00, description: 'Double primer coat - better coverage' }
      },
      painting: { 
        one_coat: { price: 6.00, description: 'Single paint coat' },
        two_coat: { price: 9.50, description: 'Double paint coat - standard finish' },
        three_coat: { price: 13.00, description: 'Triple paint coat - premium finish' }
      }
    },
    ceiling: {
      preparation: { 
        light: { price: 4.00, description: 'Light ceiling prep' },
        medium: { price: 7.00, description: 'Medium ceiling prep' },
        heavy: { price: 11.00, description: 'Heavy ceiling prep' }
      },
      painting: { 
        one_coat: { price: 5.50, description: 'Single ceiling coat' },
        two_coat: { price: 8.50, description: 'Double ceiling coat' }
      }
    },
    interior: {
      doors: {
        easy_prep: { price: 75.00, description: 'Easy preparation' },
        medium_prep: { price: 85.00, description: 'Medium preparation' },
        heavy_prep: { price: 100.00, description: 'Heavy preparation' }
      },
      fixedWindows: {
        small: { price: 35.00, description: 'Small window' },
        medium: { price: 45.00, description: 'Medium window' },
        big: { price: 60.00, description: 'Big window' }
      },
      turnWindows: {
        small: { price: 45.00, description: 'Small turn window' },
        medium: { price: 55.00, description: 'Medium turn window' },
        big: { price: 70.00, description: 'Big turn window' }
      },
      stairs: { price: 25.00, description: 'Stair painting per step' },
      radiators: { price: 35.00, description: 'Radiator painting' },
      skirtingBoards: { price: 12.00, description: 'Skirting board per meter' },
      otherItems: { price: 10.00, description: 'Other interior items' }
    },
    exterior: {
      doors: {
        easy_prep: { price: 110.00, description: 'Easy preparation' },
        medium_prep: { price: 120.00, description: 'Medium preparation' },
        heavy_prep: { price: 140.00, description: 'Heavy preparation' }
      },
      fixedWindows: {
        small: { price: 55.00, description: 'Small window' },
        medium: { price: 65.00, description: 'Medium window' },
        big: { price: 80.00, description: 'Big window' }
      },
      turnWindows: {
        small: { price: 65.00, description: 'Small turn window' },
        medium: { price: 75.00, description: 'Medium turn window' },
        big: { price: 90.00, description: 'Big turn window' }
      },
      dormerWindows: {
        small: { price: 110.00, description: 'Small dormer window' },
        medium: { price: 120.00, description: 'Medium dormer window' },
        big: { price: 140.00, description: 'Big dormer window' }
      },
      fasciaBoards: { price: 18.00, description: 'Fascia board per meter' },
      rainPipe: { price: 15.00, description: 'Rain pipe per meter' },
      otherItems: { price: 15.00, description: 'Other exterior items' }
    },
    additional: {
      cleanup_fee: 150.00,
      materials_markup: 0.15
    }
  };

  // Get price info for display
  const getPriceInfo = (category, type, level) => {
    try {
      if (category === 'walls' || category === 'ceiling') {
        return pricing[category][type][level] || { price: 0, description: 'Unknown' };
      } else if ((category === 'interior' || category === 'exterior') && 
                 (type === 'doors' || type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows')) {
        // For doors and windows that have sub-options
        if (level) {
          return pricing[category][type][level] || { price: 0, description: 'Unknown' };
        } else {
          // Return default option if no level specified
          const defaultLevel = type === 'doors' ? 'medium_prep' : 'medium';
          return pricing[category][type][defaultLevel] || { price: 0, description: 'Unknown' };
        }
      } else {
        return pricing[category][type] || { price: 0, description: 'Unknown' };
      }
    } catch (e) {
      return { price: 0, description: 'Unknown' };
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  // Enhanced calculation that triggers on any change
  const calculateTotalCost = useCallback(() => {
    let total = 0;
    const breakdown = {
      roomTotals: {},
      interiorTotal: 0,
      exteriorTotal: 0,
      cleanupFee: 0
    };

    // Calculate room costs
    rooms.forEach(room => {
      let roomTotal = 0;
      
      (room.walls || []).forEach(wall => {
        const wallArea = parseFloat(wall.area) || 0;
        
        if (wall.sanding_level && pricing.walls.sanding[wall.sanding_level]) {
          const cost = wallArea * pricing.walls.sanding[wall.sanding_level].price;
          roomTotal += cost;
          total += cost;
        }
        
        if (wall.priming_coats && pricing.walls.priming[wall.priming_coats]) {
          const cost = wallArea * pricing.walls.priming[wall.priming_coats].price;
          roomTotal += cost;
          total += cost;
        }
        
        if (wall.painting_coats && pricing.walls.painting[wall.painting_coats]) {
          const cost = wallArea * pricing.walls.painting[wall.painting_coats].price;
          roomTotal += cost;
          total += cost;
        }
      });

      if (room.ceiling && (parseFloat(room.ceiling.area) || 0) > 0) {
        const ceilingArea = parseFloat(room.ceiling.area) || 0;
        
        if (room.ceiling.preparation_level && pricing.ceiling.preparation[room.ceiling.preparation_level]) {
          const cost = ceilingArea * pricing.ceiling.preparation[room.ceiling.preparation_level].price;
          roomTotal += cost;
          total += cost;
        }
        
        if (room.ceiling.painting_coats && pricing.ceiling.painting[room.ceiling.painting_coats]) {
          const cost = ceilingArea * pricing.ceiling.painting[room.ceiling.painting_coats].price;
          roomTotal += cost;
          total += cost;
        }
      }

      if (room.otherSurfaces && (parseFloat(room.otherSurfaces.area) || 0) > 0) {
        const otherSurfaceArea = parseFloat(room.otherSurfaces.area) || 0;
        const cost = otherSurfaceArea * pricing.interior.otherItems.price;
        roomTotal += cost;
        total += cost;
      }

      breakdown.roomTotals[room.name] = roomTotal;
    });

    // Calculate interior items cost
    Object.keys(interiorItems).forEach(type => {
      interiorItems[type].forEach(item => {
        const option = item.option;
        const priceInfo = getPriceInfo('interior', type, option);
        const cost = (parseFloat(item.quantity) || 0) * priceInfo.price;
        breakdown.interiorTotal += cost;
        total += cost;
      });
    });

    // Calculate exterior items cost
    Object.keys(exteriorItems).forEach(type => {
      exteriorItems[type].forEach(item => {
        const option = item.option;
        const priceInfo = getPriceInfo('exterior', type, option);
        const cost = (parseFloat(item.quantity) || 0) * priceInfo.price;
        breakdown.exteriorTotal += cost;
        total += cost;
      });
    });

    // Add cleanup fee if there are any items
    const hasItems = rooms.length > 0 || 
                    Object.values(interiorItems).some(items => items.length > 0) ||
                    Object.values(exteriorItems).some(items => items.length > 0);
    
    if (hasItems) {
      breakdown.cleanupFee = pricing.additional.cleanup_fee;
      total += breakdown.cleanupFee;
    }

    setTotalCost(total);
    setPriceBreakdown(breakdown);
  }, [rooms, interiorItems, exteriorItems]);

  // Trigger calculation whenever dependencies change
  useEffect(() => {
    calculateTotalCost();
  }, [calculateTotalCost]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
            
      const data = response.data.project;
      console.log('Project data:', data);
      setProject(data);
      
      // Load existing measurements if available
      if (data.manual_measurements) {
        const measurements = data.manual_measurements;
        
        if (measurements.rooms) {
          setRooms(measurements.rooms);
        }

        if (measurements.interiorItems) {
          setInteriorItems(measurements.interiorItems);
        }

        if (measurements.exteriorItems) {
          setExteriorItems(measurements.exteriorItems);
        }
        
        if (measurements.notes) {
          setNotes(measurements.notes);
        }
      }

      // Load AI analysis results if available with enhanced processing
      if (data.floor_plan_analysis && data.floor_plan_analysis.structured_measurements) {
        const structuredMeasurements = data.floor_plan_analysis.structured_measurements;
        
        // Only populate if current measurements are empty to avoid duplication
        if (rooms.length === 0 && structuredMeasurements.rooms && structuredMeasurements.rooms.length > 0) {
          setRooms(structuredMeasurements.rooms);
        }
        
        if (Object.values(interiorItems).every(items => items.length === 0) && structuredMeasurements.interior_items) {
          setInteriorItems(structuredMeasurements.interior_items);
        }
        
        if (Object.values(exteriorItems).every(items => items.length === 0) && structuredMeasurements.exterior_items) {
          setExteriorItems(structuredMeasurements.exterior_items);
        }
        
        if (!notes && structuredMeasurements.notes) {
          setNotes(structuredMeasurements.notes);
        }
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post(`/projects/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      await loadProject();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const performAIAnalysis = async () => {
    if (!project?.uploaded_images || project.uploaded_images.length === 0) {
      setError('Please upload floor plan images first');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await api.post(`/projects/${id}/analyze`, {});

      const data = response.data;
      
      // Update project with enhanced analysis results
      setProject(prev => ({ 
        ...prev, 
        floor_plan_analysis: data.analysis,
        status: 'ready'
      }));
      
      // Process enhanced structured measurements from AI analysis
      if (data.analysis && data.analysis.structured_measurements) {
        const structuredMeasurements = data.analysis.structured_measurements;
        
        // Only populate if current measurements are empty to avoid duplication
        if (rooms.length === 0) {
          setRooms(structuredMeasurements.rooms || []);
        }
        
        if (Object.values(interiorItems).every(items => items.length === 0)) {
          setInteriorItems(structuredMeasurements.interior_items || {
            doors: [], fixedWindows: [], turnWindows: [], stairs: [],
            radiators: [], skirtingBoards: [], otherItems: []
          });
        }
        
        if (Object.values(exteriorItems).every(items => items.length === 0)) {
          setExteriorItems(structuredMeasurements.exterior_items || {
            doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
            fasciaBoards: [], rainPipe: [], otherItems: []
          });
        }
        
        if (!notes && structuredMeasurements.notes) {
          setNotes(structuredMeasurements.notes);
        }
      }
      
      setError('');
    } catch (err) {
      setError(err.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Enhanced room management functions
  const addRoom = () => {
    const newRoom = {
      id: Date.now(),
      name: `Room ${rooms.length + 1}`,
      walls: [],
      ceiling: null,
      otherSurfaces: null,
      additionalItems: []
    };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const removeRoom = (roomId) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  // Enhanced wall management functions with automatic area calculation
  const addWallToRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            walls: [...(room.walls || []), {
              id: Date.now(),
              name: `Wall ${(room.walls || []).length + 1}`,
              length: 0,
              height: 2.4,
              area: 0,
              sanding_level: 'light',
              priming_coats: 'one_coat',
              painting_coats: 'two_coat'
            }]
          }
        : room
    ));
  };

  const updateWallInRoom = (roomId, wallId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? {
            ...room,
            walls: (room.walls || []).map(wall => {
              if (wall.id === wallId) {
                const updated = { ...wall, [field]: value };
                
                // Auto-calculate area when length or height changes
                if (field === 'length' || field === 'height') {
                  const length = parseFloat(field === 'length' ? value : updated.length) || 0;
                  const height = parseFloat(field === 'height' ? value : updated.height) || 0;
                  updated.area = (length * height).toFixed(2);
                }
                
                return updated;
              }
              return wall;
            })
          }
        : room
    ));
  };

  const removeWallFromRoom = (roomId, wallId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, walls: (room.walls || []).filter(wall => wall.id !== wallId) }
        : room
    ));
  };

  // Enhanced ceiling management functions with automatic area calculation
  const addCeilingToRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            ceiling: {
              width: 0,
              length: 0,
              area: 0,
              preparation_level: 'light',
              painting_coats: 'one_coat'
            }
          }
        : room
    ));
  };

  const updateCeilingInRoom = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            ceiling: { 
              ...room.ceiling, 
              [field]: value,
              area: field === 'width' || field === 'length' ? 
                ((field === 'width' ? parseFloat(value) : parseFloat(room.ceiling.width)) || 0) * 
                ((field === 'length' ? parseFloat(value) : parseFloat(room.ceiling.length)) || 0) :
                room.ceiling.area
            }
          }
        : room
    ));
  };

  const removeCeilingFromRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, ceiling: null } : room
    ));
  };

  // Other surfaces management with automatic calculation
  const addOtherSurfaceToRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            otherSurfaces: {
              id: Date.now(),
              description: '',
              area: 0
            }
          }
        : room
    ));
  };

  const updateOtherSurfaceInRoom = (roomId, field, value) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            otherSurfaces: { 
              ...room.otherSurfaces, 
              [field]: field === 'description' ? value : (parseFloat(value) || 0)
            }
          }
        : room
    ));
  };

  const removeOtherSurfaceFromRoom = (roomId) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, otherSurfaces: null } : room
    ));
  };

  // Enhanced interior items management with automatic cost calculation
  const addInteriorItem = (type) => {
    const getDefaultOption = (itemType) => {
      if (itemType === 'doors') return 'medium_prep';
      if (itemType === 'fixedWindows' || itemType === 'turnWindows') return 'medium';
      return null;
    };

    const defaultOption = getDefaultOption(type);
    const priceInfo = getPriceInfo('interior', type, defaultOption);

    const newItem = { 
      id: Date.now(), 
      quantity: 1, 
      description: '', 
      cost: priceInfo.price
    };

    if (defaultOption) {
      newItem.option = defaultOption;
    }

    setInteriorItems(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const updateInteriorItem = (type, id, field, value) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'option') {
            const quantity = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
            const option = field === 'option' ? value : updated.option;
            const priceInfo = getPriceInfo('interior', type, option);
            updated.quantity = quantity;
            updated.cost = quantity * priceInfo.price;
            if (field === 'option') updated.option = option;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeInteriorItem = (type, id) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  // Enhanced exterior items management with automatic cost calculation
  const addExteriorItem = (type) => {
    const getDefaultOption = (itemType) => {
      if (itemType === 'doors') return 'medium_prep';
      if (itemType === 'fixedWindows' || itemType === 'turnWindows' || itemType === 'dormerWindows') return 'medium';
      return null;
    };

    const defaultOption = getDefaultOption(type);
    const priceInfo = getPriceInfo('exterior', type, defaultOption);

    const newItem = { 
      id: Date.now(), 
      quantity: 1, 
      description: '', 
      cost: priceInfo.price
    };

    if (defaultOption) {
      newItem.option = defaultOption;
    }

    setExteriorItems(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const updateExteriorItem = (type, id, field, value) => {
    setExteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'option') {
            const quantity = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
            const option = field === 'option' ? value : updated.option;
            const priceInfo = getPriceInfo('exterior', type, option);
            updated.quantity = quantity;
            updated.cost = quantity * priceInfo.price;
            if (field === 'option') updated.option = option;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeExteriorItem = (type, id) => {
    setExteriorItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  const saveMeasurements = async () => {
    try {
      setSaving(true);
      const measurementData = { 
        rooms, 
        interiorItems,
        exteriorItems,
        notes, 
        totalCost 
      };

      const response = await api.post(`/projects/${id}/manual-measurements`, measurementData);

      if (project.status === 'draft') {
        setProject(prev => ({ ...prev, status: 'ready' }));
      }

      setError('');
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Measurements saved successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => document.body.removeChild(successDiv), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  const generateQuote = async () => {
    try {
      setGenerating(true);
      setError('');

      const hasRoomMeasurements = rooms.length > 0;
      const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
      const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);

      if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems) {
        setError('Please add some measurements before generating a quote');
        return;
      }

      const lineItems = [];

      // Process rooms with enhanced room-based organization
      rooms.forEach(room => {
        (room.walls || []).forEach(wall => {
          const wallArea = parseFloat(wall.area) || 0;
          if (wallArea > 0) {
            if (wall.sanding_level) {
              const priceInfo = getPriceInfo('walls', 'sanding', wall.sanding_level);
              lineItems.push({
                description: `${room.name} - ${wall.name} - Sanding (${wall.sanding_level})`,
                quantity: wallArea,
                unit: 'm²',
                unit_price: priceInfo.price,
                total: wallArea * priceInfo.price
              });
            }
            if (wall.priming_coats) {
              const priceInfo = getPriceInfo('walls', 'priming', wall.priming_coats);
              lineItems.push({
                description: `${room.name} - ${wall.name} - Priming (${wall.priming_coats})`,
                quantity: wallArea,
                unit: 'm²',
                unit_price: priceInfo.price,
                total: wallArea * priceInfo.price
              });
            }
            if (wall.painting_coats) {
              const priceInfo = getPriceInfo('walls', 'painting', wall.painting_coats);
              lineItems.push({
                description: `${room.name} - ${wall.name} - Painting (${wall.painting_coats})`,
                quantity: wallArea,
                unit: 'm²',
                unit_price: priceInfo.price,
                total: wallArea * priceInfo.price
              });
            }
          }
        });

        if (room.ceiling && (parseFloat(room.ceiling.area) || 0) > 0) {
          const ceilingArea = parseFloat(room.ceiling.area) || 0;
          if (room.ceiling.preparation_level) {
            const priceInfo = getPriceInfo('ceiling', 'preparation', room.ceiling.preparation_level);
            lineItems.push({
              description: `${room.name} - Ceiling Preparation (${room.ceiling.preparation_level})`,
              quantity: ceilingArea,
              unit: 'm²',
              unit_price: priceInfo.price,
              total: ceilingArea * priceInfo.price
            });
          }
          if (room.ceiling.painting_coats) {
            const priceInfo = getPriceInfo('ceiling', 'painting', room.ceiling.painting_coats);
            lineItems.push({
              description: `${room.name} - Ceiling Painting (${room.ceiling.painting_coats})`,
              quantity: ceilingArea,
              unit: 'm²',
              unit_price: priceInfo.price,
              total: ceilingArea * priceInfo.price
            });
          }
        }

        if (room.otherSurfaces && (parseFloat(room.otherSurfaces.area) || 0) > 0) {
          const surfaceArea = parseFloat(room.otherSurfaces.area) || 0;
          const priceInfo = getPriceInfo('interior', 'otherItems');
          lineItems.push({
            description: `${room.name} - Other Surface (${room.otherSurfaces.description || 'Other'})`,
            quantity: surfaceArea,
            unit: 'm²',
            unit_price: priceInfo.price,
            total: surfaceArea * priceInfo.price
          });
        }
      });

      // Process interior items with proper categorization
      Object.keys(interiorItems).forEach(type => {
        interiorItems[type].forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          if (quantity > 0) {
            const option = item.option;
            const priceInfo = getPriceInfo('interior', type, option);
            const typeName = type.replace(/([A-Z])/g, ' $1').toLowerCase();
            const optionText = option ? ` (${option.replace('_', ' ')})` : '';
            lineItems.push({
              description: `Interior - ${item.description || typeName}${optionText}`,
              quantity: quantity,
              unit: 'piece',
              unit_price: priceInfo.price,
              total: quantity * priceInfo.price
            });
          }
        });
      });

      // Process exterior items with proper categorization
      Object.keys(exteriorItems).forEach(type => {
        exteriorItems[type].forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          if (quantity > 0) {
            const option = item.option;
            const priceInfo = getPriceInfo('exterior', type, option);
            const typeName = type.replace(/([A-Z])/g, ' $1').toLowerCase();
            const optionText = option ? ` (${option.replace('_', ' ')})` : '';
            lineItems.push({
              description: `Exterior - ${item.description || typeName}${optionText}`,
              quantity: quantity,
              unit: 'piece',
              unit_price: priceInfo.price,
              total: quantity * priceInfo.price
            });
          }
        });
      });

      if (lineItems.length === 0) {
        setError('No line items generated. Please add some measurements.');
        return;
      }

      // Add cleanup fee
      lineItems.push({
        description: 'Cleanup and Site Preparation',
        quantity: 1,
        unit: 'job',
        unit_price: pricing.additional.cleanup_fee,
        total: pricing.additional.cleanup_fee
      });

      const quoteData = {
        title: `Paint Quote - ${project.name}`,
        description: `Professional painting quote for ${project.name}. ${notes ? 'Additional notes: ' + notes : ''}`,
        line_items: lineItems,
        valid_days: 30
      };

      const response = await api.post(`/quotes/project/${id}`, quoteData);
      const quote = response.data.quote;

      // Try to send email if client email is available
      if (project.client_email) {
        try {
          setSendingEmail(true);
          await api.post(`/quotes/${quote.id}/send`, {
            client_email: project.client_email
          });

          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successDiv.textContent = `Quote generated and sent to ${project.client_email}!`;
          document.body.appendChild(successDiv);
          setTimeout(() => document.body.removeChild(successDiv), 3000);
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          const warningDiv = document.createElement('div');
          warningDiv.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          warningDiv.textContent = 'Quote generated successfully, but email sending failed.';
          document.body.appendChild(warningDiv);
          setTimeout(() => document.body.removeChild(warningDiv), 3000);
        } finally {
          setSendingEmail(false);
        }
      } else {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        infoDiv.textContent = 'Quote generated successfully! No client email provided.';
        document.body.appendChild(infoDiv);
        setTimeout(() => document.body.removeChild(infoDiv), 3000);
      }

      await loadProject();
      navigate(`/quotes/${quote.id}`);

    } catch (err) {
      console.error('Generate quote error:', err);
      setError(err.message || 'Failed to generate quote. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      analyzing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      quoted: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const resetCalculator = () => {
    setRooms([]);
    setInteriorItems({
      doors: [], fixedWindows: [], turnWindows: [], stairs: [], 
      radiators: [], skirtingBoards: [], otherItems: []
    });
    setExteriorItems({
      doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [], 
      fasciaBoards: [], rainPipe: [], otherItems: []
    });
    setNotes('');
    setTotalCost(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 mx-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-slate-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-gray-200 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">{project?.name}</h1>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project?.status)}`}>
                    {project?.status}
                  </span>
                  {project?.client_name && (
                    <span className="ml-4 text-white opacity-90">
                      Client: {project.client_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                to={`/projects/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 rounded-md font-medium transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Project & Client Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="h-6 w-6 mr-3 text-teal-800" />
                Project & Client Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{project?.description || 'No description provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{project?.property_type}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{project?.client_name || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{project?.client_email || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{project?.client_phone || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{project?.client_address || 'Not provided'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Enhanced Floor Plan Upload & AI Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Brain className="h-6 w-6 mr-3 text-teal-800" />
                Enhanced Floor Plan Analysis
              </h2>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Floor Plans</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your floor plan images here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports: PNG, JPG, PDF (max 32MB each)
                  </p>
                  
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="floor-plan-upload"
                    disabled={uploading}
                  />
                  
                  <label
                    htmlFor="floor-plan-upload"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 cursor-pointer disabled:opacity-50"
                  >
                    Choose Files
                  </label>
                </div>

                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {project?.uploaded_images && project.uploaded_images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.uploaded_images.map((imagePath, index) => {
                      // Generate multiple possible image URLs for fallback
                      const filename = imagePath.split('/').pop();
                      const encodedFilename = encodeURIComponent(filename);
                      
                      const imageUrls = [
                        // Primary: Authenticated project file endpoint
                        `/api/projects/${id}/files/${encodedFilename}`,
                        // Fallback 1: Static uploads with full path
                        `/static/uploads/${imagePath.replace(/^.*[\\\/]uploads[\\\/]/, '')}`,
                        // Fallback 2: Direct filename in uploads
                        `/static/uploads/${filename}`,
                        // Fallback 3: Company/project specific path
                        `/static/uploads/${project.company_id || 'unknown'}/${id}/${filename}`
                      ];

                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <ImageWithFallback
                              urls={imageUrls}
                              alt={`Floor Plan ${index + 1}`}
                              className="w-full h-full object-cover"
                              fallbackIcon={<FileImage className="h-8 w-8 text-gray-400" />}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">
                              Floor Plan {index + 1}
                            </p>
                            <button
                              onClick={() => window.open(imageUrls[0], '_blank')}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              title="View full size"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </div>
                          {/* Debug info in development */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="mt-1 text-xs text-gray-400 font-mono truncate" title={imagePath}>
                              Path: {filename}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Enhanced AI Analysis</h3>
                  <button
                    onClick={performAIAnalysis}
                    disabled={analyzing || !project?.uploaded_images?.length}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing with Enhanced AI...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start Enhanced AI Analysis
                      </>
                    )}
                  </button>
                </div>

                {project?.floor_plan_analysis && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 bg-green-500 text-white rounded-full mr-2" />
                      <span className="text-green-700 font-medium">Enhanced analysis completed successfully</span>
                    </div>
                    <p className="text-green-600 text-sm">
                      Room measurements and interior/exterior items have been automatically identified and populated
                    </p>
                    {project.floor_plan_analysis.work_classification && (
                      <div className="mt-3 text-sm text-green-600">
                        <p>• Interior rooms detected: {Object.keys(project.floor_plan_analysis.work_classification.interior_work?.rooms || {}).length}</p>
                        <p>• Exterior features detected: {(project.floor_plan_analysis.work_classification.exterior_work?.walls || []).length}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Room-Based Measurements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Layers className="h-6 w-6 mr-3 text-teal-800" />
                  Room-Based Measurements
                </h2>
                <button
                  onClick={addRoom}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </button>
              </div>

              {rooms.map((room) => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                      className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Walls Section with Enhanced Price Display */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Square className="h-5 w-5 mr-2 text-blue-600" />
                        Walls
                      </h4>
                      <button
                        onClick={() => addWallToRoom(room.id)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        + Add Wall
                      </button>
                    </div>

                    {(room.walls || []).map((wall) => (
                      <div key={wall.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wall Name</label>
                            <input
                              type="text"
                              value={wall.name}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={wall.length || ''}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'length', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={wall.height || ''}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'height', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                            <input
                              type="text"
                              value={wall.area || '0.00'}
                              readOnly
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sanding
                              <Info className="h-4 w-4 inline ml-1 text-gray-400" title="Price varies by level" />
                            </label>
                            <select
                              value={wall.sanding_level}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'sanding_level', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="light">Light (£{pricing.walls.sanding.light.price}/m²)</option>
                              <option value="medium">Medium (£{pricing.walls.sanding.medium.price}/m²)</option>
                              <option value="heavy">Heavy (£{pricing.walls.sanding.heavy.price}/m²)</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeWallFromRoom(room.id, wall.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Additional wall options in a second row with enhanced pricing display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priming
                              <span className="text-xs text-gray-500 ml-2">
                                Current: £{(parseFloat(wall.area) || 0) * getPriceInfo('walls', 'priming', wall.priming_coats).price} total
                              </span>
                            </label>
                            <select
                              value={wall.priming_coats}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'priming_coats', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="one_coat">One Coat (£{pricing.walls.priming.one_coat.price}/m²)</option>
                              <option value="two_coat">Two Coats (£{pricing.walls.priming.two_coat.price}/m²)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Painting
                              <span className="text-xs text-gray-500 ml-2">
                                Current: £{(parseFloat(wall.area) || 0) * getPriceInfo('walls', 'painting', wall.painting_coats).price} total
                              </span>
                            </label>
                            <select
                              value={wall.painting_coats}
                              onChange={(e) => updateWallInRoom(room.id, wall.id, 'painting_coats', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="one_coat">One Coat (£{pricing.walls.painting.one_coat.price}/m²)</option>
                              <option value="two_coat">Two Coats (£{pricing.walls.painting.two_coat.price}/m²)</option>
                              <option value="three_coat">Three Coats (£{pricing.walls.painting.three_coat.price}/m²)</option>
                            </select>
                          </div>
                        </div>

                        {/* Real-time wall cost display */}
                        {parseFloat(wall.area) > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-blue-900">Wall Cost:</span>
                              <span className="font-bold text-blue-900">
                                £{(
                                  (parseFloat(wall.area) || 0) * (
                                    getPriceInfo('walls', 'sanding', wall.sanding_level).price +
                                    getPriceInfo('walls', 'priming', wall.priming_coats).price +
                                    getPriceInfo('walls', 'painting', wall.painting_coats).price
                                  )
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Ceiling Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-green-600" />
                        Ceiling
                      </h4>
                      {!room.ceiling ? (
                        <button
                          onClick={() => addCeilingToRoom(room.id)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          + Add Ceiling
                        </button>
                      ) : (
                        <button
                          onClick={() => removeCeilingFromRoom(room.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove Ceiling
                        </button>
                      )}
                    </div>

                    {room.ceiling && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={room.ceiling.width || ''}
                              onChange={(e) => updateCeilingInRoom(room.id, 'width', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={room.ceiling.length || ''}
                              onChange={(e) => updateCeilingInRoom(room.id, 'length', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                            <input
                              type="text"
                              value={(parseFloat(room.ceiling.width) * parseFloat(room.ceiling.length) || 0).toFixed(2)}
                              readOnly
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preparation</label>
                            <select
                              value={room.ceiling.preparation_level}
                              onChange={(e) => updateCeilingInRoom(room.id, 'preparation_level', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="light">Light (£{pricing.ceiling.preparation.light.price}/m²)</option>
                              <option value="medium">Medium (£{pricing.ceiling.preparation.medium.price}/m²)</option>
                              <option value="heavy">Heavy (£{pricing.ceiling.preparation.heavy.price}/m²)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Painting</label>
                            <select
                              value={room.ceiling.painting_coats}
                              onChange={(e) => updateCeilingInRoom(room.id, 'painting_coats', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="one_coat">One Coat (£{pricing.ceiling.painting.one_coat.price}/m²)</option>
                              <option value="two_coat">Two Coats (£{pricing.ceiling.painting.two_coat.price}/m²)</option>
                            </select>
                          </div>
                        </div>

                        {/* Real-time ceiling cost display */}
                        {(parseFloat(room.ceiling.width) * parseFloat(room.ceiling.length) || 0) > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-green-900">Ceiling Cost:</span>
                              <span className="font-bold text-green-900">
                                £{(
                                  (parseFloat(room.ceiling.width) * parseFloat(room.ceiling.length) || 0) * (
                                    getPriceInfo('ceiling', 'preparation', room.ceiling.preparation_level).price +
                                    getPriceInfo('ceiling', 'painting', room.ceiling.painting_coats).price
                                  )
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Other Surfaces Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Paintbrush2 className="h-5 w-5 mr-2 text-purple-600" />
                        Other Surfaces
                      </h4>
                      {!room.otherSurfaces ? (
                        <button
                          onClick={() => addOtherSurfaceToRoom(room.id)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          + Add Other Surface
                        </button>
                      ) : (
                        <button
                          onClick={() => removeOtherSurfaceFromRoom(room.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove Other Surface
                        </button>
                      )}
                    </div>

                    {room.otherSurfaces && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={room.otherSurfaces.description}
                              onChange={(e) => updateOtherSurfaceInRoom(room.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              placeholder="e.g., Trim, Molding, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Area (m²)
                              <span className="text-xs text-gray-500 ml-2">
                                £{pricing.interior.otherItems.price}/m²
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={room.otherSurfaces.area || ''}
                              onChange={(e) => updateOtherSurfaceInRoom(room.id, 'area', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="text-sm text-purple-900">
                              <span className="font-medium">Cost: </span>
                              <span className="font-bold">
                                £{((parseFloat(room.otherSurfaces.area) || 0) * pricing.interior.otherItems.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Total Display */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">{room.name} Total:</span>
                      <span className="text-xl font-bold text-teal-600">
                        £{(priceBreakdown.roomTotals[room.name] || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {rooms.length === 0 && (
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms added yet</h3>
                  <p className="text-gray-500 mb-6">
                    Add rooms manually or upload floor plans for enhanced AI analysis
                  </p>
                  <button
                    onClick={addRoom}
                    className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Room
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Interior Work */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Home className="h-6 w-6 mr-3 text-teal-800" />
                Interior Work
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {['doors', 'fixedWindows', 'turnWindows', 'stairs', 'radiators', 'skirtingBoards'].map((type) => {
                  const defaultOption = type === 'doors' ? 'medium_prep' : (type === 'fixedWindows' || type === 'turnWindows' ? 'medium' : null);
                  const priceInfo = getPriceInfo('interior', type, defaultOption);
                  
                  return (
                    <button
                      key={type}
                      onClick={() => addInteriorItem(type)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-300 hover:border-purple-300"
                      title={`Add ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} - £${priceInfo.price} each`}
                    >
                      <div className="text-center">
                        <div className="font-medium">
                          {type === 'doors' && 'Doors'}
                          {type === 'fixedWindows' && 'Fixed Windows'}
                          {type === 'turnWindows' && 'Turn Windows'}
                          {type === 'stairs' && 'Stairs'}
                          {type === 'radiators' && 'Radiators'}
                          {type === 'skirtingBoards' && 'Skirting Boards'}
                        </div>
                        <div className="text-xs text-gray-500">
                          £{priceInfo.price}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {Object.keys(interiorItems).map((type) => (
                interiorItems[type].length > 0 && (
                  <div key={type} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900 capitalize">
                        {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </h4>
                      <div className="text-sm text-gray-500">
                        £{pricing.interior[type]?.price || 0} each • Total: £{interiorItems[type].reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2)}
                      </div>
                    </div>
                    {interiorItems[type].map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInteriorItem(type, item.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder={`${type} description`}
                            />
                          </div>
                          
                          {/* Conditional option select for doors and windows */}
                          {(type === 'doors' || type === 'fixedWindows' || type === 'turnWindows') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {type === 'doors' ? 'Preparation' : 'Size'}
                              </label>
                              <select
                                value={item.option || (type === 'doors' ? 'medium_prep' : 'medium')}
                                onChange={(e) => updateInteriorItem(type, item.id, 'option', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                {type === 'doors' ? (
                                  <>
                                    <option value="easy_prep">Easy (£{pricing.interior.doors.easy_prep.price})</option>
                                    <option value="medium_prep">Medium (£{pricing.interior.doors.medium_prep.price})</option>
                                    <option value="heavy_prep">Heavy (£{pricing.interior.doors.heavy_prep.price})</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="small">Small (£{pricing.interior[type].small.price})</option>
                                    <option value="medium">Medium (£{pricing.interior[type].medium.price})</option>
                                    <option value="big">Big (£{pricing.interior[type].big.price})</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                              <span className="text-xs text-gray-500 ml-2">
                                @ £{getPriceInfo('interior', type, item.option).price} each
                              </span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateInteriorItem(type, item.id, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (£)</label>
                            <input
                              type="text"
                              value={`£${((parseFloat(item.quantity) || 0) * getPriceInfo('interior', type, item.option).price).toFixed(2)}`}
                              readOnly
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => removeInteriorItem(type, item.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>

            {/* Enhanced Exterior Work */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building className="h-6 w-6 mr-3 text-teal-800" />
                Exterior Work
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {['doors', 'fixedWindows', 'turnWindows', 'dormerWindows', 'fasciaBoards', 'rainPipe'].map((type) => {
                  const defaultOption = type === 'doors' ? 'medium_prep' : 
                                       (type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows' ? 'medium' : null);
                  const priceInfo = getPriceInfo('exterior', type, defaultOption);
                  
                  return (
                    <button
                      key={type}
                      onClick={() => addExteriorItem(type)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-300 hover:border-blue-300"
                      title={`Add ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} - £${priceInfo.price} each`}
                    >
                      <div className="text-center">
                        <div className="font-medium">
                          {type === 'doors' && 'Doors'}
                          {type === 'fixedWindows' && 'Fixed Windows'}
                          {type === 'turnWindows' && 'Turn Windows'}
                          {type === 'dormerWindows' && 'Dormer Windows'}
                          {type === 'fasciaBoards' && 'Fascia Boards'}
                          {type === 'rainPipe' && 'Rain Pipe'}
                        </div>
                        <div className="text-xs text-gray-500">
                          £{priceInfo.price}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {Object.keys(exteriorItems).map((type) => (
                exteriorItems[type].length > 0 && (
                  <div key={type} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900 capitalize">
                        {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </h4>
                      <div className="text-sm text-gray-500">
                        £{pricing.exterior[type]?.price || 0} each • Total: £{exteriorItems[type].reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2)}
                      </div>
                    </div>
                    {exteriorItems[type].map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateExteriorItem(type, item.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder={`${type} description`}
                            />
                          </div>
                          
                          {/* Conditional option select for doors and windows */}
                          {(type === 'doors' || type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {type === 'doors' ? 'Preparation' : 'Size'}
                              </label>
                              <select
                                value={item.option || (type === 'doors' ? 'medium_prep' : 'medium')}
                                onChange={(e) => updateExteriorItem(type, item.id, 'option', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                {type === 'doors' ? (
                                  <>
                                    <option value="easy_prep">Easy (£{pricing.exterior.doors.easy_prep.price})</option>
                                    <option value="medium_prep">Medium (£{pricing.exterior.doors.medium_prep.price})</option>
                                    <option value="heavy_prep">Heavy (£{pricing.exterior.doors.heavy_prep.price})</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="small">Small (£{pricing.exterior[type].small.price})</option>
                                    <option value="medium">Medium (£{pricing.exterior[type].medium.price})</option>
                                    <option value="big">Big (£{pricing.exterior[type].big.price})</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                              <span className="text-xs text-gray-500 ml-2">
                                @ £{getPriceInfo('exterior', type, item.option).price} each
                              </span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateExteriorItem(type, item.id, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (£)</label>
                            <input
                              type="text"
                              value={`£${((parseFloat(item.quantity) || 0) * getPriceInfo('exterior', type, item.option).price).toFixed(2)}`}
                              readOnly
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => removeExteriorItem(type, item.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Enter project notes, special requirements, or additional details..."
              />
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Enhanced Total Cost Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Total Cost:</h3>
                  <p className="text-4xl font-bold text-teal-800">£{totalCost.toFixed(2)}</p>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-4 text-sm text-teal-600 hover:text-teal-700 underline"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      {Object.entries(priceBreakdown.roomTotals).map(([roomName, total]) => (
                        total > 0 && (
                          <div key={roomName} className="flex justify-between">
                            <span className="text-gray-600">{roomName}:</span>
                            <span className="font-medium">£{total.toFixed(2)}</span>
                          </div>
                        )
                      ))}
                      
                      {priceBreakdown.interiorTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interior items:</span>
                          <span className="font-medium">£{priceBreakdown.interiorTotal.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {priceBreakdown.exteriorTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Exterior items:</span>
                          <span className="font-medium">£{priceBreakdown.exteriorTotal.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {priceBreakdown.cleanupFee > 0 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-600">Cleanup fee:</span>
                          <span className="font-medium">£{priceBreakdown.cleanupFee.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={generateQuote}
                  disabled={generating || sendingEmail || totalCost === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Enhanced Quote...
                    </>
                  ) : sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Generate & Email Quote
                    </>
                  )}
                </button>

                <button
                  onClick={saveMeasurements}
                  disabled={saving}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Measurements
                    </>
                  )}
                </button>

                <button
                  onClick={resetCalculator}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset Calculator
                </button>
              </div>

              {/* Enhanced Project Status Card */}
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <h4 className="font-bold text-teal-900 mb-2">Project Status</h4>
                <div className="space-y-2 text-sm text-teal-800">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{project?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rooms:</span>
                    <span>{rooms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interior Items:</span>
                    <span>{Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exterior Items:</span>
                    <span>{Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0)}</span>
                  </div>
                  {project?.client_email && (
                    <div className="flex items-center text-xs mt-3">
                      <Mail className="h-3 w-3 mr-1" />
                      <span>{project.client_email}</span>
                    </div>
                  )}
                  {project?.client_phone && (
                    <div className="flex items-center text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      <span>{project.client_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced AI Analysis Results */}
              {project?.floor_plan_analysis && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">AI Analysis Results</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    {project.floor_plan_analysis.surface_areas && (
                      <>
                        <div className="flex justify-between">
                          <span>Total Floor Area:</span>
                          <span>{project.floor_plan_analysis.surface_areas.totals?.total_floor_area_m2?.toFixed(2) || 0} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Wall Area:</span>
                          <span>{project.floor_plan_analysis.surface_areas.totals?.total_wall_area_m2?.toFixed(2) || 0} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Detected Rooms:</span>
                          <span>{project.floor_plan_analysis.surface_areas.totals?.total_rooms || 0}</span>
                        </div>
                      </>
                    )}
                    {project.floor_plan_analysis.work_classification && (
                      <>
                        <div className="flex justify-between">
                          <span>Interior Features:</span>
                          <span>{Object.keys(project.floor_plan_analysis.work_classification.interior_work?.rooms || {}).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exterior Features:</span>
                          <span>{(project.floor_plan_analysis.work_classification.exterior_work?.walls || []).length}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;