import Phaser from "phaser";

/**
 * Crea un suelo curvo a partir de puntos clave.
 * puntos: [{x, y}, ...] en píxeles, ordenados de izquierda a derecha.
 */
export function crearSuperficieCurva(escena, puntos, opciones = {}) {
    const { grosor = 24, subdivisiones = 8, friccion = 0.1 } = opciones;
    const Matter = Phaser.Physics.Matter.Matter;

    if (puntos.length < 2) return [];

    // 1) Suavizar con spline Catmull-Rom (pasa por todos los puntos)
    const spline = new Phaser.Curves.Spline(
        puntos.map(p => new Phaser.Math.Vector2(p.x, p.y))
    );
    const curva = spline.getPoints(puntos.length * subdivisiones);

    // 2) Un trapecio convexo por cada tramo de la polilínea
    const cuerpos = [];
    for (let i = 0; i < curva.length - 1; i++) {
        const a = curva[i];
        const b = curva[i + 1];

        const verts = [
            { x: a.x, y: a.y },
            { x: b.x, y: b.y },
            { x: b.x, y: b.y + grosor },
            { x: a.x, y: a.y + grosor }
        ];

        // fromVertices coloca el centroide en (x, y), así que se lo pasamos
        const centro = Matter.Vertices.centre(verts);
        const cuerpo = escena.matter.add.fromVertices(centro.x, centro.y, verts, {
            isStatic: true,
            friction: friccion,
            label: 'suelo_curvo'
        });
        cuerpos.push(cuerpo);
    }
    return cuerpos;
}