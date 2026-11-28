import Phaser from 'phaser';
import { GRAVEDAD_BASE } from './configs/constantes';
export function crearConfig(contenedor, nivel, guardadoInicial = null) {
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
                gravity: { y: GRAVEDAD_BASE },
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
            class extends nivel.escena {
                init(data) {
                    super.init({
                        ...data,
                        guardado: guardadoInicial
                    });
                }
            }
        ]
    };
}