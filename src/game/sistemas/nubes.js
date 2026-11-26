import { CAPAS, PROFUNDIDAD } from "../configs/constantes.js";
import { buscarCapa } from "./utilidadesLDtk.js";

// Qué parte del rectángulo de LDtk es "mortal". Menos de 1 = más permisivo,
// porque una nube no ocupa todo su rectángulo (estilo floppy bird: si es injusto, frustra).
const FACTOR_HITBOX = 0.8;

// Nube provisoria hasta tener el arte propio: se dibuja una vez y se estira
// al tamaño de cada entidad. Para usar el arte real, cargá una textura "nube"
// en cargarAssetsExtra() del nivel y este sistema la usa sola.
function claveTexturaNube(escena) {
    if (escena.textures.exists("nube")) return "nube";

    if (!escena.textures.exists("nube_provisoria")) {
        const lienzo = escena.textures.createCanvas("nube_provisoria", 200, 100);
        const ctx = lienzo.getContext();
        ctx.fillStyle = "#ffffff";

        // [x, y, radio]
        [[45, 62, 28], [85, 45, 34], [128, 50, 36], [160, 66, 26], [100, 68, 28]].forEach(([cx, cy, r]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        });

        lienzo.refresh();
    }
    return "nube_provisoria";
}

// Entidades "Nube" de LDtk: rectángulos redimensionables con los tags
// entidad_danio + detectable. EscenaBase.resolverInteraccion ya sabe qué hacer
// con esos tags (reaparecer al último punto), así que acá solo se crean.
export function crearNubes(escena, nivel) {
    const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

    capaEntidades?.entityInstances
        .filter((e) => e.__identifier === "Nube")
        .forEach((e) => {
            // px es la posición del pivote; con pivote 0.5 es el centro
            const x = e.px[0] + nivel.worldX + e.width * (0.5 - e.__pivot[0]);
            const y = e.px[1] + nivel.worldY + e.height * (0.5 - e.__pivot[1]);

            escena.add
                .image(x, y, claveTexturaNube(escena))
                .setDisplaySize(e.width, e.height)
                .setDepth(PROFUNDIDAD.PIEDRA);

            const cuerpo = escena.matter.add.rectangle(
                x,
                y,
                e.width * FACTOR_HITBOX,
                e.height * FACTOR_HITBOX,
                { isSensor: true, isStatic: true, label: "nube" }
            );

            cuerpo.tags = e.__tags || [];
        });
}