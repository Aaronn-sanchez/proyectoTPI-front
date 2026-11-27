import Phaser from 'phaser';

const width = window.innerWidth;
const height = window.innerHeight;
const DEBUG = import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true';

// nivel: una entrada de NIVELES ({ escena, clave, nombre })
export function crearConfig(contenedor, nivel, guardadoInicial = null) {
    return {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: contenedor,
        pixelArt: true,
        physics: {
            default: 'matter',
            matter: { gravity: { y: 1.2 }, debug: DEBUG }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: width,
            height: height
        },
        // La escena se agrega al arrancar, pasándole el guardado por init(data)
        scene: [],
        callbacks: {
            postBoot: (game) => {
                game.scene.add(nivel.clave, nivel.escena, true, { guardado: guardadoInicial });
            }
        }
    };
}