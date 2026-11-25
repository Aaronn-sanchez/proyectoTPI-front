import api from './cliente';

export async function listarUsuarios() {
    const respuesta = await api.get('/api/usuarios');
    return respuesta.data;
}
export async function renombrarUsuario(idUsuario, nombre) {
    const respuesta = await api.patch(`/api/usuarios/${idUsuario}`, { nombre });
    return respuesta.data;
}


export async function listarRolesDeUsuario(idUsuario) {
    const respuesta = await api.get(`/api/usuarios/${idUsuario}/roles`);
    return respuesta.data;
}

export async function asignarRol(idUsuario, idRol) {
    const respuesta = await api.post(`/api/usuarios/${idUsuario}/roles`, { id_rol: idRol });
    return respuesta.data;
}

export async function quitarRol(idUsuario, idRol) {
    const respuesta = await api.delete(`/api/usuarios/${idUsuario}/roles/${idRol}`);
    return respuesta.data;
}

export async function deshabilitarUsuario(idUsuario) {
    const respuesta = await api.delete(`/api/usuarios/${idUsuario}`);
    return respuesta.data;
}