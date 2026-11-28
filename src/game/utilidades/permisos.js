import { obtenerPerfil } from '../../api/auth.js';

const ROL_QA = 2;
export const SERVICIO = {
    GRAVEDAD: 'gravedad',
    VELOCIDAD: 'Modificar_velocidad',               
    PAREDES: 'Atravesar_paredes',       
};
const SERVICIOS_QA = Object.values(SERVICIO);

function leerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}

export const esQA = () => Boolean(leerUsuario()?.roles?.includes(ROL_QA));

export function obtenerServicios() {
    try {
        const s = JSON.parse(localStorage.getItem('servicios') || '[]');
        return Array.isArray(s) ? s : [];
    } catch {
        return [];
    }
}

export const tieneServicio = (clave) => obtenerServicios().includes(clave);

// El QA Tester puede todo; el resto, solo los servicios que le asignaron
export const puedeServicio = (clave) => esQA() || tieneServicio(clave);
export const puedeVerPanelQA = () => esQA() || SERVICIOS_QA.some(tieneServicio);

export async function refrescarSesion() {
    const datos = await obtenerPerfil();
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    localStorage.setItem('servicios', JSON.stringify(datos.servicios ?? []));
    return datos;
}