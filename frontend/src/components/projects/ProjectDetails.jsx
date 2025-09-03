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


      const parsePrice = (value, fallback = 0) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) || parsed === null || parsed === undefined ? fallback : parsed;
      };

      const parsePricingValue = (path, fallback = 0) => {
        try {
          const keys = path.split('.');
          let value = pricing;
          for (let key of keys) {
            if (value && typeof value === 'object') {
              value = value[key];
            } else {
              return fallback;
            }
          }
          return parsePrice(value, fallback);
        } catch (error) {
          console.warn(`Failed to parse pricing path: ${path}`, error);
          return fallback;
        }
      };

      // 🔧 FIXED: CALCULATE ROOMS COST (Total Wall Area Approach)
      rooms.forEach(room => {
        console.log(`🏠 Calculating costs for room: ${room.name}`);

        const wallArea = parseFloat(room.walls_surface_m2) || 0;
        const ceilingArea = parseFloat(room.area_m2) || 0;

        console.log(`📐 Wall area: ${wallArea}m², Ceiling area: ${ceilingArea}m²`);

        // Calculate wall treatments costs
        if (room.wall_treatments && wallArea > 0) {
          // Wall Sanding/Filling
          if (room.wall_treatments.sanding_filling) {
            const price = parsePricingValue('walls.sanding_filling') ||
              parsePricingValue('walls.sanding.light.price', 5.00);
            const cost = wallArea * price;
            roomsTotal += cost;
            console.log(`🔨 Wall sanding/filling: ${wallArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Wall Priming
          if (room.wall_treatments.priming) {
            const price = parsePricingValue('walls.priming') ||
              parsePricingValue('walls.priming.one_coat.price') ||
              parsePricingValue('walls.priming.price', 4.50);
            const cost = wallArea * price;
            roomsTotal += cost;
            console.log(`🎨 Wall priming: ${wallArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Wall 1 Coat
          if (room.wall_treatments.one_coat) {
            const price = pricing.walls?.one_coat || pricing.walls?.painting?.one_coat?.price || 0;
            const cost = wallArea * price;
            roomsTotal += cost;
            console.log(`🖌️ Wall 1 coat: ${wallArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Wall 2 Coats
          if (room.wall_treatments.two_coats) {
            const price = pricing.walls?.two_coats || pricing.walls?.painting?.two_coat?.price || 0;
            const cost = wallArea * price;
            roomsTotal += cost;
            console.log(`🖌️🖌️ Wall 2 coats: ${wallArea}m² × £${price} = £${cost.toFixed(2)}`);
          }
        }

        // Calculate ceiling treatments costs
        if (room.ceiling_treatments && ceilingArea > 0) {
          // Ceiling Sanding/Filling
          if (room.ceiling_treatments.sanding_filling) {
            const price = pricing.ceiling?.sanding_filling || pricing.ceiling?.preparation?.light?.price || 0;
            const cost = ceilingArea * price;
            roomsTotal += cost;
            console.log(`🔨 Ceiling sanding/filling: ${ceilingArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Ceiling Priming
          if (room.ceiling_treatments.priming) {
            const price = pricing.ceiling?.priming || pricing.ceiling?.preparation?.light?.price || 0;
            const cost = ceilingArea * price;
            roomsTotal += cost;
            console.log(`🎨 Ceiling priming: ${ceilingArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Ceiling 1 Coat
          if (room.ceiling_treatments.one_coat) {
            const price = pricing.ceiling?.one_coat || pricing.ceiling?.painting?.one_coat?.price || 0;
            const cost = ceilingArea * price;
            roomsTotal += cost;
            console.log(`🖌️ Ceiling 1 coat: ${ceilingArea}m² × £${price} = £${cost.toFixed(2)}`);
          }

          // Ceiling 2 Coats
          if (room.ceiling_treatments.two_coats) {
            const price = pricing.ceiling?.two_coats || pricing.ceiling?.painting?.two_coat?.price || 0;
            const cost = ceilingArea * price;
            roomsTotal += cost;
            console.log(`🖌️🖌️ Ceiling 2 coats: ${ceilingArea}m² × £${price} = £${cost.toFixed(2)}`);
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
  //     // Save measurements first
  //     await saveMeasurements();

  //     const hasRoomMeasurements = rooms.length > 0;
  //     const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
  //     const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);
  //     const hasSpecialJobs = specialJobs.length > 0;

  //     if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems && !hasSpecialJobs) {
  //       setError('Please add some measurements before generating a quote');
  //       return;
  //     }

  //     console.log('🔄 Generating quote with actual project data (Total Wall Area approach)...');

  //     // 🔥 FIXED: Quote data for the new Total Wall Area approach
  //     const quoteData = {
  //       title: `Comprehensive Paint Quote - ${project.name}`,
  //       description: `Detailed painting quote for ${project.name} including room-by-room breakdown with total wall area measurements and treatment selections`,
  //       valid_days: 30,

  //       // 🔥 CRITICAL FIX: Updated for Total Wall Area approach
  //       measurement_details: {
  //         // 🏠 Process rooms with Total Wall Area approach
  //         rooms: rooms.map(room => {
  //           console.log(`Processing room: ${room.name}`, room);

  //           const wallArea = parseFloat(room.walls_surface_m2) || 0;
  //           const ceilingArea = parseFloat(room.area_m2) || 0;

  //           return {
  //             id: room.id,
  //             name: room.name,
  //             type: room.type || 'general',

  //             // 🔥 NEW: Total area approach (replaces individual walls)
  //             total_wall_area: wallArea,
  //             total_ceiling_area: ceilingArea,

  //             // 🔥 Process wall treatments with actual selected treatments
  //             wall_treatments: {
  //               sanding_filling: Boolean(room.wall_treatments?.sanding_filling),
  //               priming: Boolean(room.wall_treatments?.priming),
  //               one_coat: Boolean(room.wall_treatments?.one_coat),
  //               two_coats: Boolean(room.wall_treatments?.two_coats)
  //             },

  //             // 🔥 Calculate wall costs for selected treatments only
  //             wall_costs: {
  //               sanding_filling: room.wall_treatments?.sanding_filling ?
  //                 wallArea * (pricing?.walls?.sanding_filling || pricing?.walls?.sanding?.light?.price || 0) : 0,
  //               priming: room.wall_treatments?.priming ?
  //                 wallArea * (pricing?.walls?.priming || pricing?.walls?.priming?.one_coat?.price || 0) : 0,
  //               one_coat: room.wall_treatments?.one_coat ?
  //                 wallArea * (pricing?.walls?.one_coat || pricing?.walls?.painting?.one_coat?.price || 0) : 0,
  //               two_coats: room.wall_treatments?.two_coats ?
  //                 wallArea * (pricing?.walls?.two_coats || pricing?.walls?.painting?.two_coat?.price || 0) : 0
  //             },

  //             // 🔥 Process ceiling treatments with actual selected treatments
  //             ceiling_treatments: {
  //               sanding_filling: Boolean(room.ceiling_treatments?.sanding_filling),
  //               priming: Boolean(room.ceiling_treatments?.priming),
  //               one_coat: Boolean(room.ceiling_treatments?.one_coat),
  //               two_coats: Boolean(room.ceiling_treatments?.two_coats)
  //             },

  //             // 🔥 Calculate ceiling costs for selected treatments only
  //             ceiling_costs: {
  //               sanding_filling: room.ceiling_treatments?.sanding_filling ?
  //                 ceilingArea * (pricing?.ceiling?.sanding_filling || pricing?.ceiling?.preparation?.light?.price || 0) : 0,
  //               priming: room.ceiling_treatments?.priming ?
  //                 ceilingArea * (pricing?.ceiling?.priming || pricing?.ceiling?.preparation?.light?.price || 0) : 0,
  //               one_coat: room.ceiling_treatments?.one_coat ?
  //                 ceilingArea * (pricing?.ceiling?.one_coat || pricing?.ceiling?.painting?.one_coat?.price || 0) : 0,
  //               two_coats: room.ceiling_treatments?.two_coats ?
  //                 ceilingArea * (pricing?.ceiling?.two_coats || pricing?.ceiling?.painting?.two_coat?.price || 0) : 0
  //             },

  //             // 🔥 Room totals
  //             totals: {
  //               total_wall_area: wallArea,
  //               total_ceiling_area: ceilingArea,
  //               wall_total: Object.values({
  //                 sanding_filling: room.wall_treatments?.sanding_filling ?
  //                   wallArea * (pricing?.walls?.sanding_filling || pricing?.walls?.sanding?.light?.price || 0) : 0,
  //                 priming: room.wall_treatments?.priming ?
  //                   wallArea * (pricing?.walls?.priming || pricing?.walls?.priming?.one_coat?.price || 0) : 0,
  //                 one_coat: room.wall_treatments?.one_coat ?
  //                   wallArea * (pricing?.walls?.one_coat || pricing?.walls?.painting?.one_coat?.price || 0) : 0,
  //                 two_coats: room.wall_treatments?.two_coats ?
  //                   wallArea * (pricing?.walls?.two_coats || pricing?.walls?.painting?.two_coat?.price || 0) : 0
  //               }).reduce((sum, cost) => sum + cost, 0),
  //               ceiling_total: Object.values({
  //                 sanding_filling: room.ceiling_treatments?.sanding_filling ?
  //                   ceilingArea * (pricing?.ceiling?.sanding_filling || pricing?.ceiling?.preparation?.light?.price || 0) : 0,
  //                 priming: room.ceiling_treatments?.priming ?
  //                   ceilingArea * (pricing?.ceiling?.priming || pricing?.ceiling?.preparation?.light?.price || 0) : 0,
  //                 one_coat: room.ceiling_treatments?.one_coat ?
  //                   ceilingArea * (pricing?.ceiling?.one_coat || pricing?.ceiling?.painting?.one_coat?.price || 0) : 0,
  //                 two_coats: room.ceiling_treatments?.two_coats ?
  //                   ceilingArea * (pricing?.ceiling?.two_coats || pricing?.ceiling?.painting?.two_coat?.price || 0) : 0
  //               }).reduce((sum, cost) => sum + cost, 0)
  //             }
  //           };
  //         }),

  //         // 🔥 FIXED: Process interior items with complete details from your project
  //         interior_items: Object.entries(interiorItems).reduce((acc, [type, items]) => {
  //           if (items.length > 0) {
  //             acc[type] = items.map(item => {
  //               console.log(`Processing interior ${type}:`, item);

  //               return {
  //                 id: item.id,
  //                 type: type,
  //                 description: item.description || '',
  //                 quantity: parseFloat(item.quantity) || 1,

  //                 // Include actual item specifications from your project
  //                 ...(type === 'doors' && {
  //                   door_type: item.doorType || 'inside',
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 ...(type.includes('Windows') && {
  //                   size: item.size || 'medium',
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 ...(['stairs', 'radiators', 'skirtingBoards', 'otherItems'].includes(type) && {
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 // Calculate actual pricing
  //                 unit_price: getInteriorPrice(type, item),
  //                 total_cost: (parseFloat(item.quantity) || 1) * getInteriorPrice(type, item),

  //                 // Include all item details from your project
  //                 notes: item.notes || '',
  //                 location: item.location || '',
  //                 material: item.material || '',
  //                 finish: item.finish || ''
  //               };
  //             });
  //           }
  //           return acc;
  //         }, {}),

  //         // 🔥 FIXED: Process exterior items with complete details from your project
  //         exterior_items: Object.entries(exteriorItems).reduce((acc, [type, items]) => {
  //           if (items.length > 0) {
  //             acc[type] = items.map(item => {
  //               console.log(`Processing exterior ${type}:`, item);

  //               return {
  //                 id: item.id,
  //                 type: type,
  //                 description: item.description || '',
  //                 quantity: parseFloat(item.quantity) || 1,

  //                 // Include actual item specifications from your project
  //                 ...(type === 'doors' && {
  //                   door_type: item.doorType || 'front',
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 ...(type.includes('Windows') && {
  //                   size: item.size || 'medium',
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 ...(['fasciaBoards', 'rainPipe', 'otherItems'].includes(type) && {
  //                   condition: item.condition || 'level_1',
  //                   condition_name: getConditionName(item.condition || 'level_1')
  //                 }),

  //                 // Calculate actual pricing
  //                 unit_price: getExteriorPrice(type, item),
  //                 total_cost: (parseFloat(item.quantity) || 1) * getExteriorPrice(type, item),

  //                 // Include all item details from your project
  //                 notes: item.notes || '',
  //                 location: item.location || '',
  //                 material: item.material || '',
  //                 finish: item.finish || '',
  //                 weatherproof: item.weatherproof || false
  //               };
  //             });
  //           }
  //           return acc;
  //         }, {}),

  //         // 🔥 FIXED: Process special jobs with actual steps and details from your project
  //         special_jobs: specialJobs.map(job => {
  //           console.log('Processing special job:', job);

  //           return {
  //             id: job.id,
  //             type: job.type || 'custom',
  //             name: job.name || 'Custom Work',
  //             description: job.description || '',
  //             category: job.category || 'General',

  //             // Quantity and pricing
  //             quantity: parseFloat(job.quantity) || 1,
  //             unit: job.unit || 'job',
  //             unit_price: parseFloat(job.unitPrice) || 0,
  //             total_cost: (parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0),

  //             // Include all job details from your project
  //             location: job.location || '',
  //             materials_included: job.materialsIncluded !== false,
  //             estimated_hours: parseFloat(job.estimatedHours) || 0,
  //             difficulty: job.difficulty || 'Standard',
  //             notes: job.notes || '',

  //             // 🔥 CRITICAL FIX: Include the actual process steps for special jobs
  //             steps: job.steps || []
  //           };
  //         }),

  //         // 🔥 Project summary with updated data for Total Wall Area approach
  //         summary: {
  //           total_rooms: rooms.length,
  //           // 🔥 Updated: Calculate total wall area from walls_surface_m2
  //           total_wall_area: rooms.reduce((sum, room) => sum + (parseFloat(room.walls_surface_m2) || 0), 0),
  //           // 🔥 Updated: Calculate total ceiling area from area_m2
  //           total_ceiling_area: rooms.reduce((sum, room) => sum + (parseFloat(room.area_m2) || 0), 0),
  //           total_interior_items: Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0),
  //           total_exterior_items: Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0),
  //           total_special_jobs: specialJobs.length,
  //           project_notes: notes || ''
  //         }
  //       },

  //       // 🔥 FIXED: Use actual pricing from your pricing system with fallbacks
  //       wall_sanding_price: pricing?.walls?.sanding_filling || pricing?.walls?.sanding?.light?.price || 5.00,
  //       wall_priming_price: pricing?.walls?.priming || pricing?.walls?.priming?.one_coat?.price || 4.50,
  //       wall_one_coat_price: pricing?.walls?.one_coat || pricing?.walls?.painting?.one_coat?.price || 6.00,
  //       wall_two_coats_price: pricing?.walls?.two_coats || pricing?.walls?.painting?.two_coat?.price || 9.50,

  //       ceiling_prep_price: pricing?.ceiling?.sanding_filling || pricing?.ceiling?.preparation?.light?.price || 4.00,
  //       ceiling_priming_price: pricing?.ceiling?.priming || pricing?.ceiling?.preparation?.light?.price || 4.00,
  //       ceiling_one_coat_price: pricing?.ceiling?.one_coat || pricing?.ceiling?.painting?.one_coat?.price || 5.50,
  //       ceiling_two_coats_price: pricing?.ceiling?.two_coats || pricing?.ceiling?.painting?.two_coat?.price || 8.50,

  //       cleanup_fee: 150.00
  //     };

  //     console.log('🔄 Sending quote data to backend (Total Wall Area approach):', quoteData);

  //     // Generate quote with comprehensive data
  //     const response = await api.post(`/projects/${id}/quote`, quoteData);

  //     console.log('✅ Comprehensive quote generated:', response.data);

  //     // Send email
  //     await api.post(`/projects/${id}/email-quote`, {
  //       client_email: project.client_email,
  //       client_name: project.client_name,
  //       project_name: project.name,
  //       total_cost: totalCosts.total,
  //       quote_id: response.data.quote_id
  //     });


  //     // Redirect to quote preview
  //     navigate(`/quotes/${response.data.quote_id}`, {
  //       replace: true
  //     });

  //     showSuccessMessage('Comprehensive quote with Total Wall Area approach generated and emailed successfully!');

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.error || err.message || 'Failed to generate quote or send email';
  //     console.error('❌ Comprehensive Quote Generation Error:', err);
  //     setError(`Quote generation failed: ${errorMessage}`);
  //   } finally {
  //     setGenerating(false);
  //   }
  // };

  // Helper functions for quote generation

  const woodworkConditions = {
    level_1: {
      name: 'New/Pre-primed',
      steps: [
        'Clean surface (dust and degrease with sugar soap)',
        'Light sanding to key the surface',
        'Prime if bare wood (skip if factory-primed and in good condition)',
        'Apply topcoat'
      ]
    },
    level_2: {
      name: 'Good Condition',
      steps: [
        'Clean with sugar soap',
        'Light sand to dull surface',
        'Fill small dents or imperfections (if needed)',
        'Spot prime glossy or bare areas',
        'Apply topcoat'
      ]
    },
    level_3: {
      name: 'Moderate Wear',
      steps: [
        'Scrape away all loose/flaking paint',
        'Sand surface to smooth out rough areas',
        'Fill cracks or gouges with appropriate filler',
        'Spot prime exposed wood',
        'Final sand before painting',
        'Apply topcoat'
      ]
    },
    level_4: {
      name: 'Heavy Damage',
      steps: [
        'Cut out or remove rotten areas (if applicable)',
        'Apply wood hardener to soft sections',
        'Fill deep damage with 2-part wood filler',
        'Sand thoroughly to level surface',
        'Apply full primer coat to all areas',
        'Apply topcoat'
      ]
    }
  };

  const specialJobTypes = {
    water_damage: {
      name: 'Water Damage/Leak Repair',
      steps: [
        'Identify and dry affected area completely (use moisture meter if needed)',
        'Scrape off bubbling/loose paint',
        'Treat any mold/mildew with anti-fungal wash',
        'Fill any damaged plaster',
        'Sand smooth and apply stain-block primer'
      ]
    },
    fire_smoke_damage: {
      name: 'Fire/Smoke Damage',
      steps: [
        'Wash all surfaces with degreaser/sugar soap',
        'Remove soot and smoke residue',
        'Sand walls if surface is uneven',
        'Apply stain- and odour-blocking primer',
        'Repaint with high-opacity paint'
      ]
    },
    mold_remediation: {
      name: 'Mold Remediation',
      steps: [
        'Kill mold using specialist anti-mold treatment',
        'Scrape and remove affected surface area',
        'Fill any surface damage',
        'Sand and apply mold-resistant primer',
        'Use anti-mold paint where necessary'
      ]
    },
    nicotine_stained_walls: {
      name: 'Nicotine Stained Walls',
      steps: [
        'Degrease walls using sugar soap',
        'Rinse thoroughly and allow to dry',
        'Apply a stain-blocking primer',
        'Use at least two coats of emulsion for coverage'
      ]
    },
    uneven_wall_surfaces: {
      name: 'Uneven Wall Surfaces',
      steps: [
        'Assess whether skimming is needed or just filler',
        'Fill deep imperfections',
        'Sand smooth',
        '(Optional) Apply bonding agent',
        'If badly uneven, apply full skim coat and allow to dry before painting'
      ]
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
  //     // Save measurements first
  //     await saveMeasurements();

  //     const hasRoomMeasurements = rooms.length > 0;
  //     const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
  //     const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);
  //     const hasSpecialJobs = specialJobs.length > 0;

  //     if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems && !hasSpecialJobs) {
  //       setError('Please add some measurements before generating a quote');
  //       return;
  //     }

  //     console.log('🔄 Generating quote with complete interior/exterior details and preparation steps...');

  //     // 🔥 FIXED: Quote data with complete preparation steps
  //     const quoteData = {
  //       title: `Comprehensive Paint Quote - ${project.name}`,
  //       description: `Detailed painting quote for ${project.name} including room-by-room breakdown with complete preparation steps`,
  //       valid_days: 30,

  //       // Room measurements (same as before)
  //       measurement_details: {
  //         rooms: rooms.map(room => {
  //           const wallArea = parseFloat(room.walls_surface_m2) || 0;
  //           const ceilingArea = parseFloat(room.area_m2) || 0;

  //           return {
  //             id: room.id,
  //             name: room.name,
  //             type: room.type || 'general',
  //             total_wall_area: wallArea,
  //             total_ceiling_area: ceilingArea,
  //             wall_treatments: {
  //               sanding_filling: Boolean(room.wall_treatments?.sanding_filling),
  //               priming: Boolean(room.wall_treatments?.priming),
  //               one_coat: Boolean(room.wall_treatments?.one_coat),
  //               two_coats: Boolean(room.wall_treatments?.two_coats)
  //             },
  //             ceiling_treatments: {
  //               sanding_filling: Boolean(room.ceiling_treatments?.sanding_filling),
  //               priming: Boolean(room.ceiling_treatments?.priming),
  //               one_coat: Boolean(room.ceiling_treatments?.one_coat),
  //               two_coats: Boolean(room.ceiling_treatments?.two_coats)
  //             }
  //           };
  //         }),

  //         // 🔥 FIXED: Interior items with selective preparation steps
  //         interior_items: Object.entries(interiorItems).reduce((acc, [type, items]) => {
  //           if (items.length > 0) {
  //             acc[type] = items.map(item => {
  //               // Only apply woodwork conditions to items that actually use them
  //               const hasConditions = ['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type);
  //               const condition = hasConditions ? (item.condition || 'level_1') : null;
  //               const conditionData = hasConditions ? woodworkConditions[condition] : null;

  //               const itemData = {
  //                 id: item.id,
  //                 type: type,
  //                 description: item.description || getItemTypeLabel(type),
  //                 quantity: parseFloat(item.quantity) || 1,
  //                 unit_price: getInteriorPrice(type, item),
  //                 total_cost: (parseFloat(item.quantity) || 1) * getInteriorPrice(type, item),
  //                 notes: item.notes || '',
  //                 location: item.location || '',
  //                 material: item.material || '',
  //                 finish: item.finish || ''
  //               };

  //               // Add condition-specific data only for items that use conditions
  //               if (type === 'doors') {
  //                 itemData.door_type = item.doorType || 'inside';
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else if (type.includes('Windows')) {
  //                 itemData.size = item.size || 'medium';
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else if (type === 'skirtingBoards' || type === 'otherItems') {
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else {
  //                 // For stairs, radiators - no conditions, no preparation steps
  //                 itemData.steps = [];
  //               }

  //               return itemData;
  //             });
  //           }
  //           return acc;
  //         }, {}),

  //         // 🔥 FIXED: Exterior items with selective preparation steps
  //         exterior_items: Object.entries(exteriorItems).reduce((acc, [type, items]) => {
  //           if (items.length > 0) {
  //             acc[type] = items.map(item => {
  //               // Only apply woodwork conditions to items that actually use them
  //               const hasConditions = ['doors', 'fixedWindows', 'turnWindows', 'dormerWindows', 'fasciaBoards', 'otherItems'].includes(type);
  //               const condition = hasConditions ? (item.condition || 'level_1') : null;
  //               const conditionData = hasConditions ? woodworkConditions[condition] : null;

  //               const itemData = {
  //                 id: item.id,
  //                 type: type,
  //                 description: item.description || getItemTypeLabel(type),
  //                 quantity: parseFloat(item.quantity) || 1,
  //                 unit_price: getExteriorPrice(type, item),
  //                 total_cost: (parseFloat(item.quantity) || 1) * getExteriorPrice(type, item),
  //                 notes: item.notes || '',
  //                 location: item.location || '',
  //                 material: item.material || '',
  //                 finish: item.finish || '',
  //                 weatherproof: item.weatherproof || false
  //               };

  //               // Add condition-specific data only for items that use conditions
  //               if (type === 'doors') {
  //                 itemData.door_type = item.doorType || 'front';
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else if (type.includes('Windows') || type === 'dormerWindows') {
  //                 itemData.size = item.size || 'medium';
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else if (type === 'fasciaBoards' || type === 'otherItems') {
  //                 itemData.condition = condition;
  //                 itemData.condition_name = conditionData?.name || 'Standard';
  //                 itemData.steps = conditionData?.steps || [];
  //               } else {
  //                 // For rainPipe - no conditions, no preparation steps
  //                 itemData.steps = [];
  //               }

  //               return itemData;
  //             });
  //           }
  //           return acc;
  //         }, {}),

  //         // Special jobs with steps
  //         special_jobs: specialJobs.map(job => ({
  //           id: job.id,
  //           type: job.type || 'custom',
  //           name: job.name || 'Custom Work',
  //           description: job.description || '',
  //           category: job.category || 'General',
  //           quantity: parseFloat(job.quantity) || 1,
  //           unit: job.unit || 'job',
  //           unit_price: parseFloat(job.unitPrice) || 0,
  //           total_cost: (parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0),
  //           location: job.location || '',
  //           materials_included: job.materialsIncluded !== false,
  //           estimated_hours: parseFloat(job.estimatedHours) || 0,
  //           difficulty: job.difficulty || 'Standard',
  //           notes: job.notes || '',
  //           steps: job.steps || [] // Include custom steps from special jobs
  //         })),

  //         // Project summary
  //         summary: {
  //           total_rooms: rooms.length,
  //           total_wall_area: rooms.reduce((sum, room) => sum + (parseFloat(room.walls_surface_m2) || 0), 0),
  //           total_ceiling_area: rooms.reduce((sum, room) => sum + (parseFloat(room.area_m2) || 0), 0),
  //           total_interior_items: Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0),
  //           total_exterior_items: Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0),
  //           total_special_jobs: specialJobs.length,
  //           project_notes: notes || ''
  //         }
  //       },

  //       // Pricing information
  //       wall_sanding_price: pricing?.walls?.sanding_filling || pricing?.walls?.sanding?.light?.price || 5.00,
  //       wall_priming_price: pricing?.walls?.priming || pricing?.walls?.priming?.one_coat?.price || 4.50,
  //       wall_one_coat_price: pricing?.walls?.one_coat || pricing?.walls?.painting?.one_coat?.price || 6.00,
  //       wall_two_coats_price: pricing?.walls?.two_coats || pricing?.walls?.painting?.two_coat?.price || 9.50,

  //       ceiling_prep_price: pricing?.ceiling?.sanding_filling || pricing?.ceiling?.preparation?.light?.price || 4.00,
  //       ceiling_priming_price: pricing?.ceiling?.priming || pricing?.ceiling?.preparation?.light?.price || 4.00,
  //       ceiling_one_coat_price: pricing?.ceiling?.one_coat || pricing?.ceiling?.painting?.one_coat?.price || 5.50,
  //       ceiling_two_coats_price: pricing?.ceiling?.two_coats || pricing?.ceiling?.painting?.two_coat?.price || 8.50,

  //       cleanup_fee: 150.00
  //     };

  //     console.log('🔄 Sending quote data with complete preparation steps:', quoteData);

  //     // Generate quote
  //     const response = await api.post(`/projects/${id}/quote`, quoteData);

  //     console.log('✅ Complete quote generated with preparation steps:', response.data);

  //     // Send email
  //     await api.post(`/projects/${id}/email-quote`, {
  //       client_email: project.client_email,
  //       client_name: project.client_name,
  //       project_name: project.name,
  //       total_cost: totalCosts.total,
  //       quote_id: response.data.quote_id
  //     });

  //     // Redirect to quote preview
  //     navigate(`/quotes/${response.data.quote_id}`, {
  //       replace: true
  //     });

  //     showSuccessMessage('Complete quote with preparation steps generated and emailed successfully!');

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.error || err.message || 'Failed to generate quote or send email';
  //     console.error('❌ Quote Generation Error:', err);
  //     setError(`Quote generation failed: ${errorMessage}`);
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

      console.log('🔄 Generating quote with complete interior/exterior details and special job steps...');

      // 🔥 FIXED: Quote data with complete preparation steps
      const quoteData = {
        title: `Comprehensive Paint Quote - ${project.name}`,
        description: `Detailed painting quote for ${project.name} including room-by-room breakdown with complete preparation steps`,
        valid_days: 30,

        // Room measurements (same as before)
        measurement_details: {
          rooms: rooms.map(room => {
            const wallArea = parseFloat(room.walls_surface_m2) || 0;
            const ceilingArea = parseFloat(room.area_m2) || 0;

            return {
              id: room.id,
              name: room.name,
              type: room.type || 'general',
              total_wall_area: wallArea,
              total_ceiling_area: ceilingArea,
              wall_treatments: {
                sanding_filling: Boolean(room.wall_treatments?.sanding_filling),
                priming: Boolean(room.wall_treatments?.priming),
                one_coat: Boolean(room.wall_treatments?.one_coat),
                two_coats: Boolean(room.wall_treatments?.two_coats)
              },
              ceiling_treatments: {
                sanding_filling: Boolean(room.ceiling_treatments?.sanding_filling),
                priming: Boolean(room.ceiling_treatments?.priming),
                one_coat: Boolean(room.ceiling_treatments?.one_coat),
                two_coats: Boolean(room.ceiling_treatments?.two_coats)
              }
            };
          }),

          // 🔥 FIXED: Interior items with selective preparation steps
          interior_items: Object.entries(interiorItems).reduce((acc, [type, items]) => {
            if (items.length > 0) {
              acc[type] = items.map(item => {
                // Only apply woodwork conditions to items that actually use them
                const hasConditions = ['doors', 'fixedWindows', 'turnWindows', 'skirtingBoards', 'otherItems'].includes(type);
                const condition = hasConditions ? (item.condition || 'level_1') : null;
                const conditionData = hasConditions ? woodworkConditions[condition] : null;

                const itemData = {
                  id: item.id,
                  type: type,
                  description: item.description || getItemTypeLabel(type),
                  quantity: parseFloat(item.quantity) || 1,
                  unit_price: getInteriorPrice(type, item),
                  total_cost: (parseFloat(item.quantity) || 1) * getInteriorPrice(type, item),
                  notes: item.notes || '',
                  location: item.location || '',
                  material: item.material || '',
                  finish: item.finish || ''
                };

                // Add condition-specific data only for items that use conditions
                if (type === 'doors') {
                  itemData.door_type = item.doorType || 'inside';
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else if (type.includes('Windows')) {
                  itemData.size = item.size || 'medium';
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else if (type === 'skirtingBoards' || type === 'otherItems') {
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else {
                  // For stairs, radiators - no conditions, no preparation steps
                  itemData.steps = [];
                }

                return itemData;
              });
            }
            return acc;
          }, {}),

          // 🔥 FIXED: Exterior items with selective preparation steps
          exterior_items: Object.entries(exteriorItems).reduce((acc, [type, items]) => {
            if (items.length > 0) {
              acc[type] = items.map(item => {
                // Only apply woodwork conditions to items that actually use them
                const hasConditions = ['doors', 'fixedWindows', 'turnWindows', 'dormerWindows', 'fasciaBoards', 'otherItems'].includes(type);
                const condition = hasConditions ? (item.condition || 'level_1') : null;
                const conditionData = hasConditions ? woodworkConditions[condition] : null;

                const itemData = {
                  id: item.id,
                  type: type,
                  description: item.description || getItemTypeLabel(type),
                  quantity: parseFloat(item.quantity) || 1,
                  unit_price: getExteriorPrice(type, item),
                  total_cost: (parseFloat(item.quantity) || 1) * getExteriorPrice(type, item),
                  notes: item.notes || '',
                  location: item.location || '',
                  material: item.material || '',
                  finish: item.finish || '',
                  weatherproof: item.weatherproof || false
                };

                // Add condition-specific data only for items that use conditions
                if (type === 'doors') {
                  itemData.door_type = item.doorType || 'front';
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else if (type.includes('Windows') || type === 'dormerWindows') {
                  itemData.size = item.size || 'medium';
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else if (type === 'fasciaBoards' || type === 'otherItems') {
                  itemData.condition = condition;
                  itemData.condition_name = conditionData?.name || 'Standard';
                  itemData.steps = conditionData?.steps || [];
                } else {
                  // For rainPipe - no conditions, no preparation steps
                  itemData.steps = [];
                }

                return itemData;
              });
            }
            return acc;
          }, {}),

          // 🔥 FIXED: Special jobs with their specific process steps
          special_jobs: specialJobs.map(job => {
            // Get the specific steps for this job type
            const jobTypeData = specialJobTypes[job.type];

            return {
              id: job.id,
              type: job.type || 'custom',
              name: job.name || 'Custom Work',
              description: job.description || '',
              category: job.category || 'General',
              quantity: parseFloat(job.quantity) || 1,
              unit: job.unit || 'job',
              unit_price: parseFloat(job.unitPrice) || 0,
              total_cost: (parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0),
              location: job.location || '',
              materials_included: job.materialsIncluded !== false,
              estimated_hours: parseFloat(job.estimatedHours) || 0,
              difficulty: job.difficulty || 'Standard',
              notes: job.notes || '',
              // 🔥 CRITICAL: Include the specific process steps for this special job type
              steps: jobTypeData?.steps || job.steps || []
            };
          }),

          // Project summary
          summary: {
            total_rooms: rooms.length,
            total_wall_area: rooms.reduce((sum, room) => sum + (parseFloat(room.walls_surface_m2) || 0), 0),
            total_ceiling_area: rooms.reduce((sum, room) => sum + (parseFloat(room.area_m2) || 0), 0),
            total_interior_items: Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0),
            total_exterior_items: Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0),
            total_special_jobs: specialJobs.length,
            project_notes: notes || ''
          }
        },

        // Pricing information
        wall_sanding_price: pricing?.walls?.sanding_filling || pricing?.walls?.sanding?.light?.price || 5.00,
        wall_priming_price: pricing?.walls?.priming || pricing?.walls?.priming?.one_coat?.price || 4.50,
        wall_one_coat_price: pricing?.walls?.one_coat || pricing?.walls?.painting?.one_coat?.price || 6.00,
        wall_two_coats_price: pricing?.walls?.two_coats || pricing?.walls?.painting?.two_coat?.price || 9.50,

        ceiling_prep_price: pricing?.ceiling?.sanding_filling || pricing?.ceiling?.preparation?.light?.price || 4.00,
        ceiling_priming_price: pricing?.ceiling?.priming || pricing?.ceiling?.preparation?.light?.price || 4.00,
        ceiling_one_coat_price: pricing?.ceiling?.one_coat || pricing?.ceiling?.painting?.one_coat?.price || 5.50,
        ceiling_two_coats_price: pricing?.ceiling?.two_coats || pricing?.ceiling?.painting?.two_coat?.price || 8.50,

        cleanup_fee: 150.00
      };

      console.log('🔄 Sending quote data with complete preparation steps and special job steps:', quoteData);

      // Generate quote
      const response = await api.post(`/projects/${id}/quote`, quoteData);

      console.log('✅ Complete quote generated with all process steps:', response.data);

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

      showSuccessMessage('Complete quote with all preparation and special job steps generated and emailed successfully!');

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate quote or send email';
      console.error('❌ Quote Generation Error:', err);
      setError(`Quote generation failed: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      doors: 'Door',
      fixedWindows: 'Fixed Window',
      turnWindows: 'Turn Window',
      dormerWindows: 'Dormer Window',
      stairs: 'Stair',
      radiators: 'Radiator',
      skirtingBoards: 'Skirting Board',
      fasciaBoards: 'Fascia Board',
      rainPipe: 'Rain Pipe',
      otherItems: 'Other Item'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };



  const getConditionName = (condition) => {
    const conditionMap = {
      'level_1': 'New/Pre-primed',
      'level_2': 'Good Condition',
      'level_3': 'Moderate Wear',
      'level_4': 'Heavy Damage'
    };
    return conditionMap[condition] || 'Standard';
  };

  const getInteriorPrice = (type, item) => {
    if (!pricing?.interior) return 0;

    try {
      if (type === 'doors') {
        const conditionMapping = {
          'level_1': 'easy_prep',
          'level_2': 'medium_prep',
          'level_3': 'heavy_prep',
          'level_4': 'heavy_prep'
        };
        const mappedCondition = conditionMapping[item.condition] || 'easy_prep';
        return pricing.interior.doors[mappedCondition]?.price || 0;
      } else if (type === 'fixedWindows' || type === 'turnWindows') {
        return pricing.interior[type][item.size]?.price || 0;
      } else if (type === 'stairs' || type === 'radiators' || type === 'skirtingBoards' || type === 'otherItems') {
        return pricing.interior[type]?.price || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting interior price:', error);
      return 0;
    }
  };

  const getExteriorPrice = (type, item) => {
    if (!pricing?.exterior) return 0;

    try {
      if (type === 'doors') {
        const doorTypeMapping = {
          'front': 'front_door',
          'garage': 'garage_door',
          'outside': 'outside_door'
        };
        const mappedDoorType = doorTypeMapping[item.doorType] || 'front_door';
        return pricing.exterior.doors[mappedDoorType]?.price || 0;
      } else if (type === 'fixedWindows' || type === 'turnWindows' || type === 'dormerWindows') {
        return pricing.exterior[type][item.size]?.price || 0;
      } else if (type === 'fasciaBoards' || type === 'rainPipe' || type === 'otherItems') {
        return pricing.exterior[type]?.price || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting exterior price:', error);
      return 0;
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
      <div className="bg-gradient-to-r from-[#4bb4f5] to-[#4bb4f5] text-white py-6 sticky top-0 z-10">
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
                        className="inline-flex items-center px-6 py-3 bg-[#4bb4f5] hover:bg-[#4bb4f5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
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
                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                </div> */}

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
                        value={""}
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
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${currentStep === step.id
                        ? 'bg-purple-100 text-[#4bb4f5] font-medium'
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
                  className="w-full bg-[#4bb4f5] hover:bg-[#4bb4f5] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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