import Agua from "../entidades/mundo/agua.js";
import { CAPAS, INTGRID, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

// La clase Agua dispara partículas con la textura "gota": la generamos acá
// para no depender de ningún archivo.
function crearTexturaGota(escena) {
    if (escena.textures.exists("gota")) return;

    const lienzo = escena.textures.createCanvas("gota", 6, 6);
    const ctx = lienzo.getContext();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(3, 3, 3, 0, Math.PI * 2);
    ctx.fill();
    lienzo.refresh();
}

// Lee las celdas de agua (INTGRID.AGUA) de la capa "Colisiones" de cada sala.
// Si la sala no tiene agua, no hace nada: el tutorial queda igual que antes.
export function crearAgua(escena, nivel) {
    const capa = buscarCapa(nivel, CAPAS.COLISIONES);
    if (!capa) return;

    const csv = capa.intGridCsv;
    if (!csv.includes(INTGRID.AGUA)) return;

    crearTexturaGota(escena);

    const columnas = capa.__cWid;
    const filas = capa.__cHei ?? Math.ceil(csv.length / columnas);

    const agua = new Agua(escena, {
        intGrid: csv,
        columnas,
        filas,
        tamCelda: capa.__gridSize,
        valorAgua: INTGRID.AGUA,
        profundidad: PROFUNDIDAD.AGUA,
        // Posición de la sala en el mundo (igual que el resto de los sistemas)
        offsetX: nivel.worldX,
        offsetY: nivel.worldY,
    });

    escena.aguas.push(agua);
}

// Se llama una vez por frame desde EscenaBase.update, ANTES de mover al personaje
export function actualizarAguas(escena, tiempo, delta) {
    if (!escena.aguas.length) return;

    // Olas y dibujo de todas las aguas
    escena.aguas.forEach((a) => a.actualizar(tiempo, delta));

    // El carpincho solo puede estar en una a la vez
    const cuerpo = escena.carpincho.body;
    const actual = escena.aguas.find((a) => a.medirSumersion(cuerpo) > 0) ?? null;

    // Si acaba de salir, se llama una última vez a la anterior para la salpicadura de salida
    const aplicar = actual ?? escena.aguaPrevia;
    aplicar?.afectarCuerpo(escena.carpincho, tiempo, delta);

    escena.aguaPrevia = actual;
}