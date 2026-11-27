const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
    const res = await fetch(`${API_URL}/api/configuracion${ruta}`, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });

    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.error || 'Error de conexión');
    return datos;
}

export const obtenerConfiguracion = () => pedir('');
export const actualizarConfiguracion = (cambios) => pedir('', { metodo: 'PATCH', cuerpo: cambios });
export const crearPerfil = (nombre) => pedir('/perfiles', { metodo: 'POST', cuerpo: { nombre } });
export const aplicarPerfil = (id) => pedir(`/perfiles/${id}/aplicar`, { metodo: 'POST' });
export const borrarPerfil = (id) => pedir(`/perfiles/${id}`, { metodo: 'DELETE' });