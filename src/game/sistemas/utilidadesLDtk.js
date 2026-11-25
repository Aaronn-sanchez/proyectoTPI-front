// Helpers compartidos por todos los sistemas que leen datos de LDtk

export function buscarCapa(nivel, identificador) {
    return nivel.layerInstances.find((l) => l.__identifier === identificador);
}

// Convierte fieldInstances en un objeto { nombreCampo: valor }
export function camposDe(entidad) {
    return Object.fromEntries(
        entidad.fieldInstances.map((f) => [f.__identifier, f.__value])
    );
}

// Registra (si no existe) un frame recortado de la textura y devuelve su nombre
export function frameDeRecorte(textura, { x, y, w, h }) {
    const nombre = `${x}_${y}_${w}_${h}`;
    if (!textura.has(nombre)) {
        textura.add(nombre, 0, x, y, w, h);
    }
    return nombre;
}