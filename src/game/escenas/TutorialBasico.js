import Phaser from "phaser";
import EscenaBase from "./escenaBase.js";

export default class TutorialBasico extends EscenaBase {
    constructor() {
        super(
            "tutorialBasico",                    // clave de la escena
            "nivel_0",                           // clave del JSON en caché
            "Level_0",                           // identificador del nivel en LDtk
            "/assets/levels/humedal_level.json"  // ruta del JSON
        );
    }

    // Gancho: zoom dinámico del tramo de bajada + parallax del cielo
    alActualizar() {
        const cam = this.cameras.main;
        const enTramoBajada = this.personaje.x > 1850 && this.personaje.x < 2700;

        const zoomObjetivo = enTramoBajada ? 1.35 : 1;
        const offsetYObjetivo = enTramoBajada ? 90 : 110;

        cam.setZoom(Phaser.Math.Linear(cam.zoom, zoomObjetivo, 0.05));
        cam.followOffset.y = Phaser.Math.Linear(cam.followOffset.y, offsetYObjetivo, 0.05);

        if (this.fondoCielo) {
            this.fondoCielo.tilePositionX = cam.scrollX * 0.2;
        }
    }
}