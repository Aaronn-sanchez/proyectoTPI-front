import Phaser from "phaser";
import EscenaBase from "./escenaBase.js";
import wachin from "../entidades/clases/wachin.js";
import { iniciarCarpincho, prepararFramesCarpincho } from "../entidades/personajes/carpincho.js";
import { CAPAS, PROFUNDIDAD, SONIDOS_CONTACTO } from "../configs/constantes.js";

// Propias de esta escena
const CLAVE_NIVEL = "nivel_0";
const ID_NIVEL = "Level_0";

export default class TutorialBasico extends EscenaBase {
    constructor() {
        super("tutorialBasico", CLAVE_NIVEL, ID_NIVEL);
    }

    preload() {
        // Efectos de sonido
        Object.values(SONIDOS_CONTACTO).forEach(({ clave, archivo }) => {
            this.load.audio(clave, archivo);
        });

        const url = "/assets/sprites/escenario/";
        const url2 = "/assets/sprites/carpincho/";

        // Imágenes del escenario
        this.load.image("cielo", url + "background-cielo.png");
        this.load.image("pastito_tiles", url + "pastitio.png");
        this.load.image("pozito_tiles", url + "pastito-pozito.png");
        this.load.image("hierbas", url + "pastito-pozito-con-hievas.png");
        this.load.image("suelo_nivel2", url + "suelo_de_nivel2.png");
        this.load.image("flor_espinas", url + "florecitas.png");
        this.load.image("textura_caja", url + "caja.png");
        this.load.image("banderin_checkpoint", url + "banderin-checkpoint.png");
        this.load.image("boton", url + "boton.png");
        this.load.image("boton_presionado", url + "boton-presionado.png");

        this.load.json(CLAVE_NIVEL, "/assets/levels/humedal_level.json");

        // Sprites del carpincho
        this.load.image("carpincho", url2 + "carpincho.png");
        this.load.image("frame_1", url2 + "casi de pie.png");
        this.load.image("frame_2", url2 + "correccion frame 4.png");
        this.load.image("frame_3", url2 + "frame 1.png");
        this.load.image("frame_4", url2 + "frame 2.png");
        this.load.image("frame_5", url2 + "frame 3.png");
        this.load.image("frame_6", url2 + "frame 5.5.png");
        this.load.image("frame_7", url2 + "frame f2-1.png");
        this.load.image("frame_8", url2 + "frame f2-2.png");
        this.load.image("frame_9", url2 + "frame f2-3.png");

        this.load.on("loaderror", (archivo) => {
            console.error("No se pudo cargar:", archivo.key);
            this.game.events.emit("nivel-error-carga", archivo.key);
        });
    }

    // Gancho: zoom dinámico del tramo de bajada + parallax del cielo
    alActualizar() {
        const cam = this.cameras.main;
        const enTramoBajada = this.carpincho.x > 1850 && this.carpincho.x < 2700;

        const zoomObjetivo = enTramoBajada ? 1.35 : 1;
        const offsetYObjetivo = enTramoBajada ? 90 : 110;

        cam.setZoom(Phaser.Math.Linear(cam.zoom, zoomObjetivo, 0.05));
        cam.followOffset.y = Phaser.Math.Linear(cam.followOffset.y, offsetYObjetivo, 0.05);

        if (this.fondoCielo) {
            this.fondoCielo.tilePositionX = cam.scrollX * 0.2;
        }
    }

    // Gancho: personaje del nivel
    crearPersonaje(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        const spawn = capaEntidades?.entityInstances.find(
            (e) => e.__identifier === "Spawn_carpincho"
        );

        const guardado = this.guardadoInicial;

        const tienePosicionGuardada =
            guardado &&
            guardado.pos_x !== null &&
            guardado.pos_x !== undefined &&
            guardado.pos_y !== null &&
            guardado.pos_y !== undefined &&
            Number.isFinite(Number(guardado.pos_x)) &&
            Number.isFinite(Number(guardado.pos_y));

        const inicioX = tienePosicionGuardada
            ? Number(guardado.pos_x)
            : spawn
                ? spawn.px[0] + spawn.width / 2 + nivel.worldX
                : 160;

        const inicioY = tienePosicionGuardada
            ? Number(guardado.pos_y)
            : spawn
                ? spawn.px[1] + spawn.height / 2 + nivel.worldY
                : 288;

        this.puntoRespawn = { x: inicioX, y: inicioY };

        prepararFramesCarpincho(this);

        this.carpincho = new wachin(this, inicioX, inicioY, "carpincho", iniciarCarpincho);
        this.carpincho.setDepth(PROFUNDIDAD.CARPINCHO);
    }
}