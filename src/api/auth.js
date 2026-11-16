import api from './cliente';

export async function login(email, password) {
    const respuesta = await api.post('/api/auth/login', {
        email: email,
        pass: password,
    });
    return respuesta.data;
}

export async function registrar(nombre, email, password) {
    const respuesta = await api.post('/api/auth/register', {
        nombre: nombre,
        email: email,
        pass: password,
    });
    return respuesta.data;
}

export async function obtenerPerfil() {
    const respuesta = await api.get('/api/auth/me');
    return respuesta.data;
}