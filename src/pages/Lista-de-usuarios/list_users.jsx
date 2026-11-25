import { useEffect, useState } from 'react';
import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import { listarUsuarios, deshabilitarUsuario } from '../../api/usuarios';
import './list_user.css';

export default function ListaUsers() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [seleccionado, setSeleccionado] = useState(null);

    useEffect(() => {
        let cancelado = false;

        listarUsuarios()
            .then((datos) => {
                if (!cancelado) setUsuarios(datos.usuarios);
            })
            .catch((e) => {
                if (!cancelado) {
                    setError(e.response?.data?.error || 'No se pudieron cargar los usuarios');
                }
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });

        return () => {
            cancelado = true;
        };
    }, []);

    function elegir(id) {
        setSeleccionado(seleccionado === id ? null : id);
    }

    async function deshabilitar(usuario) {
        if (!window.confirm(`¿Deshabilitar la cuenta de "${usuario.nombre || usuario.email}"?`)) {
            return;
        }

        try {
            await deshabilitarUsuario(usuario.id_usuario);
            setUsuarios((lista) =>
                lista.filter((u) => u.id_usuario !== usuario.id_usuario)
            );
            setSeleccionado(null);
            setError('');
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo deshabilitar la cuenta');
        }
    }

    return (
        <Layout>
            <CajaMenu className="lista-usuarios-caja">
                <div className="contenedor-principal">

                    <section className="contenedor-de-lista-de-usuarios">
                        <h1>Lista de Usuarios</h1>

                        {cargando && (
                            <p className="usuarios-mensaje">Cargando usuarios...</p>
                        )}

                        {error && (
                            <p className="usuarios-mensaje usuarios-mensaje--error">
                                {error}
                            </p>
                        )}

                        {!cargando && !error && usuarios.length === 0 && (
                            <p className="usuarios-mensaje">
                                No hay usuarios para mostrar.
                            </p>
                        )}

                        {usuarios.map((u) => {
                            const elegido = seleccionado === u.id_usuario;

                            return (
                                <div
                                    key={u.id_usuario}
                                    className={`tarjeta-de-usuarios ${elegido ? 'tarjeta-seleccionada' : ''}`}
                                    onClick={() => elegir(u.id_usuario)}
                                >
                                    <p>{u.nombre || u.email}</p>

                                    {elegido && (
                                        <div className="contenedor-acciones">
                                            <div className="modificar">Modificar</div>

                                            <button
                                                type="button"
                                                className="btn-cerrar-usuario-lista"
                                                aria-label={`Deshabilitar a ${u.nombre || u.email}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deshabilitar(u);
                                                }}
                                            >
                                                x
                                            </button>
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
                                        Elegí un usuario y tocá Modificar para cambiar sus servicios.
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

                <button
                    type="button"
                    className="btn-azul btn-atras"
                    onClick={() => window.history.back()}
                >
                    ← Atras
                </button>
            </CajaMenu>
        </Layout>
    );
}
