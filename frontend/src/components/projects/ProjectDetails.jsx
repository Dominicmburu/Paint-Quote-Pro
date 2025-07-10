// ProjectDetails.jsx - Original design with enhanced AI integration only
import React, { useState, useEffect } from 'react';
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

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // Form data states with project-specific localStorage keys
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_rooms_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [interiorItems, setInteriorItems] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_interiorItems_${id}`);
    return saved ? JSON.parse(saved) : {
      doors: [], fixedWindows: [], turnWindows: [], stairs: [],
      radiators: [], skirtingBoards: [], otherItems: []
    };
  });

  const [exteriorItems, setExteriorItems] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_exteriorItems_${id}`);
    return saved ? JSON.parse(saved) : {
      doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
      fasciaBoards: [], rainPipe: [], otherItems: []
    };
  });

  const [specialJobs, setSpecialJobs] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_specialJobs_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_notes_${id}`);
    return saved ? JSON.parse(saved) : '';
  });

  const [totalCost, setTotalCost] = useState(() => {
    const saved = localStorage.getItem(`projectDetails_totalCost_${id}`);
    return saved ? parseFloat(saved) : 0;
  });

  // Persist state to project-specific localStorage
  useEffect(() => {
    localStorage.setItem(`projectDetails_rooms_${id}`, JSON.stringify(rooms));
  }, [rooms, id]);

  useEffect(() => {
    localStorage.setItem(`projectDetails_interiorItems_${id}`, JSON.stringify(interiorItems));
  }, [interiorItems, id]);

  useEffect(() => {
    localStorage.setItem(`projectDetails_exteriorItems_${id}`, JSON.stringify(exteriorItems));
  }, [exteriorItems, id]);

  useEffect(() => {
    localStorage.setItem(`projectDetails_specialJobs_${id}`, JSON.stringify(specialJobs));
  }, [specialJobs, id]);

  useEffect(() => {
    localStorage.setItem(`projectDetails_notes_${id}`, JSON.stringify(notes));
  }, [notes, id]);

  useEffect(() => {
    localStorage.setItem(`projectDetails_totalCost_${id}`, totalCost.toString());
  }, [totalCost, id]);

  const clearLocalStorage = () => {

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
    setTotalCost(0);
  };

  // Load project and pricing settings
  useEffect(() => {
    loadProject();
    loadPricingSettings();
  }, [id]);

  // Clear state when project ID changes to prevent data leakage
  useEffect(() => {
    // Reset all state when switching to a different project
    const savedRooms = localStorage.getItem(`projectDetails_rooms_${id}`);
    const savedInteriorItems = localStorage.getItem(`projectDetails_interiorItems_${id}`);
    const savedExteriorItems = localStorage.getItem(`projectDetails_exteriorItems_${id}`);
    const savedSpecialJobs = localStorage.getItem(`projectDetails_specialJobs_${id}`);
    const savedNotes = localStorage.getItem(`projectDetails_notes_${id}`);
    const savedTotalCost = localStorage.getItem(`projectDetails_totalCost_${id}`);

    setRooms(savedRooms ? JSON.parse(savedRooms) : []);
    setInteriorItems(savedInteriorItems ? JSON.parse(savedInteriorItems) : {
      doors: [], fixedWindows: [], turnWindows: [], stairs: [],
      radiators: [], skirtingBoards: [], otherItems: []
    });
    setExteriorItems(savedExteriorItems ? JSON.parse(savedExteriorItems) : {
      doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
      fasciaBoards: [], rainPipe: [], otherItems: []
    });
    setSpecialJobs(savedSpecialJobs ? JSON.parse(savedSpecialJobs) : []);
    setNotes(savedNotes ? JSON.parse(savedNotes) : '');
    setTotalCost(savedTotalCost ? parseFloat(savedTotalCost) : 0);
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      const data = response.data.project;
      setProject(data);

      if (data.manual_measurements) {
        const measurements = data.manual_measurements;
        if (measurements.rooms && rooms.length === 0) {
          setRooms(measurements.rooms);
        }
        if (measurements.interiorItems && Object.values(interiorItems).every(items => items.length === 0)) {
          setInteriorItems(measurements.interiorItems);
        }
        if (measurements.exteriorItems && Object.values(exteriorItems).every(items => items.length === 0)) {
          setExteriorItems(measurements.exteriorItems);
        }
        if (measurements.specialJobs && specialJobs.length === 0) {
          setSpecialJobs(measurements.specialJobs);
        }
        if (measurements.notes && !notes) {
          setNotes(measurements.notes);
        }
        if (measurements.totalCost && totalCost === 0) {
          setTotalCost(measurements.totalCost);
        }
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

  //   setAnalyzing(true);
  //   setError('');

  //   try {
  //     const response = await api.post(`/projects/${id}/analyze`);

  //     // Update project with fresh analysis results
  //     setProject(prev => ({ 
  //       ...prev, 
  //       floor_plan_analysis: response.data.analysis, 
  //       status: 'ready' 
  //     }));

  //     // Only process analysis if it's for THIS specific project
  //     if (response.data.analysis?.structured_measurements) {
  //       const measurements = response.data.analysis.structured_measurements;

  //       // Only populate if current rooms are empty AND this analysis is for this project
  //       if (rooms.length === 0 && measurements.rooms) {
  //         // Map AI analysis to YOUR actual RoomMeasurements component structure
  //         const mappedRooms = measurements.rooms.map(aiRoom => {
  //           const room = {
  //             id: aiRoom.id || Date.now() + Math.random(),
  //             name: aiRoom.name || `Room ${aiRoom.id}`,
  //             type: aiRoom.type || 'general',
  //             walls: [],
  //             ceiling: null,
  //             other_surfaces: null
  //           };

  //           // Map walls to match your actual component structure (boolean flags)
  //           if (aiRoom.walls && Array.isArray(aiRoom.walls)) {
  //             room.walls = aiRoom.walls.map((aiWall, index) => ({
  //               id: aiWall.id || (Date.now() + index),
  //               name: aiWall.name || `Wall ${index + 1}`,
  //               length: parseFloat(aiWall.length) || 0,
  //               height: parseFloat(aiWall.height) || 2.4,
  //               area: parseFloat(aiWall.area) || 0,
  //               // Boolean flags as expected by your component
  //               sanding_filling: false,
  //               priming: false,
  //               one_coat: false,
  //               two_coats: false
  //             }));
  //           } else if (aiRoom.wall_area) {
  //             // If no individual walls, create one wall with total area
  //             room.walls = [{
  //               id: Date.now(),
  //               name: 'Total Wall Area',
  //               length: 0,
  //               height: 2.4,
  //               area: parseFloat(aiRoom.wall_area) || 0,
  //               // Boolean flags as expected by your component
  //               sanding_filling: false,
  //               priming: false,
  //               one_coat: false,
  //               two_coats: false
  //             }];
  //           }

  //           // Map ceiling to match your actual component structure (boolean flags)
  //           if (aiRoom.ceiling || aiRoom.ceiling_area) {
  //             const ceilingArea = parseFloat(aiRoom.ceiling?.area || aiRoom.ceiling_area) || 0;
  //             const ceilingLength = parseFloat(aiRoom.ceiling?.length) || Math.sqrt(ceilingArea);
  //             const ceilingWidth = parseFloat(aiRoom.ceiling?.width) || Math.sqrt(ceilingArea);

  //             room.ceiling = {
  //               length: ceilingLength,
  //               width: ceilingWidth,
  //               area: ceilingArea,
  //               // Boolean flags as expected by your component
  //               sanding_filling: false,
  //               priming: false,
  //               one_coat: false,
  //               two_coats: false
  //             };
  //           }

  //           return room;
  //         });

  //         setRooms(mappedRooms);
  //         console.log(`✅ AI Analysis: Populated ${mappedRooms.length} rooms for project ${id}`);

  //         // Show detailed success message
  //         const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
  //         const totalWallArea = mappedRooms.reduce((sum, room) => 
  //           sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
  //         );
  //         const totalCeilingArea = mappedRooms.reduce((sum, room) => 
  //           sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
  //         );

  //         showSuccessMessage(
  //           `AI analysis completed for this project! Populated ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
  //           `Total wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
  //         );
  //       } else if (rooms.length > 0) {
  //         console.log(`⚠️ AI Analysis: Skipping room population for project ${id} - existing data found`);
  //         showSuccessMessage('AI analysis completed! Existing room data preserved.');
  //       } else {
  //         console.log(`⚠️ AI Analysis: No rooms found in analysis for project ${id}`);
  //         showSuccessMessage('AI analysis completed but no rooms were detected. You can add rooms manually.');
  //       }

  //       // Update notes if empty
  //       if (notes.length === 0 && measurements.notes) {
  //         setNotes(measurements.notes);
  //       }
  //     } else {
  //       console.log(`❌ AI Analysis: No structured measurements returned for project ${id}`);
  //       showSuccessMessage('AI analysis completed but no room data was returned.');
  //     }

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
  //     setError(`AI analysis failed for this project: ${errorMessage}`);
  //     console.error(`AI Analysis Error for project ${id}:`, errorMessage);
  //   } finally {
  //     setAnalyzing(false);
  //   }
  // };

  // ProjectDetails.jsx
  
  // const performAIAnalysis = async () => {
  //   if (!project) {
  //     setError('Please save the project first');
  //     return;
  //   }

  //   if (!project.uploaded_images || project.uploaded_images.length === 0) {
  //     setError('Please upload floor plan images first');
  //     return;
  //   }

  //   setAnalyzing(true);
  //   setError('');

  //   try {
  //     const response = await api.post(`/projects/${id}/analyze`);

  //     // Update project with fresh analysis results
  //     setProject(prev => ({
  //       ...prev,
  //       floor_plan_analysis: response.data.analysis,
  //       status: 'ready'
  //     }));

  //     if (response.data.analysis?.structured_measurements) {
  //       const measurements = response.data.analysis.structured_measurements;

  //       // Merge rooms only if none exist or user confirms overwrite
  //       if (rooms.length === 0 || window.confirm('Existing measurements found. Overwrite with AI results?')) {
  //         const mappedRooms = measurements.rooms?.map(aiRoom => ({
  //           id: aiRoom.id || Date.now() + Math.random(),
  //           name: aiRoom.name || `Room ${aiRoom.id}`,
  //           type: aiRoom.type || 'general',
  //           walls: aiRoom.walls?.map((aiWall, index) => ({
  //             id: aiWall.id || (Date.now() + index),
  //             name: aiWall.name || `Wall ${index + 1}`,
  //             length: parseFloat(aiWall.length) || 0,
  //             height: parseFloat(aiWall.height) || 2.4,
  //             area: parseFloat(aiWall.area) || 0,
  //             sanding_filling: false,
  //             priming: false,
  //             one_coat: false,
  //             two_coats: false
  //           })) || [],
  //           ceiling: aiRoom.ceiling ? {
  //             length: parseFloat(aiRoom.ceiling.length) || 0,
  //             width: parseFloat(aiRoom.ceiling.width) || 0,
  //             area: parseFloat(aiRoom.ceiling.area) || 0,
  //             sanding_filling: false,
  //             priming: false,
  //             one_coat: false,
  //             two_coats: false
  //           } : null,
  //           other_surfaces: null
  //         })) || [];

  //         setRooms(mappedRooms);

  //         // Populate interior and exterior items
  //         if (measurements.interior_items) {
  //           setInteriorItems(prev => ({
  //             ...prev,
  //             ...measurements.interior_items
  //           }));
  //         }
  //         if (measurements.exterior_items) {
  //           setExteriorItems(prev => ({
  //             ...prev,
  //             ...measurements.exterior_items
  //           }));
  //         }

  //         // Update notes if empty
  //         if (!notes && measurements.notes) {
  //           setNotes(measurements.notes);
  //         }

  //         const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
  //         const totalWallArea = mappedRooms.reduce((sum, room) =>
  //           sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
  //         );
  //         const totalCeilingArea = mappedRooms.reduce((sum, room) =>
  //           sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
  //         );

  //         showSuccessMessage(
  //           `AI analysis completed! Populated ${mappedRooms.length} rooms, ${totalWalls} walls, ` +
  //           `${measurements.interior_items ? Object.values(measurements.interior_items).flat().length : 0} interior items, ` +
  //           `${measurements.exterior_items ? Object.values(measurements.exterior_items).flat().length : 0} exterior items. ` +
  //           `Total wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
  //         );
  //       } else {
  //         showSuccessMessage('AI analysis completed! Existing measurements preserved.');
  //       }
  //     } else {
  //       showSuccessMessage('AI analysis completed but no data was returned.');
  //     }

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.details || err.message || 'AI analysis failed';
  //     setError(`AI analysis failed: ${errorMessage}`);
  //   } finally {
  //     setAnalyzing(false);
  //   }
  // };


  // const performAIAnalysis = async () => {
  //   if (!project?.uploaded_images || project.uploaded_images.length === 0) {
  //     setError('Please upload floor plan images first');
  //     return;
  //   }

  //   // Confirm if there's existing data
  //   const hasExistingData = rooms.length > 0 || 
  //                          Object.values(interiorItems).some(items => items.length > 0) ||
  //                          Object.values(exteriorItems).some(items => items.length > 0) ||
  //                          specialJobs.length > 0;

  //   if (hasExistingData) {
  //     const confirmed = window.confirm(
  //       'You have existing measurements. Running AI analysis will overwrite all current data. Continue?'
  //     );
  //     if (!confirmed) return;
  //   }

  //   setAnalyzing(true);
  //   setError('');

  //   try {
  //     const response = await api.post(`/projects/${id}/analyze`);

  //     // Update project state
  //     setProject(prev => ({
  //       ...prev,
  //       floor_plan_analysis: response.data.analysis,
  //       status: 'ready'
  //     }));

  //     // Process new AI analysis and OVERWRITE existing data
  //     if (response.data.analysis?.structured_measurements) {
  //       const measurements = response.data.analysis.structured_measurements;

  //       console.log('🔄 AI Analysis: Overwriting existing data with fresh analysis');

  //       // Clear and set new rooms
  //       const mappedRooms = measurements.rooms?.map(aiRoom => ({
  //         id: aiRoom.id || Date.now() + Math.random(),
  //         name: aiRoom.name || `Room ${aiRoom.id}`,
  //         type: aiRoom.type || 'general',
  //         walls: aiRoom.walls?.map((aiWall, index) => ({
  //           id: aiWall.id || (Date.now() + index),
  //           name: aiWall.name || `Wall ${index + 1}`,
  //           length: parseFloat(aiWall.length) || 0,
  //           height: parseFloat(aiWall.height) || 2.4,
  //           area: parseFloat(aiWall.area) || 0,
  //           sanding_filling: false,
  //           priming: false,
  //           one_coat: false,
  //           two_coats: false
  //         })) || [],
  //         ceiling: aiRoom.ceiling ? {
  //           length: parseFloat(aiRoom.ceiling.length) || 0,
  //           width: parseFloat(aiRoom.ceiling.width) || 0,
  //           area: parseFloat(aiRoom.ceiling.area) || 0,
  //           sanding_filling: false,
  //           priming: false,
  //           one_coat: false,
  //           two_coats: false
  //         } : null,
  //         other_surfaces: null
  //       })) || [];

  //       // OVERWRITE all data
  //       setRooms(mappedRooms);
  //       setInteriorItems({
  //         doors: [], fixedWindows: [], turnWindows: [], stairs: [],
  //         radiators: [], skirtingBoards: [], otherItems: []
  //       });
  //       setExteriorItems({
  //         doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
  //         fasciaBoards: [], rainPipe: [], otherItems: []
  //       });
  //       setSpecialJobs([]);
  //       setTotalCost(0);

  //       // Update notes
  //       if (measurements.notes) {
  //         setNotes(measurements.notes);
  //       }

  //       const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
  //       const totalWallArea = mappedRooms.reduce((sum, room) =>
  //         sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
  //       );
  //       const totalCeilingArea = mappedRooms.reduce((sum, room) =>
  //         sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
  //       );

  //       showSuccessMessage(
  //         `🔄 AI analysis completed! Detected ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
  //         `Wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
  //       );
  //     } else {
  //       showSuccessMessage('AI analysis completed but no room data was returned.');
  //     }

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
  //     setError(`AI analysis failed: ${errorMessage}`);
  //     console.error('AI Analysis Error:', errorMessage);
  //   } finally {
  //     setAnalyzing(false);
  //   }
  // };

  

  // Add this debug version to your performAIAnalysis function

const performAIAnalysis = async () => {
  if (!project?.uploaded_images || project.uploaded_images.length === 0) {
    setError('Please upload floor plan images first');
    return;
  }

  // Confirm if there's existing data
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

    // Update project state
    setProject(prev => ({
      ...prev,
      floor_plan_analysis: response.data.analysis,
      status: 'ready'
    }));

    // Debug: Check the full response structure
    if (response.data.analysis) {
      console.log('✅ Analysis data received:', response.data.analysis);
      
      if (response.data.analysis.structured_measurements) {
        console.log('📋 Structured measurements found:', response.data.analysis.structured_measurements);
        
        const measurements = response.data.analysis.structured_measurements;
        
        if (measurements.rooms && Array.isArray(measurements.rooms)) {
          console.log(`🏠 Found ${measurements.rooms.length} rooms in analysis`);
          
          measurements.rooms.forEach((room, index) => {
            console.log(`Room ${index + 1}:`, {
              name: room.name,
              type: room.type,
              wallsCount: room.walls?.length || 0,
              hasCeiling: !!room.ceiling,
              walls: room.walls
            });
          });

          // Process the mapping
          const mappedRooms = measurements.rooms.map(aiRoom => {
            console.log('🔄 Processing room:', aiRoom.name);
            
            const mappedRoom = {
              id: aiRoom.id || Date.now() + Math.random(),
              name: aiRoom.name || `Room ${aiRoom.id}`,
              type: aiRoom.type || 'general',
              walls: aiRoom.walls?.map((aiWall, index) => {
                console.log('🧱 Processing wall:', {
                  name: aiWall.name,
                  length: aiWall.length,
                  height: aiWall.height,
                  area: aiWall.area
                  // No treatments logged - user will select these
                });
                
                return {
                  id: aiWall.id || (Date.now() + index),
                  name: aiWall.name || `Wall ${index + 1}`,
                  length: parseFloat(aiWall.length) || 0,
                  height: parseFloat(aiWall.height) || 2.4,
                  area: parseFloat(aiWall.area) || 0,
                  // USER INPUT: All treatments start unchecked
                  sanding_filling: false,
                  priming: false,
                  one_coat: false,
                  two_coats: false
                };
              }) || [],
              ceiling: aiRoom.ceiling ? {
                length: parseFloat(aiRoom.ceiling.length) || 0,
                width: parseFloat(aiRoom.ceiling.width) || 0,
                area: parseFloat(aiRoom.ceiling.area) || 0,
                // USER INPUT: All treatments start unchecked
                sanding_filling: false,
                priming: false,
                one_coat: false,
                two_coats: false
              } : null,
              other_surfaces: null
            };
            
            console.log('✅ Mapped room:', mappedRoom);
            return mappedRoom;
          });

          console.log('🎯 Final mapped rooms:', mappedRooms);

          // Set the rooms
          setRooms(mappedRooms);
          
          // Reset other items
          setInteriorItems({
            doors: [], fixedWindows: [], turnWindows: [], stairs: [],
            radiators: [], skirtingBoards: [], otherItems: []
          });
          setExteriorItems({
            doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
            fasciaBoards: [], rainPipe: [], otherItems: []
          });
          setSpecialJobs([]);
          setTotalCost(0);

          // Update notes
          if (measurements.notes) {
            setNotes(measurements.notes);
          }

          const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
          const totalWallArea = mappedRooms.reduce((sum, room) =>
            sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0), 0
          );
          const totalCeilingArea = mappedRooms.reduce((sum, room) =>
            sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0), 0
          );

          showSuccessMessage(
            `🔄 AI analysis completed! Detected ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
            `Wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
          );
        } else {
          console.log('❌ No rooms array found in measurements');
          showSuccessMessage('AI analysis completed but no rooms were detected.');
        }
      } else {
        console.log('❌ No structured_measurements found in analysis');
        showSuccessMessage('AI analysis completed but no structured measurements returned.');
      }
    } else {
      console.log('❌ No analysis data in response');
      showSuccessMessage('AI analysis completed but no analysis data returned.');
    }

  } catch (err) {
    const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
    console.error('❌ AI Analysis Error:', err);
    console.error('Error details:', err.response?.data);
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
        totalCost
      };

      await api.post(`/projects/${id}/manual-measurements`, measurementData);

      if (project.status === 'draft') {
        setProject(prev => ({ ...prev, status: 'ready' }));
      }

      showSuccessMessage('Measurements saved successfully!');
      clearLocalStorage();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

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
      await saveMeasurements();

      const hasRoomMeasurements = rooms.length > 0;
      const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
      const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);
      const hasSpecialJobs = specialJobs.length > 0;

      if (!hasRoomMeasurements && !hasInteriorItems && !hasExteriorItems && !hasSpecialJobs) {
        setError('Please add some measurements before generating a quote');
        return;
      }

      const response = await api.post(`/projects/${id}/quote`, {
        rooms,
        interiorItems,
        exteriorItems,
        specialJobs,
        notes,
        totalCost,
        customPricing
      });

      await api.post(`/projects/${id}/email-quote`, {
        client_email: project.client_email,
        client_name: project.client_name,
        project_name: project.name,
        total_cost: totalCost,
        quote_id: response.data.quote_id
      });

      navigate(`/projects/${id}/quote`, {
        state: {
          rooms,
          interiorItems,
          exteriorItems,
          specialJobs,
          notes,
          totalCost,
          customPricing
        }
      });

      showSuccessMessage('Quote generated and emailed successfully!');
      clearLocalStorage();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate quote or send email');
    } finally {
      setGenerating(false);
    }
  };

  const handleResetCalculator = () => {
    clearLocalStorage();
    setError('');
    showSuccessMessage('Calculator reset successfully!');
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
                    Project: {project.name} • Status: {project.status}
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
                  Project & Client Information
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
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created By</dt>
                        <dd className="text-sm text-gray-900">{project?.created_by || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="text-sm text-gray-900">
                          {project?.created_at ? new Date(project.created_at).toLocaleDateString('en-GB', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                        <dd className="text-sm text-gray-900">
                          {project?.updated_at ? new Date(project.updated_at).toLocaleDateString('en-GB', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900 capitalize">{project?.status || 'Not provided'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.company_name || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Contact Name</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.contact_name || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.email || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.phone || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.address || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Postcode</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.postcode || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">City</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.city || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">BTW Number</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.btw_number || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">KvK Number</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.kvk_number || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">IBAN</dt>
                        <dd className="text-sm text-gray-900">{project?.client_info?.iban || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Website</dt>
                        <dd className="text-sm text-gray-900">
                          {project?.client_info?.website ? (
                            <a href={project.client_info.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {project.client_info.website}
                            </a>
                          ) : 'Not provided'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
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
                      Run AI analysis to automatically detect rooms, walls, and ceilings from your floor plans.
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
                    {!project && <span className="text-sm text-gray-500 ml-3">(Project not loaded)</span>}
                  </h2>
                  {project && (
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
                            Save Measurements
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {project && (
                  <>
                    <ErrorBoundary>
                      <RoomMeasurements
                        rooms={rooms}
                        setRooms={setRooms}
                        onCostChange={setTotalCost}
                        customPricing={customPricing}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <InteriorWork
                        interiorItems={interiorItems}
                        setInteriorItems={setInteriorItems}
                        onCostChange={setTotalCost}
                        customPricing={customPricing?.interior}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <ExteriorWork
                        exteriorItems={exteriorItems}
                        setExteriorItems={setExteriorItems}
                        onCostChange={setTotalCost}
                        customPricing={customPricing?.exterior}
                      />
                    </ErrorBoundary>

                    <ErrorBoundary>
                      <SpecialJobsSection
                        specialJobs={specialJobs}
                        setSpecialJobs={setSpecialJobs}
                        onCostChange={setTotalCost}
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
                      Project Loaded
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
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-2">Total Amount</h4>
                <p className="text-3xl font-bold text-teal-600">£{totalCost.toFixed(2)}</p>
                <div className="mt-3 text-sm text-gray-600">
                  <div>Rooms: {rooms.length}</div>
                  <div>Interior Items: {Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0)}</div>
                  <div>Exterior Items: {Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0)}</div>
                  <div>Special Jobs: {specialJobs.length}</div>
                </div>
                <button
                  onClick={generateQuoteAndEmail}
                  disabled={generating || !project || totalCost === 0}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
                  Reset Calculator
                </button>
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
                    <div>Client: {project.client_name}</div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Tips</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p>• Verify all project details</p>
                  <p>• Upload floor plans for AI analysis</p>
                  <p>• Add measurements for accurate quotes</p>
                  <p>• Include special jobs for complex work</p>
                  <p>• Save measurements frequently</p>
                  <p>• Review before generating quote</p>
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