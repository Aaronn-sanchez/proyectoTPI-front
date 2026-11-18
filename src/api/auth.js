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

export async function actualizarNombre(nombre) {
    const respuesta = await api.patch('/api/auth/me', { nombre });
    return respuesta.data;
}

export async function eliminarCuenta() {
    const respuesta = await api.delete('/api/auth/me');
    return respuesta.data;
}