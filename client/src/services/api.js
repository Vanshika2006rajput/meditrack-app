
import axios from "axios";

const api = axios.create({
  baseURL: "https://meditrack-app-rcyv.onrender.com/api",
  withCredentials: true
});

export default api;