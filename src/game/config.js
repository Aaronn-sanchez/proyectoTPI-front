
import Phaser from 'phaser';
import TutorialBasico from './escenas/TutorialBasico.js';

export function crearConfig(contenedor, guardadoInicial = null) {
    // El juego siempre se crea en formato horizontal.
    const width = Math.max(window.innerWidth, window.innerHeight);
    const height = Math.min(window.innerWidth, window.innerHeight);

    return {
        type: Phaser.AUTO,
        width,
        height,
        parent: contenedor,
        pixelArt: true,

        physics: {
            default: 'matter',
            matter: {
                gravity: { y: 1.2 },
                debug: true
            }
        },

        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width,
            height
        },

        scene: [
            class extends TutorialBasico {
                constructor() {
                    super(guardadoInicial);
                }
            }
        ]
    };
}
