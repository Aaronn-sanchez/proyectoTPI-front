import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useLocation } from 'wouter';
import { crearConfig } from '../game/config';
import MenuPausa from '../componentes/menuPausa/MenuPausa';
import NivelCompletado from '../componentes/Nivel_Completado/NivelCompletado';
import PantallaCarga from './pantallaCarga/pantallaCarga';
import { iniciarNivel, completarNivel } from '../api/niveles';
import { obtenerUltimoGuardado } from '../api/checkpoint';

const ID_NIVEL = 0; // tutorial
const NOMBRE_NIVEL = 'Tutorial básico';

// La pantalla de carga se queda al menos este tiempo (para poder leer el dato curioso)
const MIN_CARGA_MS = 1500;
// Si el nivel no termina de cargar en este tiempo, se muestra el error
const TIMEOUT_CARGA_MS = 30000;

export default function Juego() {
    const contenedor = useRef(null);
    const juego = useRef(null);
    const inicioCarga = useRef(Date.now());

    const [pausado, setPausado] = useState(false);
    const [panelQAAbierto, setPanelQAAbierto] = useState(false);
    const [autorizado, setAutorizado] = useState(false);
    const [fin, setFin] = useState(null);
    const [listo, setListo] = useState(false);        // el nivel terminó de cargar
    const [errorCarga, setErrorCarga] = useState(false);
    const [, setLocation] = useLocation();

    const [guardadoSeleccionado, setGuardadoSeleccionado] = useState(null);
    const [reinicio, setReinicio] = useState(0);

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

        let cancelado = false;
        let temporizadorListo;
        let limite;
        let terminado = false;

        async function prepararJuego() {
            let guardado = guardadoSeleccionado;

            if (!guardado) {
                try {
                    const respuesta = await obtenerUltimoGuardado(ID_NIVEL);
                    guardado = respuesta.guardado;
                    console.log('Último guardado encontrado:', guardado);
                } catch (error) {
                    console.error('No se pudo consultar el último guardado:', error);
                }
            }

            if (cancelado) return;

            juego.current = new Phaser.Game(
                crearConfig(contenedor.current, guardado)
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
        }

        prepararJuego();

        return () => {
            cancelado = true;

            clearTimeout(limite);
            clearTimeout(temporizadorListo);

            juego.current?.destroy(true);
            juego.current = null;
        };
    }, [autorizado, reinicio, guardadoSeleccionado]);

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

    // Escape abre y cierra el menú de pausa (no mientras está cargando)
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
                    idNivel={ID_NIVEL}
                    obtenerEstado={() => juego.current?.scene.getScene('tutorialBasico')?.capturarEstado()}
                    onSeleccionar={cargarGuardado}
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

            <PantallaCarga
                visible={!listo}
                error={errorCarga}
                onVolver={() => setLocation('/niveles')}
            />
        </div>
    );
}