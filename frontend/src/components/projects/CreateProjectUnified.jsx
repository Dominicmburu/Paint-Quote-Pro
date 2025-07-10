import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, ArrowLeft, Upload, Play, FileText, Calculator,
  CheckCircle, AlertCircle, RefreshCw, Brain, Users,
  Home, Building, DollarSign, Settings, X, Mail
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';
import ErrorBoundary from '../common/ErrorBoundary';
import ClientSelector from '../clients/ClientSelector';
import ClientForm from '../clients/ClientForm';
import ProjectInfoForm from './ProjectInfoForm';
import FloorPlanUpload from './FloorPlanUpload';
import RoomMeasurements from './RoomMeasurements';
import InteriorWork from './InteriorWork';
import ExteriorWork from './ExteriorWork';
import SpecialJobsSection from './SpecialJobsSection';
import Loading from '../common/Loading';

const CreateProjectUnified = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { subscription, canCreateProject, getProjectsRemaining } = useSubscription();

  // Project state
  const [project, setProject] = useState(null);

  // Form data states with initial values from localStorage
  const [projectData, setProjectData] = useState(() => {
    const saved = localStorage.getItem('projectData');
    return saved ? JSON.parse(saved) : {
      name: '',
      description: '',
      project_type: 'interior',
      property_type: 'residential',
      property_address: '',
      postcode: '',
      city: ''
    };
  });

  const [clientData, setClientData] = useState(() => {
    const saved = localStorage.getItem('clientData');
    return saved ? JSON.parse(saved) : {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      postcode: '',
      city: '',
      btw_number: '',
      kvk_number: '',
      iban: '',
      website: ''
    };
  });

  const [selectedClient, setSelectedClient] = useState(() => {
    const saved = localStorage.getItem('selectedClient');
    return saved ? JSON.parse(saved) : null;
  });

  const [showClientForm, setShowClientForm] = useState(() => {
    const saved = localStorage.getItem('showClientForm');
    return saved ? JSON.parse(saved) : true;
  });

  const [uploadedImages, setUploadedImages] = useState(() => {
    const saved = localStorage.getItem('uploadedImages');
    return saved ? JSON.parse(saved) : [];
  });

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('rooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [interiorItems, setInteriorItems] = useState(() => {
    const saved = localStorage.getItem('interiorItems');
    return saved ? JSON.parse(saved) : {
      doors: [], fixedWindows: [], turnWindows: [], stairs: [],
      radiators: [], skirtingBoards: [], otherItems: []
    };
  });

  const [exteriorItems, setExteriorItems] = useState(() => {
    const saved = localStorage.getItem('exteriorItems');
    return saved ? JSON.parse(saved) : {
      doors: [], fixedWindows: [], turnWindows: [], dormerWindows: [],
      fasciaBoards: [], rainPipe: [], otherItems: []
    };
  });

  const [specialJobs, setSpecialJobs] = useState(() => {
    const saved = localStorage.getItem('specialJobs');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : '';
  });

  const [totalCost, setTotalCost] = useState(() => {
    const saved = localStorage.getItem('totalCost');
    return saved ? parseFloat(saved) : 0;
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Error and validation
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pricing settings
  const [customPricing, setCustomPricing] = useState(null);
  const [pricingError, setPricingError] = useState(null);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('projectData', JSON.stringify(projectData));
  }, [projectData]);

  useEffect(() => {
    localStorage.setItem('clientData', JSON.stringify(clientData));
  }, [clientData]);

  useEffect(() => {
    localStorage.setItem('selectedClient', JSON.stringify(selectedClient));
  }, [selectedClient]);

  useEffect(() => {
    localStorage.setItem('showClientForm', JSON.stringify(showClientForm));
  }, [showClientForm]);

  useEffect(() => {
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  useEffect(() => {
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('interiorItems', JSON.stringify(interiorItems));
  }, [interiorItems]);

  useEffect(() => {
    localStorage.setItem('exteriorItems', JSON.stringify(exteriorItems));
  }, [exteriorItems]);

  useEffect(() => {
    localStorage.setItem('specialJobs', JSON.stringify(specialJobs));
  }, [specialJobs]);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('totalCost', totalCost.toString());
  }, [totalCost]);

  // Clear localStorage on save
  const clearLocalStorage = () => {
    localStorage.removeItem('projectData');
    localStorage.removeItem('clientData');
    localStorage.removeItem('selectedClient');
    localStorage.removeItem('showClientForm');
    localStorage.removeItem('uploadedImages');
    localStorage.removeItem('rooms');
    localStorage.removeItem('interiorItems');
    localStorage.removeItem('exteriorItems');
    localStorage.removeItem('specialJobs');
    localStorage.removeItem('notes');
    localStorage.removeItem('totalCost');

    // Reset state
    setProjectData({
      name: '',
      description: '',
      project_type: 'interior',
      property_type: 'residential',
      property_address: '',
      postcode: '',
      city: ''
    });
    setClientData({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      postcode: '',
      city: '',
      btw_number: '',
      kvk_number: '',
      iban: '',
      website: ''
    });
    setSelectedClient(null);
    setShowClientForm(true);
    setUploadedImages([]);
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

  // Load custom pricing settings
  useEffect(() => {
    loadPricingSettings();
  }, []);

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

  // Validation functions
  const validateProjectData = () => {
    const newErrors = {};
    if (!projectData.name.trim()) newErrors.name = 'Project name is required';
    if (!projectData.property_address.trim()) newErrors.property_address = 'Property address is required';
    return newErrors;
  };

  const validateClientData = () => {
    const newErrors = {};
    if (!clientData.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!clientData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(clientData.email)) newErrors.email = 'Email is invalid';
    return newErrors;
  };

  // Handler functions
  const handleProjectDataChange = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleClientDataChange = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientData({
      company_name: client.company_name || '',
      contact_name: client.contact_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      postcode: client.postcode || '',
      city: client.city || '',
      btw_number: client.btw_number || '',
      kvk_number: client.kvk_number || '',
      iban: client.iban || '',
      website: client.website || ''
    });
    setShowClientForm(false);
  };

  const toggleClientForm = () => {
    setShowClientForm(!showClientForm);
    if (!showClientForm) {
      setSelectedClient(null);
      setClientData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
        city: '',
        btw_number: '',
        kvk_number: '',
        iban: '',
        website: ''
      });
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const saveProject = async () => {
    if (!canCreateProject()) {
      setError('You have reached your project limit for this month. Please upgrade your plan.');
      return;
    }

    const projectErrors = validateProjectData();
    const clientErrors = validateClientData();
    const allErrors = { ...projectErrors, ...clientErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSaving(true);
    setError('');

    try {
      let clientId = selectedClient?.id;
      if (!clientId) {
        const clientResponse = await api.post('/clients', clientData);
        clientId = clientResponse.data.client.id;
      }

      const projectPayload = {
        ...projectData,
        client_id: clientId,
        client_name: clientData.company_name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        client_address: `${clientData.address}, ${clientData.postcode} ${clientData.city}`.trim()
      };

      const response = await api.post('/projects', projectPayload);
      setProject(response.data.project);
      showSuccessMessage('Project saved successfully! You can now continue with measurements and analysis.');
      clearLocalStorage();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const saveMeasurements = async () => {
    if (!project) {
      setError('Please save the project first');
      return;
    }

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

      await api.post(`/projects/${project.id}/manual-measurements`, measurementData);

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

  const handleFileUpload = async (files) => {
    if (!project) {
      setError('Please save the project first');
      return;
    }

    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post(`/projects/${project.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadedImages(response.data.uploaded_files || []);
      showSuccessMessage('Floor plans uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const performAIAnalysis = async () => {
    if (!project) {
      setError('Please save the project first');
      return;
    }

    if (uploadedImages.length === 0) {
      setError('Please upload floor plan images first');
      return;
    }

    // Confirm if there's existing data
    const hasExistingData =
      rooms.length > 0 ||
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
      const response = await api.post(`/projects/${project.id}/analyze`);

      // Update project state
      setProject(prev => ({
        ...prev,
        floor_plan_analysis: response.data.analysis,
        status: 'ready'
      }));

      // Process new AI analysis and OVERWRITE existing data
      if (response.data.analysis?.structured_measurements) {
        const measurements = response.data.analysis.structured_measurements;

        console.log('🔄 AI Analysis: Overwriting existing data with fresh analysis');

        // Clear and set new rooms
        const mappedRooms = measurements.rooms?.map(aiRoom => ({
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
          ceiling: aiRoom.ceiling
            ? {
                length: parseFloat(aiRoom.ceiling.length) || 0,
                width: parseFloat(aiRoom.ceiling.width) || 0,
                area: parseFloat(aiRoom.ceiling.area) || 0,
                sanding_filling: false,
                priming: false,
                one_coat: false,
                two_coats: false
              }
            : null,
          other_surfaces: null
        })) || [];

        // OVERWRITE all data
        setRooms(mappedRooms);
        setInteriorItems({
          doors: [],
          fixedWindows: [],
          turnWindows: [],
          stairs: [],
          radiators: [],
          skirtingBoards: [],
          otherItems: []
        });
        setExteriorItems({
          doors: [],
          fixedWindows: [],
          turnWindows: [],
          dormerWindows: [],
          fasciaBoards: [],
          rainPipe: [],
          otherItems: []
        });
        setSpecialJobs([]);
        setTotalCost(0);

        // Update notes
        if (measurements.notes) {
          setNotes(measurements.notes);
        }

        const totalWalls = mappedRooms.reduce((sum, room) => sum + (room.walls?.length || 0), 0);
        const totalWallArea = mappedRooms.reduce(
          (sum, room) =>
            sum + (room.walls || []).reduce((wallSum, wall) => wallSum + (parseFloat(wall.area) || 0), 0),
          0
        );
        const totalCeilingArea = mappedRooms.reduce(
          (sum, room) => sum + (room.ceiling ? parseFloat(room.ceiling.area) || 0 : 0),
          0
        );

        showSuccessMessage(
          `🔄 AI analysis completed! Detected ${mappedRooms.length} rooms with ${totalWalls} walls. ` +
          `Wall area: ${totalWallArea.toFixed(1)}m², ceiling area: ${totalCeilingArea.toFixed(1)}m²`
        );
      } else {
        showSuccessMessage('AI analysis completed but no room data was returned.');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.details || err.response?.data?.error || err.message || 'AI analysis failed';
      setError(`AI analysis failed: ${errorMessage}`);
      console.error('AI Analysis Error:', errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateQuoteAndEmail = async () => {
    if (!project) {
      setError('Please save the project first');
      return;
    }

    if (!clientData.email) {
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

      const quoteResponse = await api.post(`/projects/${project.id}/quote`, {
        rooms,
        interiorItems,
        exteriorItems,
        specialJobs,
        notes,
        totalCost,
        customPricing
      });

      await api.post(`/projects/${project.id}/email-quote`, {
        client_email: clientData.email,
        project_name: projectData.name,
        total_cost: totalCost,
        quote_id: quoteResponse.data.quote_id
      });

      navigate(`/projects/${project.id}/quote`, {
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

  const handleClearForm = () => {
    clearLocalStorage();
    setError('');
    showSuccessMessage('Form cleared successfully!');
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <Loading message="Loading project creator..." />;
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
                <h1 className="text-2xl font-bold">Create New Project</h1>
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

            {subscription && (
              <div className="text-sm text-gray-200">
                {getProjectsRemaining()} projects remaining. For pricing details, visit{' '}
                <a href="https://x.ai/grok" target="_blank" rel="noopener noreferrer" className="underline">
                  x.ai/grok
                </a>.
              </div>
            )}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-3 text-teal-800" />
                    1. Project & Client Information
                  </h2>
                  <button
                    onClick={handleClearForm}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Form
                  </button>
                </div>

                <div className="space-y-8">
                  <ProjectInfoForm
                    projectData={projectData}
                    onChange={handleProjectDataChange}
                    errors={errors}
                  />

                  <hr className="border-gray-200" />

                  <ClientSelector
                    selectedClient={selectedClient}
                    onClientSelect={handleClientSelect}
                    onClientChange={toggleClientForm}
                    showClientForm={showClientForm}
                  />

                  {showClientForm && (
                    <div className="mt-6">
                      <ClientForm
                        clientData={clientData}
                        onChange={handleClientDataChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  <div className="flex justify-center pt-6">
                    <button
                      onClick={saveProject}
                      disabled={saving || !canCreateProject()}
                      className="inline-flex items-center px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-lg"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Saving Project...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Project & Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section id="floor-plan-section" className="scroll-mt-24">
              <ErrorBoundary>
                {project ? (
                  <FloorPlanUpload
                    projectId={project.id}
                    uploadedImages={uploadedImages}
                    onFileUpload={handleFileUpload}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    hasExistingData={
                      rooms.length > 0 ||
                      Object.values(interiorItems).some(items => items.length > 0) ||
                      Object.values(exteriorItems).some(items => items.length > 0) ||
                      specialJobs.length > 0
                    }
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center py-12">
                    <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Project Required</h3>
                    <p className="text-gray-500">Please save your project information first to upload floor plans.</p>
                  </div>
                )}
                {project?.uploadedImages && uploadedImages.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                      <button
                        onClick={performAIAnalysis}
                        disabled={analyzing || uploadedImages.length === 0}
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
                    3. Measurements & Work Items
                    {!project && <span className="text-sm text-gray-500 ml-3">(Save project first)</span>}
                  </h2>

                  {project ? (
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
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Project Required</h3>
                      <p className="text-gray-500">Please save your project information first to add measurements.</p>
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
                  <div
                    className={`flex items-center p-2 rounded-md ${
                      project ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <CheckCircle
                      className={`h-4 w-4 mr-3 ${project ? 'text-green-600' : 'text-gray-400'}`}
                    />
                    <span
                      className={`text-sm font-medium ${project ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      Project Saved
                    </span>
                  </div>

                  <div
                    className={`flex items-center p-2 rounded-md ${
                      uploadedImages.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <Upload
                      className={`h-4 w-4 mr-3 ${
                        uploadedImages.length > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        uploadedImages.length > 0 ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      Floor Plans ({uploadedImages.length})
                    </span>
                  </div>

                  <div
                    className={`flex items-center p-2 rounded-md ${
                      rooms.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <Calculator
                      className={`h-4 w-4 mr-3 ${rooms.length > 0 ? 'text-green-600' : 'text-gray-400'}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        rooms.length > 0 ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
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
                  <div>
                    Interior Items:{' '}
                    {Object.values(interiorItems).reduce((sum, items) => sum + items.length, 0)}
                  </div>
                  <div>
                    Exterior Items:{' '}
                    {Object.values(exteriorItems).reduce((sum, items) => sum + items.length, 0)}
                  </div>
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
                  onClick={handleClearForm}
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
                    <div>Client: {clientData.company_name}</div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Tips</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p>• Fill all project details completely</p>
                  <p>• Save project before uploading files</p>
                  <p>• Use AI analysis for faster setup</p>
                  <p>• Add special jobs for complex work</p>
                  <p>• Review measurements before generating quote</p>
                  <p>• Save progress frequently</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectUnified;