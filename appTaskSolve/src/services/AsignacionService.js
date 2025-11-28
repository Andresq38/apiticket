import axios from 'axios';
import { getApiOrigin } from '../utils/apiBase';

const apiBase = getApiOrigin();
const BASE_URL = `${apiBase}/apiticket/asignacion`;

// Crear una instancia de axios con configuración específica
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  transformRequest: [function(data) {
    return JSON.stringify(data);
  }]
});

/**
 * AsignacionService - Servicio centralizado para asignación de tickets
 * 
 * Responsabilidades:
 * - Asignación automática (autotriage)
 * - Asignación manual con validaciones
 * - Consulta de asignaciones y técnicos disponibles
 * - Historial de asignaciones
 */
class AsignacionService {
  
  /**
   * Ejecutar asignación automática (autotriage)
   * Algoritmo: puntaje = (prioridad × 1000) - tiempoRestanteSLA
   * Asigna ticket al técnico con menor carga de trabajo en la especialidad
   * 
   * @returns {Promise<Object>} Resultado de la asignación con mensaje y ticket asignado
   */
  async asignarAutomatico() {
    const response = await axios.post(`${BASE_URL}/automatico`);
    return response.data;
  }

  /**
   * Asignar ticket manualmente a un técnico específico
   * Validaciones backend:
   * - Ticket debe estar en estado Pendiente
   * - Técnico debe tener especialidad requerida
   * - Usuario asignador se registra en auditoría
   * 
   * @param {Object} asignacionData
   * @param {number} asignacionData.id_ticket - ID del ticket a asignar
   * @param {number} asignacionData.id_tecnico - ID del técnico destino
   * @param {string} asignacionData.justificacion - Razón de asignación manual
   * @param {string} asignacionData.id_usuario_asigna - Usuario que realiza la asignación
   * @returns {Promise<Object>} Resultado de la asignación
   */
  async asignarManual(asignacionData) {
    try {
      const response = await axiosInstance.post('/manual', asignacionData);
      return response.data;
    } catch (error) {
      console.error('🔴 AsignacionService.asignarManual - Error:', error);
      // Si el backend devuelve un error con mensaje, extraerlo
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Obtener todos los tickets pendientes de asignación
   * @returns {Promise<Array>} Tickets en estado Pendiente con info completa
   */
  async getTicketsPendientes() {
    const response = await axios.get(`${BASE_URL}/pendientes`);
    return response.data;
  }

  /**
   * Obtener lista de técnicos con sus especialidades y carga de trabajo
   * @returns {Promise<Array>} Técnicos disponibles con info completa
   */
  async getTecnicosDisponibles() {
    const response = await axios.get(`${BASE_URL}/tecnicos`);
    return response.data;
  }

  /**
   * Obtener historial de asignaciones
   * @param {Object} filtros - Filtros opcionales
   * @param {number} filtros.id_ticket - Filtrar por ticket específico
   * @param {number} filtros.id_tecnico - Filtrar por técnico específico
   * @param {string} filtros.metodo - Filtrar por método ('Automatica' | 'Manual')
   * @returns {Promise<Array>} Historial de asignaciones con auditoría completa
   */
  async getHistorial(filtros = {}) {
    const response = await axios.get(`${BASE_URL}/historial`, { params: filtros });
    return response.data;
  }

  /**
   * Obtener asignación actual de un ticket
   * @param {number|string} idTicket - ID del ticket
   * @returns {Promise<Object>} Asignación actual o null
   */
  async getAsignacionActual(idTicket) {
    const response = await axios.get(`${BASE_URL}/ticket/${idTicket}`);
    return response.data;
  }

  /**
   * Obtener estadísticas de asignaciones
   * @returns {Promise<Object>} Stats de asignaciones automáticas vs manuales
   */
  async getEstadisticas() {
    const response = await axios.get(`${BASE_URL}/estadisticas`);
    return response.data;
  }

  /**
   * Reasignar ticket a otro técnico
   * NOTA: Debe primero verificar que el ticket esté Asignado
   * 
   * @param {Object} reasignacionData
   * @param {number} reasignacionData.id_ticket
   * @param {number} reasignacionData.id_tecnico_nuevo
   * @param {string} reasignacionData.justificacion
   * @param {string} reasignacionData.id_usuario_asigna
   * @returns {Promise<Object>} Resultado de la reasignación
   */
  async reasignar(reasignacionData) {
    // Usa el mismo endpoint de asignación manual
    // Backend maneja la actualización si ya existe asignación
    return this.asignarManual(reasignacionData);
  }
}

export default new AsignacionService();
