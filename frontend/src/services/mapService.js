// services/mapService.js
import api from "./api";

export const mapService = {
  // Récupérer toutes les sections avec filtres
  getSections: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key] !== "tous") {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/api/map/sections?${params.toString()}`);
    return response.data;
  },

  // Récupérer une section spécifique
  getSection: async (id) => {
    const response = await api.get(`/api/map/sections/${id}`);
    return response.data;
  },

  // Récupérer les données géospatiales
  getGeoData: async (sectionId) => {
    const response = await api.get(`/api/map/sections/${sectionId}/geodata`);
    return response.data;
  },

  // Créer une nouvelle section
  createSection: async (sectionData) => {
    const response = await api.post("/api/map/sections", sectionData);
    return response.data;
  },

  // Mettre à jour une section
  updateSection: async (sectionId, data) => {
    const response = await api.put(`/api/map/sections/${sectionId}`, data);
    return response.data;
  },

  // Supprimer une section
  deleteSection: async (sectionId) => {
    const response = await api.delete(`/api/map/sections/${sectionId}`);
    return response.data;
  },

  // Récupérer les statistiques
  getStats: async () => {
    const response = await api.get("/api/map/stats");
    return response.data;
  },
};
