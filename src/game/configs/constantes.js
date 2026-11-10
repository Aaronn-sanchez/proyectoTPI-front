// Tamaño (px) de cada tile de los tilesets
export const TAM_TILE = 16;

// Capas de LDtk (el texto tiene que ser idéntico al identificador en LDtk)
export const CAPAS = {
    PASTITO: "Pastito",
    POZITO: "Pozito",
    HIERBAS: "Hierbas",
    COLISIONES: "Colisiones",
    ENTIDADES: "Entidades",
    PASTITO3: "Pastito3",
};

// Valores de la capa IntGrid "Colisiones"
export const INTGRID = {
    PISO: 1,
    ROCA: 3,
    TRONCO: 4,
};

// Cuerpos Matter que genera cada valor del IntGrid.
// Para sumar un bloque nuevo: agregá su valor en INTGRID y una línea acá.
// Los cuerpos contiguos del mismo tipo se fusionan en uno solo.
export const CUERPOS_INTGRID = {
    [INTGRID.PISO]: { isStatic: true, friction: 0.1, label: "suelo" },
    [INTGRID.ROCA]: { isStatic: true, friction: 0.1, label: "roca", color: 0x8d8d8d, borde: 0x4a4a4a },
    [INTGRID.TRONCO]: { isStatic: true, friction: 0.1, label: "tronco", color: 0x8b5a2b, borde: 0x4e3218 },
};

// Orden de dibujado (mayor = más adelante)
export const PROFUNDIDAD = {
    CIELO: -100,
    PASTO: 0,
    CARPINCHO: 0,
    PIEDRA: 1,
    PASTITO3: 3,
    HIERBAS: 5,
    POZITO: 7,
};