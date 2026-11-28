
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import { obtenerNivel } from '../game/niveles';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import NivelCompletado from '../componentes/Nivel_Completado/NivelCompletado';
import PantallaCarga from './pantallaCarga/pantallaCarga';
import { iniciarNivel, completarNivel } from '../api/niveles';
import { obtenerUltimoGuardado } from '../api/checkpoint';
import NotificacionLogro from '../componentes/notificar/notificarLogro';
import './juego.css';

// La pantalla de carga se queda al menos este tiempo
const MIN_CARGA_MS = 1500;

// Tiempo máximo de espera para cargar el nivel
const TIMEOUT_CARGA_MS = 30000;

export default function Juego({ id }) {
    const idNivel = Number(id);
    const nivel = obtenerNivel(idNivel);

    const contenedor = useRef(null);
    const juego = useRef(null);
    const inicioCarga = useRef(Date.now());

    const [pausado, setPausado] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [fin, setFin] = useState(null);
    const [listo, setListo] = useState(false);
    const [errorCarga, setErrorCarga] = useState(false);
    const [, setLocation] = useLocation();
    const [notificacionLogro, setNotificacionLogro] = useState(null);

    const [guardadoSeleccionado, setGuardadoSeleccionado] = useState(null);
    const [reinicio, setReinicio] = useState(0);
    const [muertes, setMuertes] = useState(0);

    function finalizarNotificacion() {
        setNotificacionLogro(null);
    }

    // Si el id no corresponde a un nivel jugable, vuelve al mapa
    useEffect(() => {
        if (!nivel) setLocation('/niveles');
    }, [nivel, setLocation]);

    // La API valida que el nivel esté desbloqueado
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

    // Crear el juego de Phaser cuando la API da autorización
    useEffect(() => {
        if (!nivel || !autorizado || juego.current) return;

        let cancelado = false;
        let temporizadorListo;
        let limite;
        let terminado = false;

        let alDesbloquearLogro = null;
        let alActualizarMuertes = null;
        let alTerminar = null;
        let alFallar = null;

        async function prepararJuego() {
            let guardado = guardadoSeleccionado;

            if (!guardado) {
                try {
                    const respuesta = await obtenerUltimoGuardado(idNivel);
                    guardado = respuesta.guardado;
                } catch (error) {
                    console.error(
                        'No se pudo consultar el último guardado:',
                        error
                    );
                }
            }

            if (cancelado) return;

            // Crear Phaser
            juego.current = new Phaser.Game(
                crearConfig(contenedor.current, nivel, guardado)
            );

            const game = juego.current;

            // Reiniciar el contador al iniciar o cargar una partida
            setMuertes(0);

            // Escuchar actualizaciones de muertes
            alActualizarMuertes = (cantidad) => {
                setMuertes(cantidad);
            };

            game.events.on(
                'muertes-actualizadas',
                alActualizarMuertes
            );

            // Sonido y notificación de logros
            const sonidoTrofeo = new Audio('/assets/audio/ps4-trophy.mp3');

            alDesbloquearLogro = (logro) => {
                setNotificacionLogro(logro);

                sonidoTrofeo.currentTime = 0;
                sonidoTrofeo.play().catch((error) => {
                    console.error(
                        'No se pudo reproducir el sonido del trofeo:',
                        error
                    );
                });
            };

            game.events.on(
                'logro-desbloqueado',
                alDesbloquearLogro
            );

            // La escena avisa cuando terminó de cargar
            alTerminar = () => {
                terminado = true;

                const falta = Math.max(
                    0,
                    MIN_CARGA_MS - (Date.now() - inicioCarga.current)
                );

                temporizadorListo = setTimeout(() => {
                    setListo(true);
                }, falta);
            };

            // La escena avisa si hubo un error
            alFallar = () => {
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

        // Limpiar eventos y destruir Phaser
        return () => {
            cancelado = true;

            clearTimeout(limite);
            clearTimeout(temporizadorListo);

            const game = juego.current;

            if (game) {
                if (alActualizarMuertes) {
                    game.events.off(
                        'muertes-actualizadas',
                        alActualizarMuertes
                    );
                }

                if (alDesbloquearLogro) {
                    game.events.off(
                        'logro-desbloqueado',
                        alDesbloquearLogro
                    );
                }

                if (alTerminar) {
                    game.events.off('nivel-listo', alTerminar);
                }

                if (alFallar) {
                    game.events.off('nivel-error-carga', alFallar);
                }

                game.events.off('nivel-completado', guardarFin);

                game.destroy(true);
                juego.current = null;
            }
        };
    }, [nivel, autorizado, reinicio, guardadoSeleccionado]);

    // Guardar el nivel como completado en la API
    async function guardarFin() {
        setFin('guardando');

        try {
            await completarNivel(idNivel);
            setFin('ok');
        } catch {
            setFin('error');
        }
    }

    // Pausar o reanudar la escena de Phaser
    useEffect(() => {
        if (!nivel || !juego.current) return;

        const manager = juego.current.scene;

        if (pausado || fin) {
            if (manager.isActive(nivel.clave)) {
                manager.pause(nivel.clave);
            }
        } else {
            if (manager.isPaused(nivel.clave)) {
                manager.resume(nivel.clave);
            }
        }
    }, [nivel, pausado, fin, autorizado]);

    // Escape abre y cierra el menú de pausa
    useEffect(() => {
        const alApretar = (e) => {
            if (e.key === 'Escape' && !fin && listo) {
                setPausado((p) => !p);
            }
        };

        window.addEventListener('keydown', alApretar);

        return () => {
            window.removeEventListener('keydown', alApretar);
        };
    }, [fin, listo]);

    // Cargar una partida guardada
    function cargarGuardado(guardado) {
        const confirmar = window.confirm(
            '¿Estás seguro de que quieres cargar esta partida?\n\nSe perderá el progreso que no hayas guardado.'
        );

        if (!confirmar) return;

        setGuardadoSeleccionado(guardado);
        setPausado(false);
        setListo(false);
        setErrorCarga(false);
        inicioCarga.current = Date.now();

        setReinicio((actual) => actual + 1);
    }

    if (!nivel) return null;

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <div ref={contenedor} />

            {notificacionLogro && (
                <NotificacionLogro
                    logro={notificacionLogro}
                    onFinalizar={finalizarNotificacion}
                />
            )}

            <button
                id="menu-link"
                onClick={() => setPausado(true)}
            >
                Menú
            </button>

            {pausado && !fin && (
                <MenuPausa
                    idNivel={idNivel}
                    obtenerEstado={() =>
                        juego.current
                            ?.scene.getScene(nivel.clave)
                            ?.capturarEstado()
                    }
                    onSeleccionar={cargarGuardado}
                    onContinuar={() => setPausado(false)}
                    onAjustes={() => setLocation('/ajustes')}
                    onSalir={() => setLocation('/niveles')}
                />
            )}

            <div className="contador-muertes">
                <span>💀:</span>
                <strong>{muertes}</strong>
            </div>

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
