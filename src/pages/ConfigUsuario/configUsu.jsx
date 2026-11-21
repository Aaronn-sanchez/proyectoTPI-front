import { useState } from 'react';
import './configUsu.css';
import Layout from '../../componentes/Layout';
import Caja from '../../componentes/Caja'

// Datos de ejemplo (después vendrán del backend)
const PERFILES = [
    { id: 1, nombre: 'Para estar en casa' },
    { id: 2, nombre: 'Solo' },
];

export default function ConfigUsuario() {
    const [volumen, setVolumen] = useState(75);
    const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

    // Si tocás el que ya está elegido, se deselecciona y la X desaparece
    function elegirPerfil(id) {
        setPerfilSeleccionado(perfilSeleccionado === id ? null : id);
    }

    return (
        <Layout>
            <Caja>
                <main className="contenedor-ajustes">
                    <h1>Ajustes</h1>

                    <section className="seccion-ajuste">
                        <h2>Musica</h2>
                        <input
                            type="range"
                            className="slider-musica"
                            min="0"
                            max="100"
                            value={volumen}
                            onChange={(e) => setVolumen(Number(e.target.value))}
                            style={{ '--valor': volumen }}
                            aria-label="Volumen de la música"
                        />
                    </section>

                    <section className="seccion-ajuste">
                        <h2>Idioma/Language</h2>
                        <div className="contenedor-idiomas">
                            <button type="button" className="btn-idioma">Español</button>
                            <button type="button" className="btn-idioma">English</button>
                        </div>
                    </section>

                    <section className="seccion-ajuste">
                        <h2>Mis tipos de configuraciones</h2>
                        <p className="subtitulo-perfiles">Añadi hasta 3 perfiles de configuracion</p>

                        {PERFILES.map((perfil) => {
                            const elegido = perfilSeleccionado === perfil.id;

                            return (
                                <div className="fila-perfil" key={perfil.id}>
                                    <button
                                        type="button"
                                        className={`btn-perfil ${elegido ? 'perfil-seleccionado' : ''}`}
                                        onClick={() => elegirPerfil(perfil.id)}
                                        aria-pressed={elegido}
                                    >
                                        {perfil.nombre}
                                    </button>

                                    {/* La X solo existe mientras el perfil está elegido */}
                                    {elegido && (
                                        <button
                                            type="button"
                                            className="btn-cerrar-perfil"
                                            aria-label={`Borrar perfil ${perfil.nombre}`}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        <form className="fila-perfil" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                className="input-perfil"
                                placeholder="Añadir +"
                                maxLength={30}
                            />
                            <button type="submit" className="btn-guardar-perfil">Guardar</button>
                        </form>
                    </section>

                    <button className="btn-azul btn-atras" onClick={() => window.history.back()}>← Atras</button>
                </main>
            </Caja>
        </Layout>
    );
}