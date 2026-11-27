import { CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa, camposDe, frameDeRecorte } from "./utilidadesLDtk.js";

export function crearPlantas(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Planta_espinas")
        .forEach((e) => {
            if (!e.__tile) return;

            const ancho = e.width;
            const alto = e.height;
            const campos = camposDe(e);

            const posicion = {
                x: e.px[0] + nivel.worldX + ancho / 2,
                y: e.px[1] + nivel.worldY + alto / 2,
            };

            const frame = frameDeRecorte(escena.textures.get("flor_espinas"), e.__tile);

            const planta = escena.matter.add.image(posicion.x, posicion.y, "flor_espinas", frame);

            planta.setDisplaySize(ancho, alto);
            planta.setDepth(PROFUNDIDAD.CARPINCHO);

            planta.setRectangle(ancho, alto, {
                isSensor: campos.es_sensor,
                label: campos.label,
                isStatic: true,
            });

            planta.body.tags = e.__tags;
        });
}