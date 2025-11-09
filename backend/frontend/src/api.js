import axios from "axios";

// Determine the base URL based on the environment
const getBaseURL = () => {
  // If we're in development, use the proxy
  if (process.env.NODE_ENV === "development") {
    return "";
  }
  
  // For production, you can set the backend URL via an environment variable
  // or default to relative paths if the frontend and backend are on the same domain
  return process.env.REACT_APP_BACKEND_URL || "";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Add a request interceptor to log requests
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;