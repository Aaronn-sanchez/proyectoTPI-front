
import { useEffect, useState } from 'react';
import './configUsu.css';
import '../../componentes/btn-volver.css';
import Layout from '../../componentes/Layout';
import Caja from '../../componentes/Caja';
import {
    obtenerConfiguracion,
    actualizarConfiguracion,
    crearPerfil,
    aplicarPerfil,
    borrarPerfil,
} from '../../api/configuracion';

export default function ConfigUsuario() {
    const [volumen, setVolumen] = useState(100);
    const [idioma, setIdioma] = useState(0);
    const [perfiles, setPerfiles] = useState([]);
    const [maxPerfiles, setMaxPerfiles] = useState(3);

    const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [error, setError] = useState('');

    function mostrar(datos) {
        setVolumen(datos.configuracion.volumen_musica);
        setIdioma(datos.configuracion.idioma);
        setPerfiles(datos.perfiles);
        setMaxPerfiles(datos.maxPerfiles);
        setError('');
    }

    async function ejecutar(accion) {
        try {
            mostrar(await accion());
        } catch (e) {
            setError(e.message);
        }
    }

    useEffect(() => {
        ejecutar(obtenerConfiguracion);
    }, []);

    function guardarVolumen() {
        ejecutar(() => actualizarConfiguracion({ volumen_musica: volumen }));
    }

    function elegirIdioma(valor) {
        ejecutar(() => actualizarConfiguracion({ idioma: valor }));
    }

    function elegirPerfil(perfil) {
        if (perfilSeleccionado === perfil.id_perfil) {
            setPerfilSeleccionado(null);
            return;
        }

        setPerfilSeleccionado(perfil.id_perfil);
        ejecutar(() => aplicarPerfil(perfil.id_perfil));
    }

    async function anadirPerfil(e) {
        e.preventDefault();

        const nombre = nuevoNombre.trim();
        if (!nombre) return;

        try {
            mostrar(await crearPerfil(nombre));
            setNuevoNombre('');
        } catch (err) {
            setError(err.message);
        }
    }

    async function eliminarPerfil(id) {
        await ejecutar(() => borrarPerfil(id));
        setPerfilSeleccionado(null);
    }

    return (
        <Layout>
            <Caja className="caja-ajustes">
                <main className="contenedor-ajustes">
                    <h1>Ajustes</h1>

                    {error && (
                        <p className="ajustes-error">{error}</p>
                    )}

                    <section className="seccion-ajuste">
                        <h2>Música</h2>

                        <input
                            type="range"
                            className="slider-musica"
                            min="0"
                            max="100"
                            value={volumen}
                            onChange={(e) => setVolumen(Number(e.target.value))}
                            onPointerUp={guardarVolumen}
                            onKeyUp={guardarVolumen}
                            style={{ '--valor': volumen }}
                            aria-label="Volumen de la música"
                        />
                    </section>

                    <section className="seccion-ajuste">
                        <h2>Idioma / Language</h2>

                        <div className="contenedor-idiomas">
                            <button
                                type="button"
                                className={`btn-idioma ${idioma === 0 ? 'btn-idioma--activo' : ''}`}
                                onClick={() => elegirIdioma(0)}
                            >
                                Español
                            </button>

                            <button
                                type="button"
                                className={`btn-idioma ${idioma === 1 ? 'btn-idioma--activo' : ''}`}
                                onClick={() => elegirIdioma(1)}
                            >
                                English
                            </button>
                        </div>
                    </section>

                    <section className="seccion-ajuste">
                        <h2>Mis tipos de configuraciones</h2>

                        <p className="subtitulo-perfiles">
                            Añadí hasta {maxPerfiles} perfiles de configuración
                        </p>

                        {perfiles.map((perfil) => {
                            const elegido = perfilSeleccionado === perfil.id_perfil;

                            return (
                                <div className="fila-perfil" key={perfil.id_perfil}>
                                    <button
                                        type="button"
                                        className={`btn-perfil ${elegido ? 'perfil-seleccionado' : ''}`}
                                        onClick={() => elegirPerfil(perfil)}
                                        aria-pressed={elegido}
                                    >
                                        {perfil.nombre}
                                    </button>

                                    {elegido && (
                                        <button
                                            type="button"
                                            className="btn-cerrar-perfil"
                                            aria-label={`Borrar perfil ${perfil.nombre}`}
                                            onClick={() => eliminarPerfil(perfil.id_perfil)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {perfiles.length < maxPerfiles && (
                            <form className="fila-perfil" onSubmit={anadirPerfil}>
                                <input
                                    type="text"
                                    className="input-perfil"
                                    placeholder="Añadir +"
                                    maxLength={30}
                                    value={nuevoNombre}
                                    onChange={(e) => setNuevoNombre(e.target.value)}
                                />

                                <button type="submit" className="btn-guardar-perfil">
                                    Guardar
                                </button>
                            </form>
                        )}
                    </section>

                    <button
                        type="button"
                        className="btn-azul btn-atras btn-volver"
                        onClick={() => window.history.back()}
                    >
                        ← Atrás
                    </button>
                </main>
            </Caja>
        </Layout>
    );
}
