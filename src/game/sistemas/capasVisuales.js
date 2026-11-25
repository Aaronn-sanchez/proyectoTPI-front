import { TAM_TILE, CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

function crearCapaTiles(escena, nivel, nombreCapa, claveTextura, prefijo, profundidad) {
    const capa = buscarCapa(nivel, nombreCapa);
    if (!capa) return;

    const textura = escena.textures.get(claveTextura);

    capa.gridTiles.forEach((tile) => {
        const [srcX, srcY] = tile.src;
        const nombreFrame = `${prefijo}_${srcX}_${srcY}`;

        if (!textura.has(nombreFrame)) {
            textura.add(nombreFrame, 0, srcX, srcY, TAM_TILE, TAM_TILE);
        }

        const imagen = escena.add
            .image(
                tile.px[0] + nivel.worldX,
                tile.px[1] + nivel.worldY,
                claveTextura,
                nombreFrame
            )
            .setOrigin(0, 0)
            .setDepth(profundidad);

        // LDtk guarda el espejado en bits: 1 = horizontal, 2 = vertical
        if (tile.f & 1) imagen.setFlipX(true);
        if (tile.f & 2) imagen.setFlipY(true);
    });
}

export function crearCapasVisuales(escena, nivel) {
    crearCapaTiles(escena, nivel, CAPAS.PASTITO, "pastito_tiles", "pasto", PROFUNDIDAD.PASTO);
    crearCapaTiles(escena, nivel, CAPAS.POZITO, "pozito_tiles", "pozo", PROFUNDIDAD.POZITO);
    crearCapaTiles(escena, nivel, CAPAS.HIERBAS, "hierbas", "hierba", PROFUNDIDAD.HIERBAS);
    crearCapaTiles(escena, nivel, CAPAS.PASTITO3, "suelo_nivel2", "suelo2", PROFUNDIDAD.PASTITO3);
}