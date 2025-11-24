import axios from 'axios';
import { getApiOrigin } from '../utils/apiBase';

const apiBase = getApiOrigin();
const BASE_URL = `${apiBase}/apiticket/notificacion`;

/**
 * NotificacionService - Servicio centralizado para notificaciones
 * 
 * Responsabilidades:
 * - Consulta de notificaciones no leídas
 * - Marcar notificaciones como leídas
 * - Historial completo de notificaciones
 * - Integración con SSE (EventSource manejado en componentes)
 */
class NotificacionService {
  
  /**
   * Obtener todas las notificaciones de un usuario
   * @param {string} idUsuario - ID del usuario
   * @returns {Promise<Array>} Todas las notificaciones (leídas y no leídas)
   */
  async getAll(idUsuario) {
    const response = await axios.get(`${BASE_URL}/porUsuario/${idUsuario}`);
    return response.data;
  }

  /**
   * Obtener solo notificaciones no leídas de un usuario
   * @param {string} idUsuario - ID del usuario
   * @returns {Promise<Array>} Notificaciones con estado='No Leida'
   */
  async getNoLeidas(idUsuario) {
    const response = await axios.get(`${BASE_URL}/noLeidas/${idUsuario}`);
    return response.data;
  }

  /**
   * Contar notificaciones no leídas (para badge)
   * @param {string} idUsuario - ID del usuario
   * @returns {Promise<number>} Cantidad de notificaciones no leídas
   */
  async contarNoLeidas(idUsuario) {
    const response = await axios.get(`${BASE_URL}/contarNoLeidas/${idUsuario}`);
    return response.data?.count || 0;
  }

  /**
   * Marcar notificación específica como leída
   * Backend valida que solo el propietario pueda marcar su notificación
   * 
   * @param {number|string} idNotificacion - ID de la notificación
   * @param {string} idUsuario - ID del usuario (validación de permisos)
   * @returns {Promise<Object>} Resultado de la operación
   */
  async marcarComoLeida(idNotificacion, idUsuario) {
    const response = await axios.put(`${BASE_URL}/marcarLeida/${idNotificacion}`, {
      id_usuario: idUsuario
    });
    return response.data;
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   * @param {string} idUsuario - ID del usuario
   * @returns {Promise<Object>} Resultado con cantidad de notificaciones actualizadas
   */
  async marcarTodasLeidas(idUsuario) {
    const response = await axios.post(`${BASE_URL}/marcarTodasLeidas`, {
      id_usuario: idUsuario
    });
    return response.data;
  }

  /**
   * Crear notificación manualmente (uso interno/admin)
   * @param {Object} notificacionData
   * @param {string} notificacionData.id_usuario - Usuario destinatario
   * @param {string} notificacionData.tipo_evento - Tipo de notificación
   * @param {string} notificacionData.mensaje - Contenido de la notificación
   * @param {string} [notificacionData.id_remitente] - Usuario que envía (opcional)
   * @returns {Promise<Object>} Notificación creada
   */
  async crear(notificacionData) {
    const response = await axios.post(BASE_URL, notificacionData);
    return response.data;
  }

  /**
   * Eliminar notificación
   * @param {number|string} idNotificacion - ID de la notificación
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async eliminar(idNotificacion) {
    const response = await axios.delete(`${BASE_URL}/${idNotificacion}`);
    return response.data;
  }

  /**
   * Obtener notificación específica por ID
   * @param {number|string} idNotificacion - ID de la notificación
   * @returns {Promise<Object>} Notificación completa
   */
  async getById(idNotificacion) {
    const response = await axios.get(`${BASE_URL}/${idNotificacion}`);
    return response.data;
  }

  /**
   * Obtener historial de notificaciones con filtros
   * @param {string} idUsuario - ID del usuario
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.tipo_evento - Filtrar por tipo
   * @param {string} filtros.estado - Filtrar por estado ('Leida' | 'No Leida')
   * @param {string} filtros.fecha_desde - Fecha desde (YYYY-MM-DD)
   * @param {string} filtros.fecha_hasta - Fecha hasta (YYYY-MM-DD)
   * @returns {Promise<Array>} Notificaciones filtradas
   */
  async getHistorial(idUsuario, filtros = {}) {
    // Si el backend no tiene endpoint específico de historial con filtros,
    // obtener todas y filtrar en frontend
    const notificaciones = await this.getAll(idUsuario);
    
    let resultado = notificaciones;

    if (filtros.tipo_evento) {
      resultado = resultado.filter(n => n.tipo_evento === filtros.tipo_evento);
    }

    if (filtros.estado) {
      resultado = resultado.filter(n => n.estado === filtros.estado);
    }

    if (filtros.fecha_desde) {
      resultado = resultado.filter(n => new Date(n.fecha_hora) >= new Date(filtros.fecha_desde));
    }

    if (filtros.fecha_hasta) {
      resultado = resultado.filter(n => new Date(n.fecha_hora) <= new Date(filtros.fecha_hasta));
    }

    return resultado;
  }

  /**
   * Obtener estadísticas de notificaciones del usuario
   * @param {string} idUsuario - ID del usuario
   * @returns {Promise<Object>} Estadísticas (total, leídas, no leídas, por tipo)
   */
  async getEstadisticas(idUsuario) {
    const notificaciones = await this.getAll(idUsuario);
    
    const stats = {
      total: notificaciones.length,
      leidas: notificaciones.filter(n => n.estado === 'Leida').length,
      noLeidas: notificaciones.filter(n => n.estado === 'No Leida').length,
      porTipo: {}
    };

    notificaciones.forEach(n => {
      const tipo = n.tipo_evento || 'Sin tipo';
      stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
    });

    return stats;
  }
}

export default new NotificacionService();
