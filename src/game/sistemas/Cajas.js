import { CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa, camposDe, frameDeRecorte } from "./utilidadesLDtk.js";

export function crearCajas(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Caja")
        .forEach((e) => {
            const campos = camposDe(e);
            if (!campos.cajita_tile) return;

            const ancho = e.width;
            const alto = e.height;
            const posicion = { x: e.px[0] + nivel.worldX, y: e.px[1] + nivel.worldY };

            const frame = frameDeRecorte(escena.textures.get("textura_caja"), campos.cajita_tile);

            const caja = escena.matter.add.image(posicion.x, posicion.y, "textura_caja", frame);

            caja.setDisplaySize(ancho, alto);
            caja.setDepth(PROFUNDIDAD.CARPINCHO);

            caja.setRectangle(ancho, alto, {
                friction: 0.5,
                label: campos.label,
                density: campos.densidad ?? 0.002,
            });

            caja.body.tags = e.__tags || [];
            caja.body.peso = true;
            caja.body.iid = e.iid;
            caja.body.objetoVisual = caja;

            escena.cajas.push(caja.body);
        });
}