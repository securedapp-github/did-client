/* Path :- did-client-frontend/src/utils/api.js */   

// why :-  Centralize API requests.

// Axios Instance
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",  
});



// Interceptors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        throw error;
    }
);

export default api;