import Phaser from "phaser";
import { CAPAS } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

export function crearPuertas(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Puerta")
        .forEach((e) => {
            const posicion = { x: e.px[0] + nivel.worldX, y: e.px[1] + nivel.worldY };

            // Color asignado a la entidad en LDtk
            const color = Phaser.Display.Color.HexStringToColor(
                e.__smartColor || "#8b5a2b"
            ).color;

            const visual = escena.add.rectangle(posicion.x, posicion.y, e.width, e.height, color);

            escena.matter.add.gameObject(visual, { isStatic: true, label: "Puerta" });

            const puerta = visual.body;
            puerta.tags = e.__tags || [];
            puerta.abierta = false;
            puerta.iid = e.iid;
            puerta.objetoVisual = visual;

            escena.puertas.push(puerta);
        });
}