import { useEffect, useState } from 'react';
import Layout from '../../componentes/Layout';
import CajaMenu from '../../componentes/Caja';
import { obtenerLogros } from '../../api/logros';
import './logros.css';

// Porcentaje de 0 a 100; si la meta fuera 0 no se divide
function porcentaje(progreso, meta) {
    if (!meta || meta <= 0) return 0;
    return Math.min((progreso / meta) * 100, 100);
}

export default function Logros() {
    const [logros, setLogros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;

        obtenerLogros()
            .then((datos) => { if (!cancelado) setLogros(datos.logros); })
            .catch((e) => {
                if (!cancelado) {
                    setError(e.response?.data?.error || 'No se pudieron cargar los logros');
                }
            })
            .finally(() => { if (!cancelado) setCargando(false); });

        return () => { cancelado = true; };
    }, []);

    return (
        <Layout>
            <CajaMenu>
                <h1>Mis logros</h1>

                <main className="contenedor-de-logros">
                    {cargando && <p className="logros-mensaje">Cargando logros...</p>}

                    {!cargando && error && <p className="logros-mensaje">{error}</p>}

                    {!cargando && !error && logros.length === 0 && (
                        <p className="logros-mensaje">Todavía no hay logros disponibles.</p>
                    )}

                    {logros.map((l) => (
                        <div
                            key={l.id_logro}
                            className={l.desbloqueado ? 'logro' : 'logro logro--bloqueado'}
                        >
                            <div className="logro__imagen">
                                <img
                                    src={`/img/logro/${l.codigo.toLowerCase()}.png`}
                                    alt={l.titulo}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                            <div className="logro__info">
                                <h3>{l.titulo}</h3>
                                <p>{l.descripcion}</p>

                                <div className="logro__progreso">
                                    <div
                                        className="logro__barra"
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={l.meta}
                                        aria-valuenow={l.progreso}
                                    >
                                        <div
                                            className="logro__barra-relleno"
                                            style={{ width: `${porcentaje(l.progreso, l.meta)}%` }}
                                        />
                                    </div>
                                    <small>{l.progreso} / {l.meta}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>


                <button className="btn-volver" onClick={() => window.history.back()}>
                    ← Volver
                </button>
            </CajaMenu>
        </Layout>
    );
}