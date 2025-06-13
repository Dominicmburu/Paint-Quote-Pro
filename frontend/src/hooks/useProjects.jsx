import { useState, useEffect } from 'react';
import api from '../services/api';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/projects', { params });
      setProjects(response.data.projects);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    try {
      setError(null);
      const response = await api.post('/projects', projectData);
      setProjects(prev => [response.data.project, ...prev]);
      return response.data.project;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      setError(null);
      const response = await api.put(`/projects/${projectId}`, projectData);
      setProjects(prev => 
        prev.map(p => p.id === projectId ? response.data.project : p)
      );
      return response.data.project;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setError(null);
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project');
      throw err;
    }
  };

  const getProject = async (projectId) => {
    try {
      setError(null);
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch project');
      throw err;
    }
  };

  const analyzeProject = async (projectId) => {
    try {
      setError(null);
      const response = await api.post(`/projects/${projectId}/analyze`);
      setProjects(prev => 
        prev.map(p => p.id === projectId ? response.data.project : p)
      );
      return response.data.project;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze project');
      throw err;
    }
  };

  const uploadFiles = async (projectId, files) => {
    try {
      setError(null);
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await api.post(`/projects/${projectId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? response.data.project : p)
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    analyzeProject,
    uploadFiles,
    setError
  };
};