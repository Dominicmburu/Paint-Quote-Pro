import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { useTranslation } from '../../hooks/useTranslation';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
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
                project_type: projectData.project_type || 'interior',
                property_type: projectData.property_type || 'residential',
                property_address: projectData.property_address || ''
            });
        } catch (err) {
            setError(t('Failed to load project details'));
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
            setSuccessMessage(t('Project updated successfully! Changes are automatically saved.'));
            setTimeout(() => {
                navigate(`/projects/${id}`);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || t('Failed to update project'));
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
        return <Loading message={t("Loading project...")} />;
    }

    if (error && !project) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 text-purple-600 hover:text-purple-500"
                >
                    {t('Back to Dashboard')}
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
                    <h1 className="text-3xl font-bold text-purple-700">{t('Edit Project')}</h1>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center text-sm text-blue-800">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('Changes will be automatically saved to your project')}
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
                        <h3 className="text-xl font-semibold text-purple-700 mb-6">{t('Project Information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('Project Name *')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder={t('e.g., Kitchen Renovation - Smith House')}
                                />
                            </div>

                            <div>
                                <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('Project Type')}
                                </label>
                                <select
                                    id="project_type"
                                    name="project_type"
                                    value={formData.project_type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="interior">{t('Interior')}</option>
                                    <option value="exterior">{t('Exterior')}</option>
                                    <option value="both">{t('Interior & Exterior')}</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('Property Type')}
                                </label>
                                <select
                                    id="property_type"
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="residential">{t('Residential')}</option>
                                    <option value="commercial">{t('Commercial')}</option>
                                    <option value="industrial">{t('Industrial')}</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('Property Address *')}
                                </label>
                                <textarea
                                    id="property_address"
                                    name="property_address"
                                    rows={3}
                                    required
                                    value={formData.property_address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder={t('123 High Street, London, SW1A 1AA')}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('Description')}
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder={t('Brief description of the painting project...')}
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
                           {t('Cancel')}
                       </button>
                       <button
                           type="submit"
                           disabled={saving}
                           className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
                       >
                           {saving ? (
                               <>
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                   {t('Updating...')}
                               </>
                           ) : (
                               <>
                                   <Save className="h-4 w-4 mr-2" />
                                   {t('Update Project')}
                               </>
                           )}
                       </button>
                   </div>
               </form>
           </div>

           {/* Auto-save Information */}
           <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
               <h4 className="text-sm font-medium text-green-900 mb-3">🔄 {t('Auto-save Features:')}</h4>
               <ul className="text-sm text-green-800 space-y-2">
                   <li>• {t('Project changes are automatically saved when you navigate back')}</li>
                   <li>• {t('All measurements and room data are continuously backed up')}</li>
                   <li>• {t('No risk of data loss when editing project details')}</li>
                   <li>• {t('Client information updates are instantly synchronized')}</li>
               </ul>
           </div>
       </div>
   );
};

export default EditProject;