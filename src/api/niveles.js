import api from './cliente';

export async function obtenerProgreso() {
    const respuesta = await api.get('/api/niveles');
    return respuesta.data;
}

export async function iniciarNivel(idNivel) {
    const respuesta = await api.post('/api/niveles/iniciar', { id_nivel: idNivel });
    return respuesta.data;
}

export async function completarNivel(idNivel) {
    const respuesta = await api.post('/api/niveles/completar', { id_nivel: idNivel });
    return respuesta.data;
}