import api from './cliente';

// Devuelve { roles: [{ id_rol, nombre_rol, servicios: [id_servicio] }] }
export async function listarRoles() {
    const respuesta = await api.get('/api/roles');
    return respuesta.data;
}

// Devuelve { servicios: [{ id_servicio, clave, descripcion }] }
export async function listarServicios() {
    const respuesta = await api.get('/api/servicios');
    return respuesta.data;
}

// Crea un rol con los usuarios elegidos.
// Devuelve { id_rol, nombre_rol, servicios: [id], usuarios: [id] }
export async function crearRol({ nombre_rol, usuarios = [], servicios = [] }) {
    const respuesta = await api.post('/api/roles', { nombre_rol, usuarios, servicios });
    return respuesta.data;
}

// Elimina el rol y se lo quita a todos los usuarios. Devuelve { mensaje }
export async function borrarRol(idRol) {
    const respuesta = await api.delete(`/api/roles/${idRol}`);
    return respuesta.data;
}

// Reemplaza TODOS los servicios del rol (los checkboxes).
// Devuelve { id_rol, nombre_rol, servicios: [id], usuarios: [id] }
export async function reemplazarServicios(idRol, servicios) {
    const respuesta = await api.put(`/api/roles/${idRol}/servicios`, { servicios });
    return respuesta.data;
}