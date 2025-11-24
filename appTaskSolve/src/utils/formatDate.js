export function formatDate(date) {
  try {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return ''; }
}

export function formatTime(date) {
  try {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ''; }
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`.trim();
}

export function formatRelative(date) {
  try {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace segundos';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return diffD === 1 ? 'Ayer' : `Hace ${diffD} días`;
  } catch { return ''; }
}
