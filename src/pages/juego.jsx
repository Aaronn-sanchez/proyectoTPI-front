import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Link } from 'wouter';
import { crearConfig } from '../game/config';
import '../App.css';

export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);

    useEffect(() => {
        if (juego.current) return;
        juego.current = new Phaser.Game(crearConfig(contenedor.current));

        return () => {
            juego.current?.destroy(true);
            juego.current = null;
        };
    }, []);

    return (
        <div style={{
            width: '100vw', height: '100vh', backgroundColor: '#1a1a1a',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div ref={contenedor} />
            <Link href="/" id="menu-link">
                Menú
            </Link>
        </div >
    );
}