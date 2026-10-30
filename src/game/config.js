import Phaser from 'phaser';
import TutorialBasico from './escenas/tutorialBasico';

const width = window.innerWidth;
const height = window.innerHeight;

export function crearConfig(contenedor) {
    return {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: contenedor,
        pixelArt: true,
        physics: {
            default: 'matter',
            matter: { gravity: { y: 1.2 }, debug: true }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: width,
            height: height
        },
        scene: [TutorialBasico]
    };
}