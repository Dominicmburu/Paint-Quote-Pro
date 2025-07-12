// 5. Updated SpecialJobsSection.jsx - Remove Individual Cost Calculation
import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, Info, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';

const SpecialJobsSection = ({ specialJobs, setSpecialJobs, customPricing }) => {
  const { 
    pricing, 
    loading: pricingLoading, 
    error: pricingError, 
    refreshPricing 
  } = usePricing();

  const [selectedJobTypes, setSelectedJobTypes] = useState({});

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

  // Sync selectedJobTypes with specialJobs on mount and updates
  React.useEffect(() => {
    const selected = {};
    specialJobs.forEach(job => {
      selected[job.type] = true;
    });
    setSelectedJobTypes(selected);
  }, [specialJobs]);

  // REMOVED: Individual cost calculation - now handled by parent
  // const calculateTotalCost = (jobs) => { ... }

  const getPrice = (type) => {
    if (!pricing?.specialJobs?.special) {
      return 150.00; // Default fallback
    }
    return pricing.specialJobs.special[type]?.price || 150.00;
  };

  const addSpecialJob = (type) => {
    const jobData = specialJobTypes[type];
    const price = getPrice(type);

    const newJob = {
      id: Date.now(),
      type,
      name: jobData.name,
      description: '',
      quantity: 1,
      unitPrice: price,
      total: price,
      steps: jobData.steps
    };

    const updatedJobs = [...specialJobs, newJob];
    setSpecialJobs(updatedJobs);
    setSelectedJobTypes(prev => ({ ...prev, [type]: true }));
  };

  const updateSpecialJob = (id, field, value) => {
    const updatedJobs = specialJobs.map(job => {
      if (job.id === id) {
        const updated = { ...job, [field]: value };
        if (field === 'unitPrice' || field === 'quantity') {
          const unitPrice = parseFloat(field === 'unitPrice' ? value : updated.unitPrice) || 0;
          const quantity = parseFloat(field === 'quantity' ? value : updated.quantity) || 1;
          updated.total = unitPrice * quantity;
        }
        return updated;
      }
      return job;
    });
    setSpecialJobs(updatedJobs);
  };

  const removeSpecialJob = (id) => {
    const jobToRemove = specialJobs.find(job => job.id === id);
    const updatedJobs = specialJobs.filter(job => job.id !== id);
    setSpecialJobs(updatedJobs);
    setSelectedJobTypes(prev => ({ ...prev, [jobToRemove.type]: false }));
  };

  const toggleJobSelection = (type) => {
    if (selectedJobTypes[type]) {
      // Remove all jobs of this type
      const updatedJobs = specialJobs.filter(job => job.type !== type);
      setSpecialJobs(updatedJobs);
      setSelectedJobTypes(prev => ({ ...prev, [type]: false }));
    } else {
      addSpecialJob(type);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertTriangle className="h-6 w-6 mr-3 text-orange-600" />
          Special Jobs & Conditions
        </h2>
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center">
          <CheckCircle className="h-4 w-4 mr-1" />
          Real-time calculation
        </div>
      </div>

      {/* Pricing Display */}
      {pricing && !pricingLoading && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Current Special Job Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {Object.entries(specialJobTypes).map(([type, data]) => (
            <div
              key={type}
              className={`p-4 rounded-lg text-sm font-medium transition-colors border text-orange-700 hover:bg-orange-100 hover:border-orange-300 text-left cursor-pointer ${
                selectedJobTypes[type] ? 'bg-orange-100 border-orange-400 border-2' : 'bg-orange-50 border-orange-200'
              }`}
              onClick={() => toggleJobSelection(type)}
            >
              <div className="flex items-center mb-1">
                {selectedJobTypes[type] ? (
                  <CheckSquare className="h-4 w-4 mr-2 text-orange-600" />
                ) : (
                  <Square className="h-4 w-4 mr-2 text-orange-600" />
                )}
                <div className="font-medium">{data.name}</div>
              </div>
              <div className="text-xs text-orange-600">£{getPrice(type).toFixed(2)} per unit</div>
            </div>
          ))}
        </div>
      </div>
      )}


      {specialJobs.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Added Special Jobs</h3>
          {specialJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">{job.name}</h4>
                <button
                  onClick={() => removeSpecialJob(job.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Remove Job"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Job Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={job.description || ''}
                    onChange={(e) => updateSpecialJob(job.id, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Specific details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={job.quantity || 1}
                    onChange={(e) => updateSpecialJob(job.id, 'quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={job.unitPrice || ''}
                    onChange={(e) => updateSpecialJob(job.id, 'unitPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={getPrice(job.type).toFixed(2)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Total (£)</label>
                  <input
                    type="text"
                    value={`£${((parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0)).toFixed(2)}`}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
              </div>

              {/* Process Steps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-gray-600" />
                  Process Steps for {job.name}
                </h5>
                <ol className="text-sm text-gray-700 space-y-1">
                  {job.steps.map((step, index) => (
                    <li key={index} className="flex">
                      <span className="font-medium mr-2">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Individual Job Cost */}
              <div className="mt-4 flex justify-end">
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-orange-900">
                    Job Total: £{((parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Total Special Jobs Cost */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-orange-900">Special Jobs Total:</span>
              <span className="text-xl font-bold text-orange-900">
                £{specialJobs.reduce((sum, job) => sum + ((parseFloat(job.quantity) || 1) * (parseFloat(job.unitPrice) || 0)), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {specialJobs.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No special jobs added</h3>
          <p className="text-gray-500 mb-6">
            Add special conditions as needed for this project. Total price updates automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpecialJobsSection;