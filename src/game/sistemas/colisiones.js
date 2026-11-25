import { CAPAS, CUERPOS_INTGRID, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

function crearBloque(escena, cx, cy, w, h, gridSize, def, offsetX = 0, offsetY = 0) {
    const { color, borde, ...opciones } = def;

    const ancho = w * gridSize;
    const alto = h * gridSize;

    const posX = cx * gridSize + ancho / 2 + offsetX;
    const posY = cy * gridSize + alto / 2 + offsetY;

    if (color != null) {
        const bloque = escena.add
            .rectangle(posX, posY, ancho, alto, color)
            .setStrokeStyle(1, borde ?? color)
            .setDepth(PROFUNDIDAD.PIEDRA);

        escena.matter.add.gameObject(bloque, opciones);
    } else {
        escena.matter.add.rectangle(posX, posY, ancho, alto, opciones);
    }
}

// Capa IntGrid "Colisiones": fusiona celdas contiguas en cuerpos estáticos
export function crearColisiones(escena, nivel) {
    const capa = buscarCapa(nivel, CAPAS.COLISIONES);
    if (!capa) return;

    const gridSize = capa.__gridSize;
    const anchoCeldas = capa.__cWid;
    const csv = capa.intGridCsv;
    const altoCeldas = capa.__cHei ?? Math.ceil(csv.length / anchoCeldas);

    const visitado = new Array(csv.length).fill(false);

    for (let cy = 0; cy < altoCeldas; cy++) {
        for (let cx = 0; cx < anchoCeldas; cx++) {
            const idx = cy * anchoCeldas + cx;
            const valor = csv[idx];
            const def = CUERPOS_INTGRID[valor];

            if (!def || visitado[idx]) continue;

            // Extender a lo ancho
            let w = 1;
            while (cx + w < anchoCeldas && csv[idx + w] === valor && !visitado[idx + w]) {
                w++;
            }

            // Extender hacia abajo mientras toda la fila coincida
            let h = 1;
            crecer: while (cy + h < altoCeldas) {
                for (let i = 0; i < w; i++) {
                    const j = (cy + h) * anchoCeldas + cx + i;
                    if (csv[j] !== valor || visitado[j]) break crecer;
                }
                h++;
            }

            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    visitado[(cy + dy) * anchoCeldas + cx + dx] = true;
                }
            }

            crearBloque(escena, cx, cy, w, h, gridSize, def, nivel.worldX, nivel.worldY);
        }
    }
}