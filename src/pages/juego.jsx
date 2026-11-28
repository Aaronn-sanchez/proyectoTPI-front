import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import { obtenerNivel } from '../game/niveles';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import NivelCompletado from '../componentes/Nivel_Completado/NivelCompletado';
import PanelQA from '../componentes/panel-qa/PanelQA';
import PantallaCarga from './pantallaCarga/pantallaCarga';
import { iniciarNivel, completarNivel } from '../api/niveles';
import { obtenerUltimoGuardado } from '../api/checkpoint';
import { puedeVerPanelQA, refrescarSesion } from "../game/utilidades/permisos.js";

// La pantalla de carga se queda al menos este tiempo (para poder leer el dato curioso)
const MIN_CARGA_MS = 1500;
// Si el nivel no termina de cargar en este tiempo, se muestra el error
const TIMEOUT_CARGA_MS = 30000;

// "id" llega desde la ruta /jugar/:id (ver App.jsx)
export default function Juego({ id }) {
    const idNivel = Number(id);
    const nivel = obtenerNivel(idNivel);

    const contenedor = useRef(null);
    const juego = useRef(null);
    const inicioCarga = useRef(Date.now());

    const [pausado, setPausado] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [fin, setFin] = useState(null);
    const [listo, setListo] = useState(false);        // el nivel terminó de cargar
    const [errorCarga, setErrorCarga] = useState(false);
    const [, setLocation] = useLocation();

    const [guardadoSeleccionado, setGuardadoSeleccionado] = useState(null);
    const [reinicio, setReinicio] = useState(0);

    // NUEVO: panel QA
    const [qaAbierto, setQaAbierto] = useState(false);
    const [puedeQA, setPuedeQA] = useState(puedeVerPanelQA());

    // NUEVO: permisos al día cada vez que se entra a un nivel
    useEffect(() => {
        refrescarSesion()
            .then(() => setPuedeQA(puedeVerPanelQA()))
            .catch(() => {});
    }, []);

    // Si el id no corresponde a un nivel jugable, vuelve al mapa
    useEffect(() => {
        if (!nivel) setLocation('/niveles');
    }, [nivel, setLocation]);

    // La API valida que el nivel esté desbloqueado para este usuario
    useEffect(() => {
        if (!nivel) return;

        let cancelado = false;

        iniciarNivel(idNivel)
            .then(() => {
                if (!cancelado) setAutorizado(true);
            })
            .catch(() => {
                if (!cancelado) setLocation('/niveles');
            });

        return () => {
            cancelado = true;
        };
    }, [nivel, idNivel, setLocation]);

    // El juego se crea recién cuando la API da el OK
    useEffect(() => {
        if (!nivel || !autorizado || juego.current) return;

        let cancelado = false;
        let temporizadorListo;
        let limite;
        let terminado = false;

        async function prepararJuego() {
            let guardado = guardadoSeleccionado;

            if (!guardado) {
                try {
                    const respuesta = await obtenerUltimoGuardado(idNivel);
                    guardado = respuesta.guardado;
                } catch (error) {
                    console.error('No se pudo consultar el último guardado:', error);
                }
            }

            if (cancelado) return;

            juego.current = new Phaser.Game(
                crearConfig(contenedor.current, nivel, guardado)
            );

            const game = juego.current;

            // La escena avisa cuando terminó de cargar (o si algo falló)
            const alTerminar = () => {
                terminado = true;

                const falta = Math.max(
                    0,
                    MIN_CARGA_MS - (Date.now() - inicioCarga.current)
                );

                temporizadorListo = setTimeout(() => {
                    setListo(true);
                }, falta);
            };

            const alFallar = () => {
                terminado = true;
                setErrorCarga(true);
            };

            limite = setTimeout(() => {
                if (!terminado) setErrorCarga(true);
            }, TIMEOUT_CARGA_MS);

            game.events.on('nivel-listo', alTerminar);
            game.events.on('nivel-error-carga', alFallar);
            game.events.on('nivel-completado', guardarFin);
        }

        prepararJuego();

        return () => {
            cancelado = true;

            clearTimeout(limite);
            clearTimeout(temporizadorListo);

            juego.current?.destroy(true);
            juego.current = null;
        };
    }, [nivel, autorizado, reinicio, guardadoSeleccionado]);

    // Guarda el nivel como completado en la API
    async function guardarFin() {
        setFin('guardando');

        try {
            await completarNivel(idNivel);
            setFin('ok');
        } catch {
            setFin('error');
        }
    }

    // Pausa o reanuda la escena de Phaser (CAMBIO: ahora también con el panel QA abierto)
    useEffect(() => {
        if (!nivel || !juego.current) return;

        const manager = juego.current.scene;

        if (pausado || fin || qaAbierto) {
            if (manager.isActive(nivel.clave)) manager.pause(nivel.clave);
        } else {
            if (manager.isPaused(nivel.clave)) manager.resume(nivel.clave);
        }
    }, [nivel, pausado, fin, qaAbierto, autorizado]);

    // Escape abre y cierra el menú de pausa (no mientras está cargando)
    // CAMBIO: si el panel QA está abierto, Escape lo cierra
    useEffect(() => {
        const alApretar = (e) => {
            if (e.key !== 'Escape' || fin || !listo) return;

            if (qaAbierto) setQaAbierto(false);
            else setPausado((p) => !p);
        };

        window.addEventListener('keydown', alApretar);

        return () => {
            window.removeEventListener('keydown', alApretar);
        };
    }, [fin, listo, qaAbierto]);

    function cargarGuardado(guardado) {
        const confirmar = window.confirm(
            '¿Estás seguro de que quieres cargar esta partida?\n\nSe perderá el progreso que no hayas guardado.'
        );

        if (!confirmar) return;

        setGuardadoSeleccionado(guardado);
        setPausado(false);
        setQaAbierto(false);
        setListo(false);
        setErrorCarga(false);
        inicioCarga.current = Date.now();

        setReinicio((actual) => actual + 1);
    }

    // Todos los hooks ya se ejecutaron: recién acá se puede cortar el render
    if (!nivel) return null;

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

            {/* NUEVO: botón del panel QA (justo debajo del botón Menú) */}
            {puedeQA && listo && !pausado && !fin && !qaAbierto && (
                <button className="btn-abrir-qa" onClick={() => setQaAbierto(true)}>
                    Panel QA
                </button>
            )}

            {/* NUEVO: el panel */}
            {qaAbierto && (
                <PanelQA
                    onCerrar={() => setQaAbierto(false)}
                    obtenerEscena={() => juego.current?.scene.getScene(nivel.clave)}
                />
            )}

  {pausado && !fin && (
    <MenuPausa
        idNivel={idNivel}
        obtenerEstado={() => juego.current?.scene.getScene(nivel.clave)?.capturarEstado()}
        obtenerEscena={() => juego.current?.scene.getScene(nivel.clave)}
        onSeleccionar={cargarGuardado}
        onContinuar={() => setPausado(false)}
        onAjustes={() => setLocation('/ajustes')}
        onSalir={() => setLocation('/niveles')}
    />
)}
              

            {fin && (
                <NivelCompletado
                    estado={fin}
                    nombreNivel={nivel.nombre}
                    onReintentar={guardarFin}
                    onVolver={() => setLocation('/niveles')}
                />
            )}

            <PantallaCarga
                visible={!listo}
                error={errorCarga}
                onVolver={() => setLocation('/niveles')}
            />
        </div>
    );
}