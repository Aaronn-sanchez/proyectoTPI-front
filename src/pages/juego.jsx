import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Link, useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import MenuPausa from "../componentes/menu-de-pausa/MenuPausa.jsx";
import '../App.css';

// Ajustá la ruta de ajustes a la que tengas definida
const RUTA_MENU = '/menu';
const RUTA_AJUSTES = '/ajustes';



export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);
    const escenasPausadas = useRef([]);
    const [, navigate] = useLocation();
    const [pausado, setPausado] = useState(false);

    useEffect(() => {
        if (juego.current) return;
        juego.current = new Phaser.Game(crearConfig(contenedor.current));

        return () => {
            juego.current?.destroy(true);
            juego.current = null;
        };
    }, []);

    // Esc abre y cierra la pausa
    useEffect(() => {
        function alTeclear(e) {
            if (e.key === 'Escape') setPausado((p) => !p);
        }
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, []);

    // Pausa o reanuda las escenas de Phaser según el estado
    useEffect(() => {
        const escenas = juego.current?.scene;
        if (!escenas) return;

        if (pausado) {
            escenasPausadas.current = escenas.getScenes(true); // las que están corriendo
            escenasPausadas.current.forEach((s) => s.scene.pause());
        } else {
            escenasPausadas.current.forEach((s) => s.scene.resume());
            escenasPausadas.current = [];
        }
    }, [pausado]);

    return (
        <div style={{
            width: '100vw', height: '100vh', backgroundColor: '#1a1a1a',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div ref={contenedor} />
            <Link href={RUTA_MENU} id="menu-link">
                Menú
            </Link>

            {pausado && (
                <MenuPausa
                    onSeguir={() => setPausado(false)}
                    onSalir={() => navigate(RUTA_MENU)}
                    onAjustes={() => navigate(RUTA_AJUSTES)}
                />
            )}
        </div>
    );
}