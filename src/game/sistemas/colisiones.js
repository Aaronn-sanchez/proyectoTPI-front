import Phaser from "phaser";
import { CAPAS, CUERPOS_INTGRID, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

// Colores de los valores del IntGrid tal como están definidos en LDtk:
// { 1: 0x84c23a, 3: 0x625b59, ... }
function coloresIntGrid(escena) {
    const definicion = escena.datosLDtk.defs.layers.find(
        (l) => l.identifier === CAPAS.COLISIONES
    );

    return Object.fromEntries(
        (definicion?.intGridValues ?? []).map((v) => [
            v.value,
            Phaser.Display.Color.HexStringToColor(v.color).color,
        ])
    );
}

function crearBloque(escena, cx, cy, w, h, gridSize, def, offsetX = 0, offsetY = 0) {
    const { color, borde, profundidad, ...opciones } = def;

    const ancho = w * gridSize;
    const alto = h * gridSize;

    const posX = cx * gridSize + ancho / 2 + offsetX;
    const posY = cy * gridSize + alto / 2 + offsetY;

    if (color != null) {
        const bloque = escena.add
            .rectangle(posX, posY, ancho, alto, color)
            .setStrokeStyle(1, borde ?? color)
            .setDepth(profundidad ?? PROFUNDIDAD.PIEDRA);

        escena.matter.add.gameObject(bloque, opciones);
    } else {
        escena.matter.add.rectangle(posX, posY, ancho, alto, opciones);
    }
}

// Capa IntGrid "Colisiones": fusiona celdas contiguas en cuerpos estáticos.
// Si la escena tiene mostrarColoresLDtk = true, cada bloque se dibuja con el
// color que tiene su valor en LDtk (para probar niveles antes de tener tiles).
export function crearColisiones(escena, nivel) {
    const capa = buscarCapa(nivel, CAPAS.COLISIONES);
    if (!capa) return;

    const colores = escena.mostrarColoresLDtk ? coloresIntGrid(escena) : {};

    const gridSize = capa.__gridSize;
    const anchoCeldas = capa.__cWid;
    const csv = capa.intGridCsv;
    const altoCeldas = capa.__cHei ?? Math.ceil(csv.length / anchoCeldas);

    const visitado = new Array(csv.length).fill(false);

    for (let cy = 0; cy < altoCeldas; cy++) {
        for (let cx = 0; cx < anchoCeldas; cx++) {
            const idx = cy * anchoCeldas + cx;
            const valor = csv[idx];
            const base = CUERPOS_INTGRID[valor];

            if (!base || visitado[idx]) continue;

            // Con colores de LDtk, el bloque va detrás del personaje (que está en 0)
            const def = colores[valor] != null
                ? { ...base, color: colores[valor], borde: colores[valor], profundidad: PROFUNDIDAD.PASTO - 1 }
                : base;

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