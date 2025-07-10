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
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        project_type: 'interior',
        property_type: 'residential'
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
            
            // Navigate to the new project details page
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
                                    Project Type
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
                                    Property Type
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

                    {/* Client Information */}
                    <div>
                        <h3 className="text-xl font-semibold text-purple-700 mb-6">Client Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Name
                                </label>
                                <input
                                    type="text"
                                    id="client_name"
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="John Smith"
                                />
                            </div>

                            <div>
                                <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Email
                                </label>
                                <input
                                    type="email"
                                    id="client_email"
                                    name="client_email"
                                    value={formData.client_email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Phone
                                </label>
                                <input
                                    type="tel"
                                    id="client_phone"
                                    name="client_phone"
                                    value={formData.client_phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="+44 123 456 7890"
                                />
                            </div>

                            <div>
                                <label htmlFor="client_address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Address
                                </label>
                                <textarea
                                    id="client_address"
                                    name="client_address"
                                    rows={3}
                                    value={formData.client_address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="123 High Street, London, SW1A 1AA"
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
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tips */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-sm font-medium text-blue-900 mb-3">💡 Tips for creating projects:</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Use descriptive names like "Kitchen Renovation - Smith House" for easy identification</li>
                    <li>• Include client contact information for easy communication</li>
                    <li>• Add a detailed description to help with accurate quoting later</li>
                    <li>• You can always edit project details after creation</li>
                    <li>• Upload floor plans and images after creating the project</li>
                </ul>
            </div>
        </div>
    );
};

export default CreateProject;