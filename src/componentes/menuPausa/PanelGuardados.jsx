import { useEffect, useState } from 'react';
import { listarGuardados, crearGuardado, reescribirGuardado, borrarGuardado, } from '../../api/checkpoint';
import './PanelGuardados.css';

export default function PanelGuardados({ idNivel, obtenerEstado }) {
    const [datos, setDatos] = useState({ guardados: [], max: 5, disponibles: 5 });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [formulario, setFormulario] = useState(null); // null | { id: null | número }
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function refrescar() {
        setDatos(await listarGuardados(idNivel));
    }

    useEffect(() => {
        let cancelado = false;
        listarGuardados(idNivel)
            .then((d) => { if (!cancelado) setDatos(d); })
            .catch(() => { if (!cancelado) setError('No se pudieron cargar los guardados'); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [idNivel]);

    function abrirNuevo() {
        setError('');
        setDescripcion('');
        setFormulario({ id: null });
    }

    function abrirReescribir(g) {
        setError('');
        setDescripcion(g.nombre);
        setFormulario({ id: g.id_checkpoint });
    }

    async function confirmar() {
        const nombre = descripcion.trim();
        if (!nombre || enviando) return;

        const estado = obtenerEstado();
        if (!estado) {
            setError('No se pudo leer el estado de la partida');
            return;
        }

        setEnviando(true);
        setError('');
        try {
            if (formulario.id === null) {
                await crearGuardado({ id_nivel: idNivel, nombre, ...estado });
            } else {
                await reescribirGuardado(formulario.id, { nombre, ...estado });
            }
            await refrescar();
            setFormulario(null);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo guardar');
        } finally {
            setEnviando(false);
        }
    }

    async function borrar(g) {
        if (!window.confirm(`¿Borrar el guardado "${g.nombre}"?`)) return;
        setError('');
        try {
            await borrarGuardado(g.id_checkpoint);
            if (formulario?.id === g.id_checkpoint) setFormulario(null);
            await refrescar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo borrar');
        }
    }

    return (
        <aside className="panel-guardados">
            <div className="panel-aviso">
                <strong>tienes disponibles {datos.disponibles} guardados</strong>
                <p>si ya utilizaste todos, puedes reescribir tus guardados anteriores o eliminarlos y crear uno nuevo</p>
            </div>

            <div className="panel-lista">
                {cargando && <p className="panel-mensaje">Cargando...</p>}

                {datos.guardados.map((g) => (
                    <div className="panel-fila" key={g.id_checkpoint}>
                        <div className="panel-guardado">{g.nombre}</div>
                        <button type="button" className="panel-btn panel-btn-borrar"
                            aria-label={`Borrar ${g.nombre}`} onClick={() => borrar(g)}>🗑</button>
                        <button type="button" className="panel-btn panel-btn-editar"
                            aria-label={`Reescribir ${g.nombre}`} onClick={() => abrirReescribir(g)}>✎</button>
                    </div>
                ))}

                {formulario && (
                    <div className="panel-fila">
                        <input
                            className="panel-input"
                            type="text"
                            maxLength={50}
                            autoFocus
                            placeholder="introduce una breve descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
                        />
                        <button type="button" className="panel-btn panel-btn-ok"
                            aria-label="Confirmar guardado" disabled={enviando} onClick={confirmar}>✔</button>
                    </div>
                )}

                {!formulario && datos.disponibles > 0 && (
                    <button type="button" className="panel-nuevo" onClick={abrirNuevo}>
                        Nuevo guardado <span>+</span>
                    </button>
                )}

                {error && <p className="panel-mensaje panel-error">{error}</p>}
            </div>
        </aside>
    );
}