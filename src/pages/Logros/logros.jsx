import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import { useEffect, useState } from 'react';
import './logros.css';

export default function Logros() {
    const [logros, setLogros] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function cargar() {
            try {
                const res = await fetch('http://localhost:3000/api/logros', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (!res.ok) throw new Error('No se pudieron cargar los logros');
                const data = await res.json();
                setLogros(data.logros);
            } catch (e) {
                setError(e.message);
            }
        }
        cargar();
    }, []);

    if (error) return <p>{error}</p>;

    return (
        <Layout>
            <CajaMenu>
                <h1>Mis logros</h1>
                <main className="contenedor-de-logros">
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
                                    <div className="logro__barra">
                                        <div
                                            className="logro__barra-relleno"
                                            style={{ width: `${Math.min((l.progreso / l.meta) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <small>{l.progreso} / {l.meta}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
                <button className="btn-azul btn-atras" onClick={() => window.history.back()}>← Atras</button>

            </CajaMenu>
        </Layout>
    );
}