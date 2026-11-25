import TutorialBasico from "./escenas/TutorialBasico.js";

// Registro único de niveles jugables. La clave es el id_nivel de la base de datos.
// Para sumar un nivel: crear su escena y agregar una línea acá.
export const NIVELES = {
    0: {
        escena: TutorialBasico,
        clave: "tutorialBasico",
        nombre: "Tutorial básico",
    },
};

export function obtenerNivel(id) {
    return NIVELES[id] ?? null;
}