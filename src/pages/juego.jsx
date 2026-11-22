import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { crearConfig } from '../game/config';
import '../App.css';
import { useLocation } from 'wouter';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import { iniciarNivel } from '../api/niveles';

const ID_NIVEL = 0; // tutorial

export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);
    const [pausado, setPausado] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [, setLocation] = useLocation();

    // La API valida que el nivel esté desbloqueado para este usuario
    useEffect(() => {
        let cancelado = false;
        iniciarNivel(ID_NIVEL)
            .then(() => { if (!cancelado) setAutorizado(true); })
            .catch(() => { if (!cancelado) setLocation('/niveles'); });
        return () => { cancelado = true; };
    }, []);

    // El juego se crea recién cuando la API da el OK
    useEffect(() => {
        if (!autorizado || juego.current) return;
        juego.current = new Phaser.Game(crearConfig(contenedor.current));

        return () => {
            juego.current?.destroy(true);
            juego.current = null;
        };
    }, [autorizado]);

    // para que el juego detecte el pausado
    useEffect(() => {
        if (!juego.current) return;
        if (pausado) {
            juego.current.scene.pause('tutorialBasico');
        } else {
            juego.current.scene.resume('tutorialBasico');
        }
    }, [pausado, autorizado]);

    useEffect(() => {
        const alApretar = (e) => {
            if (e.key === 'Escape') {
                setPausado((p) => !p);
            }
        };

        window.addEventListener('keydown', alApretar);
        return () => window.removeEventListener('keydown', alApretar);
    }, []);

    return (
        <div style={{
            width: '100vw', height: '100vh', backgroundColor: '#1a1a1a',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div ref={contenedor} />
            <button id="menu-link" onClick={() => setPausado(true)}>
                Menú
            </button>
            {pausado && (
                <MenuPausa
                    onContinuar={() => setPausado(false)}
                    onAjustes={() => { }}
                    onSalir={() => setLocation('/niveles')}
                />
            )}
        </div >
    );
}