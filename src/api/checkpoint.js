import api from './cliente';

export async function listarGuardados(idNivel) {
    const r = await api.get('/api/checkpoint', { params: { nivel: idNivel } });
    return r.data; // { guardados, max, disponibles }
}

export async function crearGuardado(datos) {
    const r = await api.post('/api/checkpoint', datos);
    return r.data;
}

export async function reescribirGuardado(id, datos) {
    const r = await api.put(`/api/checkpoint/${id}`, datos);
    return r.data;
}

export async function borrarGuardado(id) {
    const r = await api.delete(`/api/checkpoint/${id}`);
    return r.data;
}


export async function obtenerUltimoGuardado(idNivel) {
    const r = await api.get('/api/checkpoint/ultimo', {
        params: { nivel: idNivel }
    });

    return r.data; // { guardado }
}

export async function obtenerGuardado(id) {
    const r = await api.get(`/api/checkpoint/${id}`);
    return r.data;
}