import { CAPAS } from "../configs/constantes.js";
import { crearSuperficieCurva } from "../utilidades/superficiesCurvas.js";
import { buscarCapa } from "./utilidadesLDtk.js";

// Entidades "Curva" de LDtk
export function crearCurvas(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);
    const gridCurva = capaEntidades?.__gridSize ?? 16;

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Curva")
        .forEach((e) => {
            const campo = e.fieldInstances.find((f) => f.__identifier === "puntos");
            if (!campo || !campo.__value) return;

            const pts = campo.__value
                .filter((p) => p !== null)
                .map((p) => ({
                    x: (p.cx + 0.5) * gridCurva + nivel.worldX,
                    y: p.cy * gridCurva + nivel.worldY,
                }))
                .sort((a, b) => a.x - b.x);

            crearSuperficieCurva(escena, pts, { grosor: 15, subdivisiones: 8 });
        });
}