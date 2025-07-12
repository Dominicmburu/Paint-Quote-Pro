// 1. Updated ProjectDetails.jsx - Main Component with Centralized Total Calculation
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, FileText, CheckCircle, AlertCircle, RefreshCw, Brain, Users,
  Home, Building, DollarSign, Settings, X, Upload, Play, Mail, Calculator, Save
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import ErrorBoundary from '../common/ErrorBoundary';
import RoomMeasurements from './RoomMeasurements';
import InteriorWork from './InteriorWork';
import ExteriorWork from './ExteriorWork';
import SpecialJobsSection from './SpecialJobsSection';
import FloorPlanUpload from './FloorPlanUpload';
import ClientInformation from './ClientInformation';
import { usePricing } from '../../hooks/usePricing';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pricing } = usePricing();

  // State management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [customPricing, setCustomPricing] = useState(null);
  const [pricingError, setPricingError] = useState(null);
  const [currentStep, setCurrentStep] = useState('project');

  // Auto-save debounce timer
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  // Form data states - loaded from database
  const [rooms, setRooms] = useState([]);
  const [interiorItems, setInteriorItems] = useState({
    doors: [], fixedWindows: [], turnWindows: [], stairs: [],
    radiators: [], skirtingBoards: [], otherItems: []
  });
  const [exteriorItems, setExteriorItems] = useState({
    doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
    fasciaBoards: [], rainPipe: [], otherItems: []
  });
  const [specialJobs, setSpecialJobs] = useState([]);
  const [notes, setNotes] = useState('');

  // CENTRAL TOTAL CALCULATION STATE
  const [totalCosts, setTotalCosts] = useState({
    rooms: 0,
    interior: 0,
    exterior: 0,
    specialJobs: 0,
    total: 0
  });

  // CENTRALIZED COST CALCULATION FUNCTION
  // const calculateTotalCosts = useCallback(() => {
  //   if (!pricing) {
  //     console.log('⚠️ Pricing not loaded yet, skipping cost calculation');
  //     setTotalCosts({
  //       rooms: 0,
  //       interior: 0,
  //       exterior: 0,
  //       specialJobs: 0,
  //       total: 0
  //     });
  //     return;
  //   }

  //   let roomsTotal = 0;
  //   let interiorTotal = 0;
  //   let exteriorTotal = 0;
  //   let specialJobsTotal = 0;

  //   try {
  //     console.log('🔄 Starting centralized cost calculation...');

  //     // CALCULATE ROOMS COST (Walls and Ceilings)
  //     rooms.forEach(room => {
  //       // Calculate wall costs
  //       (room.walls || []).forEach(wall => {
  //         const area = parseFloat(wall.area) || 0;
          
  //         if (wall.sanding_filling) {
  //           const price = pricing.walls?.sanding?.light?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Wall sanding/filling: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (wall.priming) {
  //           const price = pricing.walls?.priming?.one_coat?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Wall priming: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (wall.one_coat) {
  //           const price = pricing.walls?.painting?.one_coat?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Wall 1 coat: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (wall.two_coats) {
  //           const price = pricing.walls?.painting?.two_coat?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Wall 2 coats: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //       });

  //       // Calculate ceiling costs
  //       if (room.ceiling) {
  //         const area = parseFloat(room.ceiling.area) || 0;
          
  //         if (room.ceiling.sanding_filling) {
  //           const price = pricing.ceiling?.preparation?.light?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Ceiling sanding/filling: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (room.ceiling.priming) {
  //           const price = pricing.ceiling?.preparation?.light?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Ceiling priming: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (room.ceiling.one_coat) {
  //           const price = pricing.ceiling?.painting?.one_coat?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Ceiling 1 coat: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //         if (room.ceiling.two_coats) {
  //           const price = pricing.ceiling?.painting?.two_coat?.price || 0;
  //           roomsTotal += area * price;
  //           console.log(`Ceiling 2 coats: ${area}m² × £${price} = £${(area * price).toFixed(2)}`);
  //         }
  //       }
  //     });

  //     // CALCULATE INTERIOR ITEMS COST
  //     Object.keys(interiorItems).forEach(type => {
  //       interiorItems[type].forEach(item => {
  //         const quantity = parseFloat(item.quantity) || 1;
  //         let unitPrice = 0;

  //         if (type === 'doors') {
  //           unitPrice = pricing.interior?.doors?.[item.condition]?.price || 0;
  //         } else if (type === 'fixedWindows' || type === 'turnWindows') {
  //           unitPrice = pricing.interior?.[type]?.[item.size]?.price || 0;
  //         } else if (type === 'stairs' || type === 'radiators' || type === 'skirtingBoards' || type === 'otherItems') {
  //           unitPrice = pricing.interior?.[type]?.price || 0;
  //         }

  //         const itemCost = quantity * unitPrice;
  //         interiorTotal += itemCost;
  //         console.log(`Interior ${type}: ${quantity} × £${unitPrice} = £${itemCost.toFixed(2)}`);
  //       });
  //     });

  //     // CALCULATE EXTERIOR ITEMS COST
  //     Object.keys(exteriorItems).forEach(type => {
  //       exteriorItems[type].forEach(item => {
  //         const quantity = parseFloat(item.quantity) || 1;
  //         let unitPrice = 0;

  //         if (type === 'doors') {
  //           unitPrice = pricing.exterior?.doors?.[item.condition]?.price || 0;
  //         } else if (type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows') {
  //           unitPrice = pricing.exterior?.[type]?.[item.size]?.price || 0;
  //         } else if (type === 'fasciaBoards' || type === 'rainPipe' || type === 'otherItems') {
  //           unitPrice = pricing.exterior?.[type]?.price || 0;
  //         }

  //         const itemCost = quantity * unitPrice;
  //         exteriorTotal += itemCost;
  //         console.log(`Exterior ${type}: ${quantity} × £${unitPrice} = £${itemCost.toFixed(2)}`);
  //       });
  //     });

  //     // CALCULATE SPECIAL JOBS COST
  //     specialJobs.forEach(job => {
  //       const unitPrice = parseFloat(job.unitPrice) || 0;
  //       const quantity = parseFloat(job.quantity) || 1;
  //       const jobCost = unitPrice * quantity;
  //       specialJobsTotal += jobCost;
  //       console.log(`Special job ${job.name}: ${quantity} × £${unitPrice} = £${jobCost.toFixed(2)}`);
  //     });

  //     const grandTotal = roomsTotal + interiorTotal + exteriorTotal + specialJobsTotal;

  //     // UPDATE STATE WITH BREAKDOWN
  //     setTotalCosts({
  //       rooms: roomsTotal,
  //       interior: interiorTotal,
  //       exterior: exteriorTotal,
  //       specialJobs: specialJobsTotal,
  //       total: grandTotal
  //     });

  //     console.log('💰 Centralized cost calculation completed:', {
  //       rooms: roomsTotal.toFixed(2),
  //       interior: interiorTotal.toFixed(2),
  //       exterior: exteriorTotal.toFixed(2),
  //       specialJobs: specialJobsTotal.toFixed(2),
  //       total: grandTotal.toFixed(2)
  //     });

  //   } catch (error) {
  //     console.error('❌ Error in centralized cost calculation:', error);
  //     setTotalCosts({
  //       rooms: 0,
  //       interior: 0,
  //       exterior: 0,
  //       specialJobs: 0,
  //       total: 0
  //     });
  //   }
  // }, [rooms, interiorItems, exteriorItems, specialJobs, pricing]);

  const calculateTotalCosts = useCallback(() => {
  if (!pricing) {
    console.log('⚠️ Pricing not loaded yet, skipping cost calculation');
    setTotalCosts({
      rooms: 0,
      interior: 0,
      exterior: 0,
      specialJobs: 0,
      total: 0
    });
    return;
  }

  let roomsTotal = 0;
  let interiorTotal = 0;
  let exteriorTotal = 0;
  let specialJobsTotal = 0;

  try {
    console.log('🔄 Starting centralized cost calculation...');
    console.log('💰 Available pricing structure:', pricing);

    // CALCULATE ROOMS COST (Walls and Ceilings)
    rooms.forEach(room => {
      console.log(`🏠 Calculating costs for room: ${room.name}`);
      
      // Calculate wall costs
      (room.walls || []).forEach(wall => {
        const area = parseFloat(wall.area) || 0;
        console.log(`📐 Wall area: ${area}m²`);
        
        if (wall.sanding_filling) {
          const price = pricing.walls?.sanding?.light?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🔨 Wall sanding/filling: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (wall.priming) {
          const price = pricing.walls?.priming?.one_coat?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🎨 Wall priming: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (wall.one_coat) {
          const price = pricing.walls?.painting?.one_coat?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🖌️ Wall 1 coat: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (wall.two_coats) {
          const price = pricing.walls?.painting?.two_coat?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🖌️🖌️ Wall 2 coats: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
      });

      // Calculate ceiling costs
      if (room.ceiling) {
        const area = parseFloat(room.ceiling.area) || 0;
        console.log(`🏔️ Ceiling area: ${area}m²`);
        
        if (room.ceiling.sanding_filling) {
          const price = pricing.ceiling?.preparation?.light?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🔨 Ceiling sanding/filling: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (room.ceiling.priming) {
          const price = pricing.ceiling?.preparation?.light?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🎨 Ceiling priming: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (room.ceiling.one_coat) {
          const price = pricing.ceiling?.painting?.one_coat?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🖌️ Ceiling 1 coat: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
        if (room.ceiling.two_coats) {
          const price = pricing.ceiling?.painting?.two_coat?.price || 0;
          const cost = area * price;
          roomsTotal += cost;
          console.log(`🖌️🖌️ Ceiling 2 coats: ${area}m² × £${price} = £${cost.toFixed(2)}`);
        }
      }
    });

    // 🔧 FIXED: CALCULATE INTERIOR ITEMS COST WITH CORRECT DOOR PRICING
    Object.keys(interiorItems).forEach(type => {
      interiorItems[type].forEach(item => {
        const quantity = parseFloat(item.quantity) || 1;
        let unitPrice = 0;

        console.log(`🔍 Processing interior ${type}:`, item);

        if (type === 'doors') {
          // 🚨 FIX: Map the condition to the correct pricing structure
          const conditionMapping = {
            'level_1': 'easy_prep',    // Level 1 = Easy Prep
            'level_2': 'medium_prep',  // Level 2 = Medium Prep  
            'level_3': 'heavy_prep',   // Level 3 = Heavy Prep
            'level_4': 'heavy_prep'    // Level 4 = Heavy Prep (same as level 3)
          };
          
          const mappedCondition = conditionMapping[item.condition] || 'easy_prep';
          unitPrice = pricing.interior?.doors?.[mappedCondition]?.price || 0;
          
          console.log(`🚪 Interior Door: condition=${item.condition} → mapped=${mappedCondition} → price=£${unitPrice}`);
          
        } else if (type === 'fixedWindows' || type === 'turnWindows') {
          unitPrice = pricing.interior?.[type]?.[item.size]?.price || 0;
          console.log(`🪟 Interior Window ${type}: size=${item.size} → price=£${unitPrice}`);
          
        } else if (type === 'stairs' || type === 'radiators' || type === 'skirtingBoards' || type === 'otherItems') {
          unitPrice = pricing.interior?.[type]?.price || 0;
          console.log(`🏠 Interior ${type}: price=£${unitPrice}`);
        }

        const itemCost = quantity * unitPrice;
        interiorTotal += itemCost;
        console.log(`💰 Interior ${type}: ${quantity} × £${unitPrice} = £${itemCost.toFixed(2)}`);
      });
    });

    // 🔧 FIXED: CALCULATE EXTERIOR ITEMS COST WITH CORRECT DOOR PRICING
    Object.keys(exteriorItems).forEach(type => {
      exteriorItems[type].forEach(item => {
        const quantity = parseFloat(item.quantity) || 1;
        let unitPrice = 0;

        console.log(`🔍 Processing exterior ${type}:`, item);

        if (type === 'doors') {
          // 🚨 FIX: Map the door type to the correct pricing structure
          const doorTypeMapping = {
            'front': 'front_door',
            'garage': 'garage_door', 
            'outside': 'outside_door'
          };
          
          const mappedDoorType = doorTypeMapping[item.doorType] || 'front_door';
          unitPrice = pricing.exterior?.doors?.[mappedDoorType]?.price || 0;
          
          console.log(`🚪 Exterior Door: doorType=${item.doorType} → mapped=${mappedDoorType} → price=£${unitPrice}`);
          
        } else if (type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows') {
          unitPrice = pricing.exterior?.[type]?.[item.size]?.price || 0;
          console.log(`🪟 Exterior Window ${type}: size=${item.size} → price=£${unitPrice}`);
          
        } else if (type === 'fasciaBoards' || type === 'rainPipe' || type === 'otherItems') {
          unitPrice = pricing.exterior?.[type]?.price || 0;
          console.log(`🏠 Exterior ${type}: price=£${unitPrice}`);
        }

        const itemCost = quantity * unitPrice;
        exteriorTotal += itemCost;
        console.log(`💰 Exterior ${type}: ${quantity} × £${unitPrice} = £${itemCost.toFixed(2)}`);
      });
    });

    // CALCULATE SPECIAL JOBS COST (unchanged)
    specialJobs.forEach(job => {
      const unitPrice = parseFloat(job.unitPrice) || 0;
      const quantity = parseFloat(job.quantity) || 1;
      const jobCost = unitPrice * quantity;
      specialJobsTotal += jobCost;
      console.log(`🔧 Special job ${job.name}: ${quantity} × £${unitPrice} = £${jobCost.toFixed(2)}`);
    });

    const grandTotal = roomsTotal + interiorTotal + exteriorTotal + specialJobsTotal;

    // UPDATE STATE WITH BREAKDOWN
    setTotalCosts({
      rooms: roomsTotal,
      interior: interiorTotal,
      exterior: exteriorTotal,
      specialJobs: specialJobsTotal,
      total: grandTotal
    });

    console.log('💰 Centralized cost calculation completed:', {
      rooms: roomsTotal.toFixed(2),
      interior: interiorTotal.toFixed(2),
      exterior: exteriorTotal.toFixed(2),
      specialJobs: specialJobsTotal.toFixed(2),
      total: grandTotal.toFixed(2)
    });

  } catch (error) {
    console.error('❌ Error in centralized cost calculation:', error);
    setTotalCosts({
      rooms: 0,
      interior: 0,
      exterior: 0,
      specialJobs: 0,
      total: 0
    });
  }
}, [rooms, interiorItems, exteriorItems, specialJobs, pricing]);


  // TRIGGER CALCULATION WHENEVER DATA CHANGES
  useEffect(() => {
    calculateTotalCosts();
  }, [calculateTotalCosts]);

  const handleClientUpdate = (updatedProject) => {
    setProject(updatedProject);
    showSuccessMessage('Client information saved! You can now upload floor plans.');
    setCurrentStep('floor-plans');
  };

  const getAvailableSteps = () => {
    const steps = [
      { id: 'project', label: 'Project Info', available: true },
      { id: 'client', label: 'Client Info', available: true },
      { id: 'floor-plans', label: 'Floor Plans', available: project?.client_email || project?.client_name },
      { id: 'measurements', label: 'Measurements', available: project?.uploaded_images?.length > 0 || rooms.length > 0 }
    ];
    return steps;
  };

  // Auto-save function with debouncing
  const autoSave = async (data) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(async () => {
      try {
        console.log('🔄 Auto-saving measurements...');
        await api.post(`/projects/${id}/manual-measurements`, data);
        console.log('✅ Auto-save successful');
      } catch (err) {
        console.error('❌ Auto-save failed:', err);
      }
    }, 2000);

    setAutoSaveTimer(timer);
  };

  // Auto-save whenever data changes
  useEffect(() => {
    if (project && (rooms.length > 0 || 
        Object.values(interiorItems).some(items => items.length > 0) ||
        Object.values(exteriorItems).some(items => items.length > 0) ||
        specialJobs.length > 0 ||
        notes.trim() !== '')) {
      
      const measurementData = {
        rooms,
        interiorItems,
        exteriorItems,
        specialJobs,
        notes,
        totalCost: totalCosts.total // Use centralized total
      };

      autoSave(measurementData);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [rooms, interiorItems, exteriorItems, specialJobs, notes, totalCosts.total, project]);

  // Load project and pricing settings
  useEffect(() => {
    loadProject();
    loadPricingSettings();
  }, [id]);


  const loadProject = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/projects/${id}`);
    const data = response.data.project;
    setProject(data);

    // 🔧 FIX 5: Load saved measurements with proper state synchronization
    if (data.manual_measurements) {
      const measurements = data.manual_measurements;
      
      console.log('📥 Loading saved measurements from database:', measurements);
      
      // Set rooms first
      if (measurements.rooms && Array.isArray(measurements.rooms)) {
        setRooms(measurements.rooms);
        console.log(`🏠 Loaded ${measurements.rooms.length} rooms from database`);
      } else {
        setRooms([]);
      }
      
      // Set interior items
      setInteriorItems(measurements.interiorItems || {
        doors: [], fixedWindows: [], turnWindows: [], stairs: [],
        radiators: [], skirtingBoards: [], otherItems: []
      });
      
      // Set exterior items
      setExteriorItems(measurements.exteriorItems || {
        doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
        fasciaBoards: [], rainPipe: [], otherItems: []
      });
      
      // Set special jobs
      setSpecialJobs(measurements.specialJobs || []);
      
      // Set notes
      setNotes(measurements.notes || '');
      
      console.log('✅ All measurement data loaded successfully');
    } else {
      // Clear all state if no measurements
      setRooms([]);
      setInteriorItems({
        doors: [], fixedWindows: [], turnWindows: [], stairs: [],
        radiators: [], skirtingBoards: [], otherItems: []
      });
      setExteriorItems({
        doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
        fasciaBoards: [], rainPipe: [], otherItems: []
      });
      setSpecialJobs([]);
      setNotes('');
    }
  } catch (err) {
    setError(err.message || 'Failed to load project details');
  } finally {
    setLoading(false);
  }
};

  const loadPricingSettings = async () => {
    try {
      const response = await api.get('/settings/pricing');
      setCustomPricing(response.data.pricing);
      setPricingError(null);
    } catch (error) {
      setPricingError('Failed to load pricing settings. Using default pricing.');
      setCustomPricing(null);
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

      await api.post(`/projects/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      await loadProject();
      showSuccessMessage('Floor plans uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // const performAIAnalysis = async () => {
  //   if (!project?.uploaded_images || project.uploaded_images.length === 0) {
  //     setError('Please upload floor plan images first');
  //     return;
  //   }

  //   const hasExistingData = rooms.length > 0 ||
  //     Object.values(interiorItems).some(items => items.length > 0) ||
  //     Object.values(exteriorItems).some(items => items.length > 0) ||
  //     specialJobs.length > 0;

  //   if (hasExistingData) {
  //     const confirmed = window.confirm(
  //       'You have existing measurements. Running AI analysis will overwrite all current data. Continue?'
  //     );
  //     if (!confirmed) return;
  //   }

  //   setAnalyzing(true);
  //   setError('');

  //   try {
  //     console.log('🚀 Starting AI analysis for project:', id);
  //     const response = await api.post(`/projects/${id}/analyze`);

  //     console.log('📊 AI Analysis Response:', response.data);

  //     setProject(prev => ({
  //       ...prev,
  //       floor_plan_analysis: response.data.analysis,
  //       status: 'ready'
  //     }));

  //     if (response.data.analysis?.structured_measurements) {
  //       const measurements = response.data.analysis.structured_measurements;

  //       if (measurements.rooms && Array.isArray(measurements.rooms)) {
  //         console.log(`🏠 Found ${measurements.rooms.length} rooms in analysis`);

  //         const mappedRooms = measurements.rooms.map(aiRoom => {
  //           console.log('🔄 Processing room:', aiRoom.name);

  //           const mappedRoom = {
  //             id: aiRoom.id || Date.now() + Math.random(),
  //             name: aiRoom.name || `Room ${aiRoom.id}`,
  //             type: aiRoom.type || 'general',
  //             walls: aiRoom.walls?.map((aiWall, index) => ({
  //               id: aiWall.id || (Date.now() + index),
  //               name: aiWall.name || `Wall ${index + 1}`,
  //               length: parseFloat(aiWall.length) || 0,
  //               height: parseFloat(aiWall.height) || 2.4,
  //               area: parseFloat(aiWall.area) || 0,
  //               sanding_filling: false,
  //               priming: false,
  //               one_coat: false,
  //               two_coats: false
  //             })) || [],
  //             ceiling: aiRoom.ceiling ? {
  //               length: parseFloat(aiRoom.ceiling.length) || 0,
  //               width: parseFloat(aiRoom.ceiling.width) || 0,
  //               area: parseFloat(aiRoom.ceiling.area) || 0,
  //               sanding_filling: false,
  //               priming: false,
  //               one_coat: false,
  //               two_coats: false
  //             } : null,
  //             other_surfaces: null
  //           };

  //           return mappedRoom;
  //         });

  //         setRooms(mappedRooms);
  //         setInteriorItems({
  //           doors: [], fixedWindows: [], turnWindows: [], stairs: [],
  //           radiators: [], skirtingBoards: [], otherItems: []
  //         });
  //         setExteriorItems({
  //           doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
  //           fasciaBoards: [], rainPipe: [], otherItems: []
  //         });
  //         setSpecialJobs([]);

  //         if (measurements.notes) {
  //           setNotes(measurements.notes);
  //         }

  //         const measurementData = {
  //           rooms: mappedRooms,
  //           interiorItems: {
  //             doors: [], fixedWindows: [], turnWindows: [], stairs: [],
  //             radiators: [], skirtingBoards: [], otherItems: []
  //           },
  //           exteriorItems: {
  //             doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
  //             fasciaBoards: [], rainPipe: [], otherItems: []
  //           },
  //           specialJobs: [],
  //           notes: measurements.notes || '',
  //           totalCost: 0
  //         };

  //         try {
  //           await api.post(`/projects/${id}/manual-measurements`, measurementData);
  //           console.log('✅ AI analysis results auto-saved');
  //         } catch (saveErr) {
  //           console.error('❌ Failed to save AI analysis results:', saveErr);
  //         }

  //         const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
  //         const totalWallArea = mappedRooms.reduce((sum, room) =>
  //           sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
  //         );
  //         const totalCeilingArea = mappedRooms.reduce((sum, room) =>
  //           sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
  //         );

  //         showSuccessMessage(
  //           `🔄 AI analysis completed and saved! Detected ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
  //           `Wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
  //         );
  //       } else {
  //         showSuccessMessage('AI analysis completed but no rooms were detected.');
  //       }
  //     } else {
  //       showSuccessMessage('AI analysis completed but no structured measurements returned.');
  //     }

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
  //     console.error('❌ AI Analysis Error:', err);
  //     setError(`AI analysis failed: ${errorMessage}`);
  //   } finally {
  //     setAnalyzing(false);
  //   }
  // };


  const performAIAnalysis = async () => {
  if (!project?.uploaded_images || project.uploaded_images.length === 0) {
    setError('Please upload floor plan images first');
    return;
  }

  const hasExistingData = rooms.length > 0 ||
    Object.values(interiorItems).some(items => items.length > 0) ||
    Object.values(exteriorItems).some(items => items.length > 0) ||
    specialJobs.length > 0;

  if (hasExistingData) {
    const confirmed = window.confirm(
      'You have existing measurements. Running AI analysis will overwrite all current data. Continue?'
    );
    if (!confirmed) return;
  }

  setAnalyzing(true);
  setError('');

  try {
    console.log('🚀 Starting AI analysis for project:', id);
    const response = await api.post(`/projects/${id}/analyze`);

    console.log('📊 AI Analysis Response:', response.data);

    // 🔧 FIX 1: Update project state immediately
    setProject(prev => ({
      ...prev,
      floor_plan_analysis: response.data.analysis,
      status: 'ready'
    }));

    // 🔧 FIX 2: Load fresh measurements from the analysis response
    if (response.data.analysis?.structured_measurements) {
      const measurements = response.data.analysis.structured_measurements;

      if (measurements.rooms && Array.isArray(measurements.rooms)) {
        console.log(`🏠 Found ${measurements.rooms.length} rooms in analysis`);

        const mappedRooms = measurements.rooms.map(aiRoom => {
          console.log('🔄 Processing room:', aiRoom.name);

          const mappedRoom = {
            id: aiRoom.id || Date.now() + Math.random(),
            name: aiRoom.name || `Room ${aiRoom.id}`,
            type: aiRoom.type || 'general',
            walls: aiRoom.walls?.map((aiWall, index) => ({
              id: aiWall.id || (Date.now() + index),
              name: aiWall.name || `Wall ${index + 1}`,
              length: parseFloat(aiWall.length) || 0,
              height: parseFloat(aiWall.height) || 2.4,
              area: parseFloat(aiWall.area) || 0,
              sanding_filling: false,
              priming: false,
              one_coat: false,
              two_coats: false
            })) || [],
            ceiling: aiRoom.ceiling ? {
              length: parseFloat(aiRoom.ceiling.length) || 0,
              width: parseFloat(aiRoom.ceiling.width) || 0,
              area: parseFloat(aiRoom.ceiling.area) || 0,
              sanding_filling: false,
              priming: false,
              one_coat: false,
              two_coats: false
            } : null,
            other_surfaces: null
          };

          return mappedRoom;
        });

        // 🔧 FIX 3: Update state immediately and trigger re-calculation
        setRooms(mappedRooms);
        setInteriorItems({
          doors: [], fixedWindows: [], turnWindows: [], stairs: [],
          radiators: [], skirtingBoards: [], otherItems: []
        });
        setExteriorItems({
          doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
          fasciaBoards: [], rainPipe: [], otherItems: []
        });
        setSpecialJobs([]);

        if (measurements.notes) {
          setNotes(measurements.notes);
        }

        // 🔧 FIX 4: Force immediate reload of project data to sync database
        setTimeout(async () => {
          try {
            await loadProject();
            console.log('✅ Project data reloaded after AI analysis');
          } catch (err) {
            console.error('❌ Failed to reload project data:', err);
          }
        }, 1000);

        const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
        const totalWallArea = mappedRooms.reduce((sum, room) =>
          sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
        );
        const totalCeilingArea = mappedRooms.reduce((sum, room) =>
          sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
        );

        showSuccessMessage(
          `🔄 AI analysis completed and data loaded! Detected ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
          `Wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
        );
      } else {
        showSuccessMessage('AI analysis completed but no rooms were detected.');
      }
    } else {
      showSuccessMessage('AI analysis completed but no structured measurements returned.');
    }

  } catch (err) {
    const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
    console.error('❌ AI Analysis Error:', err);
    setError(`AI analysis failed: ${errorMessage}`);
  } finally {
    setAnalyzing(false);
  }
};

  const saveMeasurements = async () => {
    setSaving(true);
    setError('');

    try {
      const measurementData = {
        rooms,
        interiorItems,
        exteriorItems,
        specialJobs,
        notes,
        totalCost: totalCosts.total // Use centralized total
      };

      await api.post(`/projects/${id}/manual-measurements`, measurementData);

      if (project.status === 'draft') {
        setProject(prev => ({ ...prev, status: 'ready' }));
      }

      showSuccessMessage('Measurements saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  // const generateQuoteAndEmail = async () => {
  //   if (!project) {
  //     setError('Please save the project first');
  //     return;
  //   }

  //   if (!project.client_email) {
  //     setError('Client email is required to send the quote');
  //     return;
  //   }

  //   setGenerating(true);
  //   setError('');

  //   try {
  //     await saveMeasurements();

  //     const hasRoomMeasurements = rooms.length > 0;
  //     const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
  //     const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);
  //     const hasSpecialJobs = specialJobs.length > 0;

  //     if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems && !hasSpecialJobs) {
  //       setError('Please add some measurements before generating a quote');
  //       return;
  //     }

  //     const response = await api.post(`/projects/${id}/quote`, {
  //       rooms,
  //       interiorItems,
  //       exteriorItems,
  //       specialJobs,
  //       notes,
  //       totalCost: totalCosts.total, // Use centralized total
  //       customPricing
  //     });

  //     await api.post(`/projects/${id}/email-quote`, {
  //       client_email: project.client_email,
  //       client_name: project.client_name,
  //       project_name: project.name,
  //       total_cost: totalCosts.total, // Use centralized total
  //       quote_id: response.data.quote_id
  //     });

  //     navigate(`/projects/${id}/quote`, {
  //       state: {
  //         rooms,
  //         interiorItems,
  //         exteriorItems,
  //         specialJobs,
  //         notes,
  //         totalCost: totalCosts.total, // Use centralized total
  //         customPricing
  //       }
  //     });

  //     showSuccessMessage('Quote generated and emailed successfully!');
  //   } catch (err) {
  //     setError(err.response?.data?.error || err.message || 'Failed to generate quote or send email');
  //   } finally {
  //     setGenerating(false);
  //   }
  // };

  const generateQuoteAndEmail = async () => {
  if (!project) {
    setError('Please save the project first');
    return;
  }

  if (!project.client_email) {
    setError('Client email is required to send the quote');
    return;
  }

  setGenerating(true);
  setError('');

  try {
    // Save measurements first
    await saveMeasurements();

    const hasRoomMeasurements = rooms.length > 0;
    const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
    const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);
    const hasSpecialJobs = specialJobs.length > 0;

    if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems && !hasSpecialJobs) {
      setError('Please add some measurements before generating a quote');
      return;
    }

    // Prepare quote data with pricing
    const quoteData = {
      title: `Paint Quote - ${project.name}`,
      description: `Comprehensive painting quote for ${project.name} including detailed room-by-room breakdown`,
      valid_days: 30,
      
      // Wall pricing
      wall_sanding_price: pricing?.walls?.sanding?.light?.price || 5.00,
      wall_priming_price: pricing?.walls?.priming?.one_coat?.price || 4.50,
      wall_one_coat_price: pricing?.walls?.painting?.one_coat?.price || 6.00,
      wall_two_coats_price: pricing?.walls?.painting?.two_coat?.price || 9.50,
      
      // Ceiling pricing
      ceiling_prep_price: pricing?.ceiling?.preparation?.light?.price || 4.00,
      ceiling_priming_price: pricing?.ceiling?.preparation?.light?.price || 4.00,
      ceiling_one_coat_price: pricing?.ceiling?.painting?.one_coat?.price || 5.50,
      ceiling_two_coats_price: pricing?.ceiling?.painting?.two_coat?.price || 8.50,
      
      // Interior pricing
      interior_door_price: pricing?.interior?.doors?.easy_prep?.price || 85.00,
      interior_fixed_window_price: pricing?.interior?.fixedWindows?.small?.price || 45.00,
      interior_turn_window_price: pricing?.interior?.turnWindows?.small?.price || 55.00,
      interior_stairs_price: pricing?.interior?.stairs?.price || 25.00,
      interior_radiator_price: pricing?.interior?.radiators?.price || 35.00,
      interior_skirting_price: pricing?.interior?.skirtingBoards?.price || 12.00,
      interior_other_price: pricing?.interior?.otherItems?.price || 10.00,
      
      // Exterior pricing
      exterior_door_price: pricing?.exterior?.doors?.front_door?.price || 120.00,
      exterior_fixed_window_price: pricing?.exterior?.fixedWindows?.small?.price || 65.00,
      exterior_turn_window_price: pricing?.exterior?.turnWindows?.small?.price || 75.00,
      exterior_dormer_window_price: pricing?.exterior?.dormerWindows?.small?.price || 120.00,
      exterior_fascia_price: pricing?.exterior?.fasciaBoards?.price || 18.00,
      exterior_rain_pipe_price: pricing?.exterior?.rainPipe?.price || 15.00,
      exterior_other_price: pricing?.exterior?.otherItems?.price || 15.00,
      
      // Additional fees
      cleanup_fee: 150.00
    };

    console.log('🔄 Generating comprehensive quote with data:', quoteData);

    // Generate quote
    const response = await api.post(`/projects/${id}/quote`, quoteData);

    console.log('✅ Quote generated:', response.data);

    // Send email
    await api.post(`/projects/${id}/email-quote`, {
      client_email: project.client_email,
      client_name: project.client_name,
      project_name: project.name,
      total_cost: totalCosts.total,
      quote_id: response.data.quote_id
    });

    // Redirect to quote preview
    navigate(`/quotes/${response.data.quote_id}`, {
      replace: true
    });

    showSuccessMessage('Quote generated and emailed successfully!');

  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Failed to generate quote or send email';
    console.error('❌ Quote Generation Error:', err);
    setError(`Quote generation failed: ${errorMessage}`);
  } finally {
    setGenerating(false);
  }
};

  const handleResetCalculator = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all measurements? This will permanently delete all room data, interior/exterior items, and special jobs.'
    );
    
    if (!confirmed) return;

    try {
      setRooms([]);
      setInteriorItems({
        doors: [], fixedWindows: [], turnWindows: [], stairs: [],
        radiators: [], skirtingBoards: [], otherItems: []
      });
      setExteriorItems({
        doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
        fasciaBoards: [], rainPipe: [], otherItems: []
      });
      setSpecialJobs([]);
      setNotes('');

      const emptyData = {
        rooms: [],
        interiorItems: {
          doors: [], fixedWindows: [], turnWindows: [], stairs: [],
          radiators: [], skirtingBoards: [], otherItems: []
        },
        exteriorItems: {
          doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
          fasciaBoards: [], rainPipe: [], otherItems: []
        },
        specialJobs: [],
        notes: '',
        totalCost: 0
      };

      await api.post(`/projects/${id}/manual-measurements`, emptyData);
      showSuccessMessage('Calculator reset successfully!');
    } catch (err) {
      setError('Failed to reset calculator');
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <Loading message="Loading project details..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="bg-gradient-to-r from-teal-600 to-slate-600 text-white py-6 sticky top-0 z-10">
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
                <h1 className="text-2xl font-bold">{project?.name}</h1>
                {project && (
                  <p className="text-sm text-gray-200 mt-1">
                    Project: {project.name} • Status: {project.status} • Real-time calculation enabled
                  </p>
                )}
              </div>
            </div>

            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => scrollToSection('project-section')}
                className="text-sm text-gray-200 hover:text-white"
              >
                Project Info
              </button>
              <button
                onClick={() => scrollToSection('floor-plan-section')}
                className="text-sm text-gray-200 hover:text-white"
                disabled={!project}
              >
                Floor Plans
              </button>
              <button
                onClick={() => scrollToSection('measurements-section')}
                className="text-sm text-gray-200 hover:text-white"
                disabled={!project}
              >
                Measurements
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {pricingError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-600">{pricingError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <section id="project-section" className="scroll-mt-24">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-teal-800" />
                  Project Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">{project?.name || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="text-sm text-gray-900">{project?.description || 'No description provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                        <dd className="text-sm text-gray-900 capitalize">{project?.project_type || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                        <dd className="text-sm text-gray-900 capitalize">{project?.property_type || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Property Address</dt>
                        <dd className="text-sm text-gray-900">{project?.property_address || 'Not provided'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="text-sm text-gray-900">
                          {project?.created_at ? new Date(project.created_at).toLocaleDateString('en-GB', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="text-sm text-gray-900">
                          {project?.updated_at ? new Date(project.updated_at).toLocaleDateString('en-GB', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Not provided'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            <section id="client-section" className="scroll-mt-24">
              <ErrorBoundary>
                <ClientInformation
                  project={project}
                  onClientUpdate={handleClientUpdate}
                />
              </ErrorBoundary>
            </section>

            <section id="floor-plan-section" className="scroll-mt-24">
              <ErrorBoundary>
                <FloorPlanUpload
                  projectId={id}
                  uploadedImages={project?.uploaded_images || []}
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
                {project?.uploaded_images && project.uploaded_images.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                      <button
                        onClick={performAIAnalysis}
                        disabled={analyzing || !project?.uploaded_images?.length}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      >
                        {analyzing ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start AI Analysis
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Run AI analysis to automatically detect rooms, walls, and ceilings from your floor plans. Results will be saved automatically.
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </section>

            <section id="measurements-section" className="scroll-mt-24">
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Calculator className="h-6 w-6 mr-3 text-teal-800" />
                    Measurements & Work Items
                    <div className="ml-4 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      Real-time calculation enabled
                    </div>
                  </h2>
                  <div className="text-sm text-gray-600 mb-4">
                    All changes update the total price instantly. Auto-saving is also enabled.
                  </div>
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={saveMeasurements}
                      disabled={saving}
                      className="inline-flex items-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Force Save Now
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {project && (
                  <>
                    <ErrorBoundary>
                      <RoomMeasurements
                        rooms={rooms}
                        setRooms={setRooms}
                        customPricing={customPricing}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <InteriorWork
                        interiorItems={interiorItems}
                        setInteriorItems={setInteriorItems}
                        customPricing={customPricing?.interior}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <ExteriorWork
                        exteriorItems={exteriorItems}
                        setExteriorItems={setExteriorItems}
                        customPricing={customPricing?.exterior}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <SpecialJobsSection
                        specialJobs={specialJobs}
                        setSpecialJobs={setSpecialJobs}
                        customPricing={customPricing?.specialJobs}
                      />
                    </ErrorBoundary>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Project Notes</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter project notes, special requirements, or additional details..."
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        Notes are automatically saved as you type
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-4">Progress</h4>
                <div className="space-y-3">
                  <div className={`flex items-center p-2 rounded-md ${project ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <CheckCircle className={`h-4 w-4 mr-3 ${project ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${project ? 'text-green-600' : 'text-gray-500'}`}>
                      Project Created
                    </span>
                  </div>

                  <div className={`flex items-center p-2 rounded-md ${project?.client_email || project?.client_name ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <Users className={`h-4 w-4 mr-3 ${project?.client_email || project?.client_name ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${project?.client_email || project?.client_name ? 'text-green-600' : 'text-gray-500'}`}>
                      Client Information
                    </span>
                  </div>

                  <div className={`flex items-center p-2 rounded-md ${project?.uploaded_images?.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <Upload className={`h-4 w-4 mr-3 ${project?.uploaded_images?.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${project?.uploaded_images?.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      Floor Plans ({project?.uploaded_images?.length || 0})
                    </span>
                  </div>

                  <div className={`flex items-center p-2 rounded-md ${rooms.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <Calculator className={`h-4 w-4 mr-3 ${rooms.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${rooms.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      Measurements ({rooms.length} rooms)
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-green-600 bg-green-50 px-2 py-1 rounded text-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Real-time calculation active
                </div>

                <div className="mt-6 space-y-2">
                  {getAvailableSteps().map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => step.available && setCurrentStep(step.id)}
                      disabled={!step.available}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        currentStep === step.id
                          ? 'bg-purple-100 text-purple-800 font-medium'
                          : step.available
                            ? 'hover:bg-gray-100 text-gray-700'
                            : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {index + 1}. {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPDATED TOTAL CARD WITH REAL-TIME BREAKDOWN */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-2">Project Cost Breakdown</h4>
                
                {/* Real-time cost breakdown */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Rooms ({rooms.length})</span>
                    <span className="font-medium text-blue-600">£{totalCosts.rooms.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interior ({Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0)})</span>
                    <span className="font-medium text-purple-600">£{totalCosts.interior.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exterior ({Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0)})</span>
                    <span className="font-medium text-green-600">£{totalCosts.exterior.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Jobs ({specialJobs.length})</span>
                    <span className="font-medium text-orange-600">£{totalCosts.specialJobs.toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                </div>

                {/* Total amount with live updates */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-3xl font-bold text-teal-600">£{totalCosts.total.toFixed(2)}</span>
                </div>

                {/* Live update indicator */}
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded text-center mb-4">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Live total calculation
                </div>

                <button
                  onClick={generateQuoteAndEmail}
                  disabled={generating || !project || totalCosts.total === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Generate Quote & Email
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={handleResetCalculator}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset All Data
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  This will permanently delete all measurements
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={() => navigate('/settings/pricing')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Pricing Settings
                </button>
              </div>

              {project && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Project Info</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div>Name: {project.name}</div>
                    <div>Type: {project.project_type}</div>
                    <div>Property: {project.property_type}</div>
                    <div>Status: {project.status}</div>
                    <div>Client: {project.client_name || 'Not set'}</div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Real-time Features</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p>• Total updates instantly as you type</p>
                  <p>• Cost breakdown shows live calculations</p>
                  <p>• Auto-save preserves all changes</p>
                  <p>• Wall and ceiling pricing included</p>
                  <p>• Database sync in real-time</p>
                  <p>• Complete project backup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;