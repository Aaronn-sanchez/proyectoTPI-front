import { CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa, camposDe, frameDeRecorte } from "./utilidadesLDtk.js";

export function crearBotones(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Boton_peso")
        .forEach((e) => {
            const campos = camposDe(e);
            if (!campos.Tile_boton || !campos.Tile_boton_presionado) return;

            const ancho = e.width;
            const alto = e.height;
            const posicion = { x: e.px[0] + nivel.worldX, y: e.px[1] + nivel.worldY };

            const frameNormal = frameDeRecorte(escena.textures.get("boton"), campos.Tile_boton);
            const framePresionado = frameDeRecorte(
                escena.textures.get("boton_presionado"),
                campos.Tile_boton_presionado
            );

            const boton = escena.matter.add.image(posicion.x, posicion.y, "boton", frameNormal);

            boton.setDisplaySize(ancho, alto);
            boton.setDepth(PROFUNDIDAD.PIEDRA);

            boton.setRectangle(ancho, alto, {
                isSensor: true,
                isStatic: true,
                label: "Boton_peso",
            });

            boton.body.tags = e.__tags || [];
            boton.body.activado = false;
            boton.body.iid = e.iid;
            boton.body.objetoVisual = boton;
            boton.body.framePresionado = framePresionado;
            boton.body.frameNormal = frameNormal;
            boton.body.objetivo = campos.objetivo;

            escena.botones.push(boton.body);
        });
}