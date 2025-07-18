import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';

const CreateProject = () => {
    const navigate = useNavigate();
    const { user, company } = useAuth();
    const { subscription, canCreateProject, getProjectsRemaining } = useSubscription();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        project_type: 'interior',
        property_type: 'residential',
        property_address: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!canCreateProject()) {
            setError('You have reached your project limit for this month. Please upgrade your plan.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/projects', formData);
            
            // Navigate to the project details page to continue setup
            navigate(`/projects/${response.data.project.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-500 hover:text-gray-700 mr-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-3xl font-bold text-purple-700">Create New Project</h1>
                </div>

                {/* Subscription Warning */}
                {!canCreateProject() && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800">
                                    Project Limit Reached
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    You've used all {subscription?.max_projects} projects for this month. 
                                    Upgrade your plan to create more projects.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Remaining */}
                {canCreateProject() && subscription?.max_projects > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">{getProjectsRemaining()}</span> projects remaining this month
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Project Information */}
                    <div>
                        <h3 className="text-xl font-semibold text-purple-700 mb-6">Project Information</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Start by entering basic project details. You'll add client information and other details on the next step.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Kitchen Renovation - Smith House"
                                />
                            </div>

                            <div>
                                <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Type *
                                </label>
                                <select
                                    id="project_type"
                                    name="project_type"
                                    value={formData.project_type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="interior">Interior</option>
                                    <option value="exterior">Exterior</option>
                                    <option value="both">Interior & Exterior</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Type *
                                </label>
                                <select
                                    id="property_type"
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="industrial">Industrial</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Address *
                                </label>
                                <textarea
                                    id="property_address"
                                    name="property_address"
                                    rows={3}
                                    required
                                    value={formData.property_address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="123 High Street, London, SW1A 1AA"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Brief description of the painting project, rooms involved, special requirements, etc."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !canCreateProject()}
                            className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Project & Continue
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Next Steps */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-sm font-medium text-blue-900 mb-3">📋 What happens next:</h4>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Create your project with basic information</li>
                    <li>Add client information and contact details</li>
                    <li>Upload floor plans and images</li>
                    <li>Run AI analysis or add measurements manually</li>
                    <li>Generate and send quotes to clients</li>
                </ol>
            </div>
        </div>
    );
};

export default CreateProject;