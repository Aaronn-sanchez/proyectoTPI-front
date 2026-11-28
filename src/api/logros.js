import api from './cliente';

// Devuelve { logros: [{ id_logro, codigo, titulo, descripcion, meta, progreso, fecha_desbloqueo, desbloqueado }] }
export async function obtenerLogros() {
    const respuesta = await api.get('/api/logros');
    return respuesta.data;
}

// Lo va a usar el juego cuando el jugador avance en un logro
export async function registrarProgreso(codigo, incremento = 1) {
    const respuesta = await api.post('/api/logros/progreso', { codigo, incremento });
    return respuesta.data;
}

export async function resetearLogros() {
    const respuesta = await api.delete('/api/logros/reset');
    return respuesta.data;
}