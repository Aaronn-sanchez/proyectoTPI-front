import { CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa, camposDe, frameDeRecorte } from "./utilidadesLDtk.js";

export function crearCheckpoints(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Enty_Checkpoint")
        .forEach((e) => {
            const campos = camposDe(e);
            if (!campos.checkpoint_tile) return;

            const ancho = e.width;
            const alto = e.height;
            const posicion = { x: e.px[0] + nivel.worldX, y: e.px[1] + nivel.worldY };

            const frame = frameDeRecorte(
                escena.textures.get("banderin_checkpoint"),
                campos.checkpoint_tile
            );

            const banderin = escena.matter.add.image(
                posicion.x,
                posicion.y,
                "banderin_checkpoint",
                frame
            );

            banderin.setDisplaySize(ancho, alto);
            banderin.setDepth(PROFUNDIDAD.PIEDRA);

            banderin.setRectangle(ancho, alto, {
                isSensor: campos.es_sensor,
                isStatic: true,
                label: campos.label,
            });

            banderin.body.tags = e.__tags || [];
            banderin.body.activado = false;
        });
}