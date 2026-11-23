import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import PanelQA from '../componentes/panel-qa/PanelQA.jsx';
import { iniciarNivel } from '../api/niveles';
import '../App.css';

const ID_NIVEL = 0; // tutorial

const RUTA_NIVELES = '/niveles';
const RUTA_AJUSTES = '/ajustes';

export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);
    const [pausado, setPausado] = useState(false);
    const [panelQAAbierto, setPanelQAAbierto] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [, setLocation] = useLocation();

    // La API valida que el nivel esté desbloqueado para este usuario
    useEffect(() => {
        let cancelado = false;
        iniciarNivel(ID_NIVEL)
            .then(() => { if (!cancelado) setAutorizado(true); })
            .catch(() => { if (!cancelado) setLocation(RUTA_NIVELES); });
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

    // El juego queda congelado si el menú de pausa O el panel QA están abiertos
    useEffect(() => {
        if (!juego.current) return;
        if (pausado || panelQAAbierto) {
            juego.current.scene.pause('tutorialBasico');
        } else {
            juego.current.scene.resume('tutorialBasico');
        }
    }, [pausado, panelQAAbierto, autorizado]);

    // Esc: si el panel QA está abierto lo cierra; si no, abre o cierra la pausa
    useEffect(() => {
        function alTeclear(e) {
            if (e.key !== 'Escape') return;
            if (panelQAAbierto) {
                setPanelQAAbierto(false);
            } else {
                setPausado((p) => !p);
            }
        }
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [panelQAAbierto]);

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

            {/* Botón del panel: solo si no hay otra ventana abierta */}
            {!panelQAAbierto && !pausado && (
                <button type="button" className="btn-abrir-qa" onClick={() => setPanelQAAbierto(true)}>
                    Panel QATester
                </button>
            )}

            {pausado && (
                <MenuPausa
                    onContinuar={() => setPausado(false)}
                    onAjustes={() => setLocation(RUTA_AJUSTES)}
                    onSalir={() => setLocation(RUTA_NIVELES)}
                />
            )}

            {panelQAAbierto && <PanelQA onCerrar={() => setPanelQAAbierto(false)} />}
        </div>
    );
}