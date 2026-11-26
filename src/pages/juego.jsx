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
import './juego.css';

const ID_NIVEL = 0; // tutorial
const NOMBRE_NIVEL = 'Tutorial básico';

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

    // Pausa o reanuda la escena de Phaser
    useEffect(() => {
        if (!nivel || !juego.current) return;

        const manager = juego.current.scene;

        if (pausado || fin) {
            if (manager.isActive(nivel.clave)) manager.pause(nivel.clave);
        } else {
            if (manager.isPaused(nivel.clave)) manager.resume(nivel.clave);
        }
    }, [nivel, pausado, fin, autorizado]);

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
    <div className="juego-pantalla">
        <div
            ref={contenedor}
            className="juego-contenedor"
        />

        <button
            id="menu-link"
            onClick={() => setPausado(true)}
        >
            Menú
        </button>

        {pausado && !fin && (
            <MenuPausa
                idNivel={ID_NIVEL}
                obtenerEstado={() =>
                    juego.current
                        ?.scene.getScene('tutorialBasico')
                        ?.capturarEstado()
                }
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