import EscenaBase from "./escenaBase.js";
import wachin from "../entidades/clases/wachin.js";
import { iniciarBenteveo, prepararFramesBenteveo } from "../entidades/personajes/benteveo.js";
import { PROFUNDIDAD } from "../configs/constantes.js";

// ¿El agua mata al benteveo? (true = cualquier contacto con el agua lo hace reaparecer)
const MUERE_EN_AGUA = true;

export default class ElCamalotal extends EscenaBase {
    constructor() {
        super(
            "elCamalotal",                       // clave de la escena
            "nivel_1",                           // clave del JSON en caché
            "Level_0",                           // sala de LDtk donde está Spawn_benteveo
            "/assets/levels/ElCamalotal.json"    // ruta del JSON
        );

        // Mientras no haya tiles, los bloques se dibujan con el color del IntGrid de LDtk.
        // Cuando pintes los tiles, borrá esta línea (o ponela en false).
        this.mostrarColoresLDtk = true;
    }

    cargarAssetsExtra() {
        for (let i = 1; i <= 5; i++) {
            this.load.image(
                `benteveo_${i}`,
                `/assets/sprites/benteveo/frame%20${i}.png`
            );
        }
    }

    crearPersonaje(nivel) {
        const { x, y } = this.calcularInicio(nivel, "Spawn_benteveo");

        prepararFramesBenteveo(this);

        this.personaje = new wachin(this, x, y, "benteveo", iniciarBenteveo);
        this.personaje.setDepth(PROFUNDIDAD.CARPINCHO);
    }

    alCrear() {
        // La base deja un offset de 150 pensado para un personaje de tierra
        this.cameras.main.setFollowOffset(0, 0);

        // Cualquier cosa sólida lo hace reaparecer en el último checkpoint
        this.personaje.on("golpe", () => this.reaparecerPersonaje());
    }

    alActualizar() {
        if (!MUERE_EN_AGUA) return;

        const cuerpo = this.personaje.body;
        if (this.aguas.some((a) => a.medirSumersion(cuerpo) > 0)) {
            this.reaparecerPersonaje();
        }
    }
}