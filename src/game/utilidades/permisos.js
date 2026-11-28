
import { obtenerPerfil } from '../../api/auth.js';

export const SERVICIO = {
    GRAVEDAD: 'modificar_gravedad',
    VELOCIDAD: 'modificar_velocidad',
    PAREDES: 'atravesar_paredes',
    CHECKPOINT: 'elegir_checkpoint',
};
const SERVICIOS_QA = Object.values(SERVICIO);

export function obtenerServicios() {
    try {
        const s = JSON.parse(localStorage.getItem('servicios') || '[]');
        return Array.isArray(s) ? s : [];
    } catch {
        return [];
    }
}

export const tieneServicio = (clave) => obtenerServicios().includes(clave);
export const puedeVerPanelQA = () => SERVICIOS_QA.some(tieneServicio);

export async function refrescarSesion() {
    const datos = await obtenerPerfil();
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    localStorage.setItem('servicios', JSON.stringify(datos.servicios ?? []));
    return datos;
}