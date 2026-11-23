import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import '../App.css';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import NivelCompletado from '../componentes/Nivel_Completado/NivelCompletado';
import { iniciarNivel, completarNivel } from '../api/niveles';

const ID_NIVEL = 0; // tutorial
const NOMBRE_NIVEL = 'Tutorial básico';

export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);

    const [pausado, setPausado] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [fin, setFin] = useState(null);
    const [, setLocation] = useLocation();

    // La API valida que el nivel esté desbloqueado para este usuario
    useEffect(() => {
        let cancelado = false;

        iniciarNivel(ID_NIVEL)
            .then(() => {
                if (!cancelado) setAutorizado(true);
            })
            .catch(() => {
                if (!cancelado) setLocation('/niveles');
            });

        return () => {
            cancelado = true;
        };
    }, [setLocation]);

    // El juego se crea recién cuando la API da el OK
    useEffect(() => {
        if (!autorizado || juego.current) return;

        juego.current = new Phaser.Game(crearConfig(contenedor.current));

        return () => {
            juego.current?.destroy(true);
            juego.current = null;
        };
    }, [autorizado]);

    // Guarda el nivel como completado en la API
    async function guardarFin() {
        setFin('guardando');

        try {
            await completarNivel(ID_NIVEL);
            setFin('ok');
        } catch {
            setFin('error');
        }
    }

    // La escena avisa con un evento cuando el carpincho toca el final
    useEffect(() => {
        if (!autorizado || !juego.current) return;

        const game = juego.current;
        game.events.on('nivel-completado', guardarFin);

        return () => {
            game.events.off('nivel-completado', guardarFin);
        };
    }, [autorizado]);

    // Pausa o reanuda la escena de Phaser
    useEffect(() => {
        if (!juego.current) return;

        if (pausado || fin) {
            juego.current.scene.pause('tutorialBasico');
        } else {
            juego.current.scene.resume('tutorialBasico');
        }
    }, [pausado, fin, autorizado]);

    // Escape abre y cierra el menú de pausa
    useEffect(() => {
        const alApretar = (e) => {
            if (e.key === 'Escape' && !fin) {
                setPausado((p) => !p);
            }
        };

        window.addEventListener('keydown', alApretar);

        return () => {
            window.removeEventListener('keydown', alApretar);
        };
    }, [fin]);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div ref={contenedor} />

            <button id="menu-link" onClick={() => setPausado(true)}>
                Menú
            </button>

            {pausado && !fin && (
                <MenuPausa
                    onContinuar={() => setPausado(false)}
                    onAjustes={() => setLocation('/ajustes')}
                    onSalir={() => setLocation('/niveles')}
                />
            )}

            {fin && (
                <NivelCompletado
                    estado={fin}
                    nombreNivel={NOMBRE_NIVEL}
                    onReintentar={guardarFin}
                    onVolver={() => setLocation('/niveles')}
                />
            )}
        </div>
    );
}