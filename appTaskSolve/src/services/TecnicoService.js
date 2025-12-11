import axios from 'axios';
import { getApiOrigin } from '../utils/apiBase';

// Base consistente con el resto de la app: http://localhost:81/apiticket/tecnico
const API = getApiOrigin();
const BASE_URL = `${API}/apiticket/tecnico`;

class TecnicoService {
  // Obtener todos los técnicos
  getTecnicos() {
    return axios.get(BASE_URL);
  }

  // Obtener un técnico por ID
  getTecnicoById(tecnicoId) {
    return axios.get(`${BASE_URL}/${tecnicoId}`);
  }

  // Crear un técnico con su usuario en transacción
  createTecnico(tecnicoData) {
    return axios.post(BASE_URL, tecnicoData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Actualizar un técnico
  updateTecnico(tecnicoData) {
    return axios.put(BASE_URL, tecnicoData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Toggle de disponibilidad
  toggleDisponibilidad(tecnicoId) {
    return axios.post(`${BASE_URL}/toggleDisponibilidad/${tecnicoId}`);
  }
}

export default new TecnicoService();
