// Servicio de autenticación para login y gestión de JWT
const API_URL = '/usuario/login';

export async function login(usuario, password) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_usuario: usuario, password })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const token = await res.json();
    localStorage.setItem('jwt_token', token);
    return token;
}

export function logout() {
    localStorage.removeItem('jwt_token');
}

export function getToken() {
    return localStorage.getItem('jwt_token');
}

export async function getUser() {
    const token = getToken();
    if (!token) return null;
    const res = await fetch('/usuario/me', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) return null;
    return await res.json();
}
