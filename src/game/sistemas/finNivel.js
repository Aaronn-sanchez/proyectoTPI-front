import { CAPAS } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

export function crearFinNivel(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Fin_nivel")
        .forEach((e) => {
            const x = e.px[0] + nivel.worldX + e.width * (0.5 - e.__pivot[0]);
            const y = e.px[1] + nivel.worldY + e.height * (0.5 - e.__pivot[1]);

            const zona = escena.matter.add.rectangle(x, y, e.width, e.height, {
                isSensor: true,
                isStatic: true,
                label: "fin_nivel",
            });

            zona.tags = e.__tags || [];
        });
}