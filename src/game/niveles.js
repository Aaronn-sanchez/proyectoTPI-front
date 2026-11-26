import TutorialBasico from "./escenas/TutorialBasico.js";
import ElCamalotal from "./escenas/ElCamalotal.js";

// Registro único de niveles jugables.
export const NIVELES = {
    0: {
        escena: TutorialBasico,
        clave: "tutorialBasico",
        nombre: "Tutorial básico",
    },

    1: {
        escena: ElCamalotal,
        clave: "elCamalotal",
        nombre: "El Camalotal",
    },
};

export function obtenerNivel(id) {
    return NIVELES[id] ?? null;
}