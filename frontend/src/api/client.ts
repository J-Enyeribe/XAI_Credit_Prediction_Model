import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface PredictionResponse {
  prediction: string;
  probability: number;
  risk_score: number;
  explanation: Record<string, number>;
}

export interface GlobalImportanceResponse {
  global_importance: [string, number][];
}

export interface ModelInfoResponse {
  model_path: string;
  features: string[];
  status: string;
}

export const api = {
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  getModelInfo: async (): Promise<ModelInfoResponse> => {
    const response = await apiClient.get('/model-info');
    return response.data;
  },

  getGlobalImportance: async (): Promise<GlobalImportanceResponse> => {
    const response = await apiClient.get('/global-importance');
    return response.data;
  },

  predict: async (data: any): Promise<PredictionResponse> => {
    const response = await apiClient.post('/predict', data);
    return response.data;
  },
};

export default apiClient;
