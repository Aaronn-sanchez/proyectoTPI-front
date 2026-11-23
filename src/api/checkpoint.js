import api from './cliente';

export async function listarGuardados(idNivel) {
    const r = await api.get('/api/checkpoints', { params: { nivel: idNivel } });
    return r.data; // { guardados, max, disponibles }
}

export async function crearGuardado(datos) {
    const r = await api.post('/api/checkpoints', datos);
    return r.data;
}

export async function reescribirGuardado(id, datos) {
    const r = await api.put(`/api/checkpoints/${id}`, datos);
    return r.data;
}

export async function borrarGuardado(id) {
    const r = await api.delete(`/api/checkpoints/${id}`);
    return r.data;
}