// import axios from "axios";

// const api = axios.create({
//   baseURL: "/api", // Vite proxy → https://shiv-ganga-3.onrender.com
//   withCredentials: false,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default api;

import axios from "axios";
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// const api = axios.create({
//   baseURL: "/api", // Proxies to http://localhost:5000/api
//   withCredentials: false,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// Interceptor: Automatically adds the Token to every request
api.interceptors.request.use(
  (config) => {
    // Assuming you stored the login token as 'token' in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
