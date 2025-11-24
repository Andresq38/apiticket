import axios from 'axios';
import { getApiOrigin } from '../utils/apiBase';

const apiBase = getApiOrigin();
const BASE_URL = `${apiBase}/apiticket/ticket`;

/**
 * TicketService - Servicio centralizado para operaciones de tickets
 * 
 * Responsabilidades:
 * - CRUD de tickets
 * - Cambios de estado (con y sin imágenes)
 * - Consultas de tickets completos
 * - Prioridades y estados disponibles
 */
class TicketService {
  
  /**
   * Obtener todos los tickets con información completa
   * @param {Object} params - Parámetros de filtrado opcionales
   * @returns {Promise<Array>} Lista de tickets
   */
  async getAll(params = {}) {
    const response = await axios.get(`${BASE_URL}/getTicketsCompletos`, { params });
    return response.data;
  }

  /**
   * Obtener ticket por ID con información completa
   * @param {number|string} id - ID del ticket
   * @returns {Promise<Object>} Ticket completo
   */
  async getById(id) {
    const response = await axios.get(`${BASE_URL}/getTicketCompletoById/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo ticket
   * @param {Object} ticketData - Datos del ticket
   * @param {string} ticketData.titulo
   * @param {string} ticketData.descripcion
   * @param {number} ticketData.id_categoria
   * @param {number} ticketData.id_etiqueta
   * @param {number} ticketData.prioridad
   * @param {string} ticketData.id_usuario_reporta
   * @returns {Promise<Object>} Ticket creado
   */
  async create(ticketData) {
    const response = await axios.post(BASE_URL, ticketData);
    return response.data;
  }

  /**
   * Actualizar ticket existente
   * @param {Object} ticketData - Datos del ticket incluyendo id_ticket
   * @returns {Promise<Object>} Ticket actualizado
   */
  async update(ticketData) {
    const response = await axios.put(BASE_URL, ticketData);
    return response.data;
  }

  /**
   * Eliminar ticket
   * @param {number|string} id - ID del ticket
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async delete(id) {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Cambiar estado de ticket sin imágenes
   * NOTA: Backend requiere imágenes para casi todas las transiciones
   * Solo usar para transición Pendiente → Asignado (autotriage)
   * 
   * @param {Object} cambioData
   * @param {number} cambioData.id_ticket
   * @param {number} cambioData.id_estado_nuevo
   * @param {string} cambioData.observaciones
   * @returns {Promise<Object>} Resultado del cambio
   */
  async cambiarEstado(cambioData) {
    const response = await axios.post(`${BASE_URL}/cambiarEstado`, cambioData);
    return response.data;
  }

  /**
   * Cambiar estado de ticket CON imágenes (endpoint recomendado)
   * Backend valida que se incluyan imágenes obligatorias
   * 
   * @param {FormData} formData - Debe contener:
   *   - id_ticket
   *   - id_estado_nuevo
   *   - observaciones
   *   - imagenes[] (archivos)
   * @returns {Promise<Object>} Resultado del cambio con URLs de imágenes
   */
  async cambiarEstadoConImagen(formData) {
    const response = await axios.post(`${BASE_URL}/cambiarEstadoConImagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Obtener prioridades disponibles
   * @returns {Promise<Array>} Lista de prioridades (1-5)
   */
  async getPrioridades() {
    const response = await axios.get(`${apiBase}/ticket/prioridades`);
    return response.data;
  }

  /**
   * Obtener estados disponibles
   * @returns {Promise<Array>} Lista de estados (Pendiente, Asignado, etc.)
   */
  async getEstados() {
    const response = await axios.get(`${apiBase}/apiticket/estado`);
    return response.data;
  }

  /**
   * Obtener tickets por técnico
   * @param {string} idTecnico - ID del técnico
   * @returns {Promise<Array>} Tickets asignados al técnico
   */
  async getByTecnico(idTecnico) {
    const response = await axios.get(`${BASE_URL}/porTecnico/${idTecnico}`);
    return response.data;
  }

  /**
   * Obtener tickets por cliente
   * @param {string} idUsuario - ID del usuario cliente
   * @returns {Promise<Array>} Tickets creados por el cliente
   */
  async getByCliente(idUsuario) {
    const response = await axios.get(`${BASE_URL}/porCliente/${idUsuario}`);
    return response.data;
  }

  /**
   * Obtener tickets pendientes de asignación
   * @returns {Promise<Array>} Tickets en estado Pendiente
   */
  async getPendientes() {
    const response = await axios.get(`${BASE_URL}/pendientes`);
    return response.data;
  }
}

export default new TicketService();
