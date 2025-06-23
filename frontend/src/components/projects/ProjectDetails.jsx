import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  FileText,
  Calculator,
  Home,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Download,
  Send,
  Save,
  RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Calculator state
  const [surfaceMeasurements, setSurfaceMeasurements] = useState({
    walls: [],
    ceilings: [],
    otherSurfaces: []
  });

  const [interiorItems, setInteriorItems] = useState({
    fixedWindows: [],
    turnWindows: [],
    doors: [],
    stairs: [],
    radiators: [],
    skirtingBoards: [],
    otherItems: []
  });

  const [exteriorItems, setExteriorItems] = useState({
    fixedWindows: [],
    turnWindows: [],
    doors: [],
    dormerWindows: [],
    fasciaBoards: [],
    rainPipe: [],
    otherItems: []
  });

  const [notes, setNotes] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Pricing configuration
  const pricing = {
    wallPaint: 12.50, // per m²
    ceilingPaint: 10.00, // per m²
    preparation: 8.00, // per m²
    fixedWindows: 45.00, // per window
    turnWindows: 55.00, // per window
    doors: 85.00, // per door
    stairs: 25.00, // per step
    radiators: 35.00, // per radiator
    skirtingBoards: 12.00, // per meter
    dormerWindows: 120.00, // per window
    fasciaBoards: 18.00, // per meter
    rainPipe: 15.00 // per meter
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    calculateTotalCost();
  }, [surfaceMeasurements, interiorItems, exteriorItems]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      const projectData = response.data.project;
      setProject(projectData);

      // Load existing manual measurements if available
      if (projectData.manual_measurements) {
        const measurements = projectData.manual_measurements;

        // Load surface measurements
        if (measurements.surfaceMeasurements) {
          setSurfaceMeasurements(measurements.surfaceMeasurements);
        }

        // Load interior items
        if (measurements.interiorItems) {
          setInteriorItems(measurements.interiorItems);
        }

        // Load exterior items  
        if (measurements.exteriorItems) {
          setExteriorItems(measurements.exteriorItems);
        }

        // Load notes
        if (measurements.notes) {
          setNotes(measurements.notes);
        }

        // Legacy support: Convert old room format if present
        if (measurements.rooms && !measurements.surfaceMeasurements) {
          const walls = [];
          const ceilings = [];
          measurements.rooms.forEach((room, roomIndex) => {
            if (room.walls) {
              room.walls.forEach((wall, wallIndex) => {
                walls.push({
                  id: `${roomIndex}-${wallIndex}`,
                  length: wall.length || 0,
                  height: wall.height || 0,
                  area: wall.area || 0,
                  roomName: room.name || `Room ${roomIndex + 1}`
                });
              });
            }
            if (room.ceiling) {
              ceilings.push({
                id: `ceiling-${roomIndex}`,
                width: Math.sqrt(room.ceiling.area || 0),
                length: Math.sqrt(room.ceiling.area || 0),
                area: room.ceiling.area || 0,
                roomName: room.name || `Room ${roomIndex + 1}`
              });
            }
          });
          setSurfaceMeasurements(prev => ({ ...prev, walls, ceilings }));
        }

        setNotes(measurements.notes || '');
      }
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;

    // Calculate surface costs
    const totalWallArea = surfaceMeasurements.walls.reduce((sum, wall) => sum + wall.area, 0);
    const totalCeilingArea = surfaceMeasurements.ceilings.reduce((sum, ceiling) => sum + ceiling.area, 0);
    const totalOtherArea = surfaceMeasurements.otherSurfaces.reduce((sum, surface) => sum + surface.area, 0);

    total += totalWallArea * pricing.wallPaint;
    total += totalCeilingArea * pricing.ceilingPaint;
    total += (totalWallArea + totalCeilingArea + totalOtherArea) * pricing.preparation;

    // Calculate interior items cost
    Object.keys(interiorItems).forEach(type => {
      interiorItems[type].forEach(item => {
        total += item.quantity * (pricing[type] || 0);
      });
    });

    // Calculate exterior items cost
    Object.keys(exteriorItems).forEach(type => {
      exteriorItems[type].forEach(item => {
        total += item.quantity * (pricing[type] || 0);
      });
    });

    setTotalCost(total);
  };

  // Surface measurement functions
  const addWall = () => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      walls: [...prev.walls, { id: Date.now(), length: 0, height: 0, area: 0 }]
    }));
  };

  const addCeiling = () => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      ceilings: [...prev.ceilings, { id: Date.now(), width: 0, length: 0, area: 0 }]
    }));
  };

  const addOtherSurface = () => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      otherSurfaces: [...prev.otherSurfaces, { id: Date.now(), description: '', area: 0 }]
    }));
  };

  const updateWall = (id, field, value) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      walls: prev.walls.map(wall => {
        if (wall.id === id) {
          const updated = { ...wall, [field]: parseFloat(value) || 0 };
          updated.area = updated.length * updated.height;
          return updated;
        }
        return wall;
      })
    }));
  };

  const updateCeiling = (id, field, value) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      ceilings: prev.ceilings.map(ceiling => {
        if (ceiling.id === id) {
          const updated = { ...ceiling, [field]: parseFloat(value) || 0 };
          updated.area = updated.width * updated.length;
          return updated;
        }
        return ceiling;
      })
    }));
  };

  const updateOtherSurface = (id, field, value) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      otherSurfaces: prev.otherSurfaces.map(surface => {
        if (surface.id === id) {
          return { ...surface, [field]: field === 'area' ? (parseFloat(value) || 0) : value };
        }
        return surface;
      })
    }));
  };

  const removeWall = (id) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      walls: prev.walls.filter(wall => wall.id !== id)
    }));
  };

  const removeCeiling = (id) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      ceilings: prev.ceilings.filter(ceiling => ceiling.id !== id)
    }));
  };

  const removeOtherSurface = (id) => {
    setSurfaceMeasurements(prev => ({
      ...prev,
      otherSurfaces: prev.otherSurfaces.filter(surface => surface.id !== id)
    }));
  };

  // Interior/Exterior item functions
  const addInteriorItem = (type) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), quantity: 1, description: '', cost: 0 }]
    }));
  };

  const addExteriorItem = (type) => {
    setExteriorItems(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), quantity: 1, description: '', cost: 0 }]
    }));
  };

  const updateInteriorItem = (type, id, field, value) => {
    setInteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: field === 'quantity' ? (parseInt(value) || 0) : value };
          if (field === 'quantity') {
            updated.cost = updated.quantity * (pricing[type] || 0);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const updateExteriorItem = (type, id, field, value) => {
    setExteriorItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: field === 'quantity' ? (parseInt(value) || 0) : value };
          if (field === 'quantity') {
            updated.cost = updated.quantity * (pricing[type] || 0);
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

  const removeExteriorItem = (type, id) => {
    setExteriorItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  // Save measurements to backend
  const saveMeasurements = async () => {
    try {
      setSaving(true);
      const measurementData = {
        surfaceMeasurements,
        interiorItems,
        exteriorItems,
        notes,
        totalCost
      };

      await api.post(`/projects/${id}/manual-measurements`, measurementData);

      // Update project status if this is the first data entry
      if (project.status === 'draft') {
        setProject(prev => ({ ...prev, status: 'ready' }));
      }

      // Show success message
      setError('');
      alert('Measurements saved successfully!');
    } catch (err) {
      console.error('Save measurements error:', err);
      setError(err.response?.data?.error || 'Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  // Generate quote with email
  // Generate quote with email
  const generateQuote = async () => {
    try {
      setGenerating(true);
      setError('');

      // Validate that we have measurements
      const totalWallArea = surfaceMeasurements.walls.reduce((sum, wall) => sum + wall.area, 0);
      const totalCeilingArea = surfaceMeasurements.ceilings.reduce((sum, ceiling) => sum + ceiling.area, 0);
      const hasInteriorItems = Object.values(interiorItems).some(items => items.length > 0);
      const hasExteriorItems = Object.values(exteriorItems).some(items => items.length > 0);

      if (totalWallArea === 0 && totalCeilingArea === 0 && !hasInteriorItems && !hasExteriorItems) {
        setError('Please add some measurements before generating a quote');
        return;
      }

      // First, save the measurements to ensure project status is updated
      const measurementData = {
        surfaceMeasurements,
        interiorItems,
        exteriorItems,
        notes,
        totalCost
      };

      try {
        await api.post(`/projects/${id}/manual-measurements`, measurementData);
      } catch (saveError) {
        console.warn('Failed to save measurements before quote generation:', saveError);
        // Continue with quote generation even if save fails
      }

      // Prepare line items for the quote
      const lineItems = [];

      // Add surface area items
      if (totalWallArea > 0) {
        lineItems.push({
          description: 'Wall Painting',
          quantity: totalWallArea,
          unit: 'm²',
          unit_price: pricing.wallPaint,
          total: totalWallArea * pricing.wallPaint
        });

        lineItems.push({
          description: 'Wall Preparation',
          quantity: totalWallArea,
          unit: 'm²',
          unit_price: pricing.preparation,
          total: totalWallArea * pricing.preparation
        });
      }

      if (totalCeilingArea > 0) {
        lineItems.push({
          description: 'Ceiling Painting',
          quantity: totalCeilingArea,
          unit: 'm²',
          unit_price: pricing.ceilingPaint,
          total: totalCeilingArea * pricing.ceilingPaint
        });

        lineItems.push({
          description: 'Ceiling Preparation',
          quantity: totalCeilingArea,
          unit: 'm²',
          unit_price: pricing.preparation,
          total: totalCeilingArea * pricing.preparation
        });
      }

      // Add other surfaces
      surfaceMeasurements.otherSurfaces.forEach(surface => {
        if (surface.area > 0) {
          lineItems.push({
            description: surface.description || 'Other Surface',
            quantity: surface.area,
            unit: 'm²',
            unit_price: pricing.wallPaint,
            total: surface.area * pricing.wallPaint
          });
        }
      });

      // Add interior items
      Object.keys(interiorItems).forEach(type => {
        interiorItems[type].forEach(item => {
          if (item.quantity > 0) {
            lineItems.push({
              description: item.description || type.replace(/([A-Z])/g, ' $1').toLowerCase(),
              quantity: item.quantity,
              unit: 'piece',
              unit_price: pricing[type] || 0,
              total: item.quantity * (pricing[type] || 0)
            });
          }
        });
      });

      // Add exterior items
      Object.keys(exteriorItems).forEach(type => {
        exteriorItems[type].forEach(item => {
          if (item.quantity > 0) {
            lineItems.push({
              description: item.description || type.replace(/([A-Z])/g, ' $1').toLowerCase(),
              quantity: item.quantity,
              unit: 'piece',
              unit_price: pricing[type] || 0,
              total: item.quantity * (pricing[type] || 0)
            });
          }
        });
      });

      // Ensure we have line items
      if (lineItems.length === 0) {
        setError('No line items generated. Please add some measurements.');
        return;
      }

      // Prepare quote data
      const quoteData = {
        title: `Paint Quote - ${project.name}`,
        description: `Professional painting quote for ${project.name}. ${notes ? 'Additional notes: ' + notes : ''}`,
        line_items: lineItems,
        valid_days: 30
      };

      console.log('Generating quote with data:', quoteData);

      // Generate the quote
      const response = await api.post(`/quotes/project/${id}`, quoteData);
      const quote = response.data.quote;

      console.log('Quote generated successfully:', quote);

      // Send email if client email is available
      if (project.client_email) {
        try {
          setSendingEmail(true);
          await api.post(`/quotes/${quote.id}/send`, {
            client_email: project.client_email
          });

          alert(`Quote generated successfully and sent to ${project.client_email}!`);
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          alert(`Quote generated successfully, but failed to send email. You can download the quote from the quotes section.`);
        } finally {
          setSendingEmail(false);
        }
      } else {
        alert('Quote generated successfully! Note: No client email provided, so quote was not sent automatically.');
      }

      // Refresh project data
      await loadProject();

      // Navigate to quote preview
      navigate(`/quotes/${quote.id}`);

    } catch (err) {
      console.error('Generate quote error:', err);

      // Provide more specific error messaging
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 400) {
        setError('Invalid quote data. Please check your measurements and try again.');
      } else if (err.response?.status === 404) {
        setError('Project not found. Please refresh the page and try again.');
      } else {
        setError('Failed to generate quote. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate quote using AI analysis
  const autoGenerateQuote = async () => {
    try {
      setGenerating(true);
      setError('');

      if (!project.floor_plan_analysis) {
        setError('AI analysis not available. Please add measurements manually or run floor plan analysis first.');
        return;
      }

      // Use the auto-generate endpoint
      const quoteData = {
        title: `AI Paint Quote - ${project.name}`,
        description: `AI-generated painting quote for ${project.name} based on floor plan analysis. ${notes ? 'Additional notes: ' + notes : ''}`,
        valid_days: 30,
        quote_settings: {
          paint_prices: {
            primer_per_m2: pricing.preparation,
            paint_per_m2: pricing.wallPaint,
            ceiling_paint_per_m2: pricing.ceilingPaint
          },
          labor_prices: {
            prep_per_m2: pricing.preparation / 2,
            painting_per_m2: pricing.wallPaint / 2,
            ceiling_per_m2: pricing.ceilingPaint / 2
          }
        }
      };

      const response = await api.post(`/quotes/project/${id}/auto-generate`, quoteData);
      const quote = response.data.quote;

      // Send email if client email is available
      if (project.client_email) {
        try {
          setSendingEmail(true);
          await api.post(`/quotes/${quote.id}/send`, {
            client_email: project.client_email
          });

          alert(`AI Quote generated successfully and sent to ${project.client_email}!`);
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          alert(`AI Quote generated successfully, but failed to send email. You can download the quote from the quotes section.`);
        } finally {
          setSendingEmail(false);
        }
      } else {
        alert('AI Quote generated successfully! Note: No client email provided, so quote was not sent automatically.');
      }

      navigate(`/quotes/${quote.id}`);

    } catch (err) {
      console.error('Auto-generate quote error:', err);
      setError(err.response?.data?.error || 'Failed to auto-generate quote');
    } finally {
      setGenerating(false);
    }
  };

  const resetCalculator = () => {
    setSurfaceMeasurements({ walls: [], ceilings: [], otherSurfaces: [] });
    setInteriorItems({
      fixedWindows: [],
      turnWindows: [],
      doors: [],
      stairs: [],
      radiators: [],
      skirtingBoards: [],
      otherItems: []
    });
    setExteriorItems({
      fixedWindows: [],
      turnWindows: [],
      doors: [],
      dormerWindows: [],
      fasciaBoards: [],
      rainPipe: [],
      otherItems: []
    });
    setNotes('');
    setTotalCost(0);
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

  if (loading) {
    return <Loading message="Loading project details..." />;
  }

  if (error && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-teal-600 hover:text-teal-500"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
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
          {/* Main Calculator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information Card */}
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
                      <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{project?.project_type}</dd>
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

            {/* Surface Measurements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Calculator className="h-6 w-6 mr-3 text-teal-800" />
                Surface Measurements
              </h2>

              <div className="space-y-6">
                {/* Walls */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Walls</h3>
                    <button
                      onClick={addWall}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wall
                    </button>
                  </div>

                  {surfaceMeasurements.walls.map((wall) => (
                    <div key={wall.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={wall.length}
                            onChange={(e) => updateWall(wall.id, 'length', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={wall.height}
                            onChange={(e) => updateWall(wall.id, 'height', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                          <input
                            type="text"
                            value={wall.area.toFixed(2)}
                            readOnly
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => removeWall(wall.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ceilings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Ceilings</h3>
                    <button
                      onClick={addCeiling}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ceiling
                    </button>
                  </div>

                  {surfaceMeasurements.ceilings.map((ceiling) => (
                    <div key={ceiling.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={ceiling.width}
                            onChange={(e) => updateCeiling(ceiling.id, 'width', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={ceiling.length}
                            onChange={(e) => updateCeiling(ceiling.id, 'length', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                          <input
                            type="text"
                            value={ceiling.area.toFixed(2)}
                            readOnly
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => removeCeiling(ceiling.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Other Surfaces */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Other Surfaces</h3>
                    <button
                      onClick={addOtherSurface}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Area
                    </button>
                  </div>

                  {surfaceMeasurements.otherSurfaces.map((surface) => (
                    <div key={surface.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={surface.description}
                            onChange={(e) => updateOtherSurface(surface.id, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Trim, Molding, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={surface.area}
                            onChange={(e) => updateOtherSurface(surface.id, 'area', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => removeOtherSurface(surface.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interior Work */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Home className="h-6 w-6 mr-3 text-teal-800" />
                Interior
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {['fixedWindows', 'turnWindows', 'doors', 'stairs', 'radiators', 'skirtingBoards'].map((type) => (
                  <button
                    key={type}
                    onClick={() => addInteriorItem(type)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                  >
                    {type === 'fixedWindows' && 'Fixed Windows'}
                    {type === 'turnWindows' && 'Turn Windows'}
                    {type === 'doors' && 'Doors'}
                    {type === 'stairs' && 'Stairs'}
                    {type === 'radiators' && 'Radiator'}
                    {type === 'skirtingBoards' && 'Skirting boards'}
                  </button>
                ))}
              </div>

              {Object.keys(interiorItems).map((type) => (
                interiorItems[type].length > 0 && (
                  <div key={type} className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                      {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </h4>
                    {interiorItems[type].map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInteriorItem(type, item.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder={`${type} description`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateInteriorItem(type, item.id, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (€)</label>
                            <input
                              type="text"
                              value={`€${(item.quantity * (pricing[type] || 0)).toFixed(2)}`}
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

            {/* Exterior Work */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building className="h-6 w-6 mr-3 text-teal-800" />
                Outside work
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {['fixedWindows', 'turnWindows', 'doors', 'dormerWindows', 'fasciaBoards', 'rainPipe'].map((type) => (
                  <button
                    key={type}
                    onClick={() => addExteriorItem(type)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                  >
                    {type === 'fixedWindows' && 'Fixed Windows'}
                    {type === 'turnWindows' && 'Turn Windows'}
                    {type === 'doors' && 'Doors'}
                    {type === 'dormerWindows' && 'Dormer windows'}
                    {type === 'fasciaBoards' && 'fascia boards'}
                    {type === 'rainPipe' && 'Rain pipe'}
                  </button>
                ))}
              </div>

              {Object.keys(exteriorItems).map((type) => (
                exteriorItems[type].length > 0 && (
                  <div key={type} className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                      {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </h4>
                    {exteriorItems[type].map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateExteriorItem(type, item.id, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder={`${type} description`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateExteriorItem(type, item.id, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (€)</label>
                            <input
                              type="text"
                              value={`€${(item.quantity * (pricing[type] || 0)).toFixed(2)}`}
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

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Enter your notes here"
              />
            </div>
          </div>

          {/* Cost Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Total Cost Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Total Cost:</h3>
                  <p className="text-4xl font-bold text-teal-800">€{totalCost.toFixed(2)}</p>

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
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wall surfaces:</span>
                        <span className="font-medium">
                          €{(surfaceMeasurements.walls.reduce((sum, wall) => sum + wall.area, 0) * pricing.wallPaint).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ceiling surfaces:</span>
                        <span className="font-medium">
                          €{(surfaceMeasurements.ceilings.reduce((sum, ceiling) => sum + ceiling.area, 0) * pricing.ceilingPaint).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preparation work:</span>
                        <span className="font-medium">
                          €{(
                            (surfaceMeasurements.walls.reduce((sum, wall) => sum + wall.area, 0) +
                              surfaceMeasurements.ceilings.reduce((sum, ceiling) => sum + ceiling.area, 0) +
                              surfaceMeasurements.otherSurfaces.reduce((sum, surface) => sum + surface.area, 0)) * pricing.preparation
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interior items:</span>
                        <span className="font-medium">
                          €{Object.keys(interiorItems).reduce((total, type) => {
                            return total + interiorItems[type].reduce((sum, item) => {
                              return sum + (item.quantity * (pricing[type] || 0));
                            }, 0);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exterior items:</span>
                        <span className="font-medium">
                          €{Object.keys(exteriorItems).reduce((total, type) => {
                            return total + exteriorItems[type].reduce((sum, item) => {
                              return sum + (item.quantity * (pricing[type] || 0));
                            }, 0);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={generateQuote}
                  disabled={generating || sendingEmail || totalCost === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Quote...
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

              {/* Project Info */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;







