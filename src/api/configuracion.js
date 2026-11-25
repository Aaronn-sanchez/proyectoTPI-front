import api from './cliente';

const RUTA = '/api/configuracion';

const sacarDatos = (respuesta) => respuesta.data;

const traducirError = (error) => {
    throw new Error(error.response?.data?.error || 'No se pudo conectar con el servidor');
};

export const obtenerConfiguracion = () =>
    api.get(RUTA).then(sacarDatos).catch(traducirError);

export const actualizarConfiguracion = (cambios) =>
    api.patch(RUTA, cambios).then(sacarDatos).catch(traducirError);

export const crearPerfil = (nombre) =>
    api.post(`${RUTA}/perfiles`, { nombre }).then(sacarDatos).catch(traducirError);

export const aplicarPerfil = (id) =>
    api.post(`${RUTA}/perfiles/${id}/aplicar`).then(sacarDatos).catch(traducirError);

export const borrarPerfil = (id) =>
    api.delete(`${RUTA}/perfiles/${id}`).then(sacarDatos).catch(traducirError);