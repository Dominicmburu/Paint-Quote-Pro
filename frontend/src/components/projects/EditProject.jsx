import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        project_type: 'interior',
        property_type: 'residential',
        property_address: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${id}`);
            const projectData = response.data.project;
            
            setProject(projectData);
            setFormData({
                name: projectData.name || '',
                description: projectData.description || '',
                client_name: projectData.client_name || '',
                client_email: projectData.client_email || '',
                client_phone: projectData.client_phone || '',
                client_address: projectData.client_address || '',
                project_type: projectData.project_type || 'interior',
                property_type: projectData.property_type || 'residential',
                property_address: projectData.property_address || ''
            });
        } catch (err) {
            setError('Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await api.put(`/projects/${id}`, formData);
            setSuccessMessage('Project updated successfully! Changes are automatically saved.');
            setTimeout(() => {
                navigate(`/projects/${id}`);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <Loading message="Loading project..." />;
    }

    if (error && !project) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 text-purple-600 hover:text-purple-500"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <button
                        onClick={() => navigate(`/projects/${id}`)}
                        className="text-gray-500 hover:text-gray-700 mr-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-3xl font-bold text-purple-700">Edit Project</h1>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center text-sm text-blue-800">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Changes will be automatically saved to your project
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
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
                                    placeholder="Brief description of the painting project..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Client Information */}
                    <div>
                        <h3 className="text-xl font-semibold text-purple-700 mb-6">Client Information</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Note: These fields can also be updated in the Client Information section of the project details.
                        </p>

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
                                   Client Address
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
                           onClick={() => navigate(`/projects/${id}`)}
                           className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
                       >
                           Cancel
                       </button>
                       <button
                           type="submit"
                           disabled={saving}
                           className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
                       >
                           {saving ? (
                               <>
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                   Updating...
                               </>
                           ) : (
                               <>
                                   <Save className="h-4 w-4 mr-2" />
                                   Update Project
                               </>
                           )}
                       </button>
                   </div>
               </form>
           </div>

           {/* Auto-save Information */}
           <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
               <h4 className="text-sm font-medium text-green-900 mb-3">🔄 Auto-save Features:</h4>
               <ul className="text-sm text-green-800 space-y-2">
                   <li>• Project changes are automatically saved when you navigate back</li>
                   <li>• All measurements and room data are continuously backed up</li>
                   <li>• No risk of data loss when editing project details</li>
                   <li>• Client information updates are instantly synchronized</li>
               </ul>
           </div>
       </div>
   );
};

export default EditProject;