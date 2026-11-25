import { useEffect, useState } from "react";
import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import { listarUsuarios, renombrarUsuario } from "../../api/usuarios";
import './list_user.css';
import '../../componentes/btn-volver.css';

export default function ListaUsers() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [seleccionado, setSeleccionado] = useState(null);

    // Edición del nombre
    const [editando, setEditando] = useState(null);
    const [nombreEditado, setNombreEditado] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState('');

    useEffect(() => {
        let cancelado = false;

        listarUsuarios()
            .then((datos) => { if (!cancelado) setUsuarios(datos.usuarios ?? []); })
            .catch((e) => {
                if (!cancelado) {
                    setError(e.response?.data?.error || 'No se pudo cargar la lista de usuarios');
                }
            })
            .finally(() => { if (!cancelado) setCargando(false); });

        return () => { cancelado = true; };
    }, []);

    function alternarSeleccion(id) {
        setSeleccionado((actual) => (actual === id ? null : id));
    }

    function empezarEdicion(usuario) {
        setEditando(usuario.id_usuario);
        setNombreEditado(usuario.nombre);
        setErrorEdicion('');
    }

    function cancelarEdicion() {
        setEditando(null);
        setNombreEditado('');
        setErrorEdicion('');
    }

    async function guardarNombre(e, usuario) {
        e.preventDefault();
        const nombre = nombreEditado.trim();

        if (!nombre) {
            setErrorEdicion('El nombre no puede estar vacío');
            return;
        }
        if (nombre === usuario.nombre) {
            cancelarEdicion();
            return;
        }

        setGuardando(true);
        setErrorEdicion('');
        try {
            const actualizado = await renombrarUsuario(usuario.id_usuario, nombre);
            // Se actualiza en pantalla y se mantiene el orden alfabético del back
            setUsuarios((lista) =>
                lista
                    .map((u) => (u.id_usuario === usuario.id_usuario ? { ...u, nombre: actualizado.nombre } : u))
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
            );
            cancelarEdicion();
        } catch (err) {
            setErrorEdicion(err.response?.data?.error || 'No se pudo cambiar el nombre');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Layout>
            <CajaMenu>
                <div className="contenedor-principal">

                    <section className="contenedor-de-lista-de-usuarios">
                        <h1>Lista de Usuarios</h1>

                        {cargando && <p>Cargando usuarios...</p>}
                        {!cargando && error && <p>{error}</p>}
                        {!cargando && !error && usuarios.length === 0 && (
                            <p>No hay usuarios registrados.</p>
                        )}

                        {usuarios.map((u) => {
                            const elegido = seleccionado === u.id_usuario;
                            const enEdicion = editando === u.id_usuario;

                            return (
                                <div
                                    key={u.id_usuario}
                                    className={`tarjeta-de-usuarios${elegido ? ' tarjeta-seleccionada' : ''}`}
                                    onClick={() => { if (!enEdicion) alternarSeleccion(u.id_usuario); }}
                                >
                                    {enEdicion ? (
                                        <form
                                            className="form-editar-usuario"
                                            onClick={(e) => e.stopPropagation()}
                                            onSubmit={(e) => guardarNombre(e, u)}
                                        >
                                            <input
                                                type="text"
                                                value={nombreEditado}
                                                maxLength={50}
                                                autoFocus
                                                disabled={guardando}
                                                onChange={(e) => setNombreEditado(e.target.value)}
                                            />
                                            <button type="submit" disabled={guardando}>
                                                {guardando ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button type="button" disabled={guardando} onClick={cancelarEdicion}>
                                                Cancelar
                                            </button>
                                            {errorEdicion && <small className="error-edicion">{errorEdicion}</small>}
                                        </form>
                                    ) : (
                                        <p>{u.nombre}</p>
                                    )}

                                    {elegido && !enEdicion && (
                                        <div className="contenedor-acciones">
                                            <div
                                                className="modificar"
                                                onClick={(e) => { e.stopPropagation(); empezarEdicion(u); }}
                                            >
                                                Modificar
                                            </div>
                                            <span className="btn-cerrar-usuario-lista">x</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>

                    <div className="divisor-vertical"></div>

                    <section className="contenedor-de-roles">
                        <h1>Roles de usuarios</h1>

                        <div className="roles-contenido">
                            <div className="roles-columna-izquierda">

                                <form
                                    className="tarjeta-amarilla formulario-rol"
                                    onSubmit={(e) => e.preventDefault()}
                                >
                                    <h2>Crea un nuevo Rol</h2>
                                    <label className="campo-nombre-rol">
                                        Nombre del rol:
                                        <input type="text" maxLength={30} />
                                    </label>
                                    <small>
                                        Haga click en los usuarios que quiera tener este rol
                                        (Los usuarios elegidos se pondrán en violeta)
                                    </small>
                                    <div className="formulario-rol-pie">
                                        <button type="submit" className="btn-guardar-rol">
                                            Guardar
                                        </button>
                                    </div>
                                </form>

                                <div className="tarjeta-amarilla servicios-checklist">
                                    <h2>Servicios del Rol 1</h2>

                                    <label className="servicio-item">
                                        <input type="checkbox" defaultChecked />
                                        Modificar la gravedad
                                    </label>
                                    <label className="servicio-item">
                                        <input type="checkbox" />
                                        Atravesar paredes
                                    </label>
                                    <label className="servicio-item">
                                        <input type="checkbox" defaultChecked />
                                        Modificar velocidad
                                    </label>
                                    <label className="servicio-item">
                                        <input type="checkbox" />
                                        Elegir el checkpoint de la partida
                                    </label>
                                    <label className="servicio-item">
                                        <input type="checkbox" />
                                        Desbloquear todos los niveles
                                    </label>

                                    <small>
                                        Elegí un usuario y tocá Modificar para cambiar su nombre.
                                    </small>
                                </div>
                            </div>

                            <div className="lista-de-roles">
                                <div className="rol-creado">
                                    <p>Rol 1</p>
                                    <span className="btn-cerrar-rol">x</span>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                <button className="btn-volver" onClick={() => window.history.back()}>← Atras</button>
            </CajaMenu>
        </Layout>
    );
}