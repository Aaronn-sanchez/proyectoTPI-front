import { useEffect, useState } from "react";
import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import { listarUsuarios, renombrarUsuario, asignarRol, quitarRol } from "../../api/usuarios";
import { listarRoles, listarServicios, crearRol, borrarRol, reemplazarServicios } from "../../api/roles";
import './list_user.css';
import '../../componentes/btn-volver.css';

// Este permiso es solo del QA: no se ofrece como servicio de los roles que se crean acá
const SERVICIO_RESERVADO = 'gestionar_roles';

function mensajeDe(err, porDefecto) {
    return err.response?.data?.error || porDefecto;
}

export default function ListaUsers() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // null = modo "crear rol nuevo"; un id = modo "editar ese rol"
    const [rolActivo, setRolActivo] = useState(null);

    // Formulario de rol nuevo
    const [nombreRol, setNombreRol] = useState('');
    const [usuariosNuevoRol, setUsuariosNuevoRol] = useState([]);
    const [serviciosNuevoRol, setServiciosNuevoRol] = useState([]);
    const [avisoServicios, setAvisoServicios] = useState(false);

    const [ocupado, setOcupado] = useState(false);
    const [errorRoles, setErrorRoles] = useState('');

    // Edición del nombre de un usuario
    const [editando, setEditando] = useState(null);
    const [nombreEditado, setNombreEditado] = useState('');
    const [errorEdicion, setErrorEdicion] = useState('');

    useEffect(() => {
        let cancelado = false;

        Promise.all([listarUsuarios(), listarRoles(), listarServicios()])
            .then(([datosUsuarios, datosRoles, datosServicios]) => {
                if (cancelado) return;
                setUsuarios(datosUsuarios.usuarios ?? []);
                setRoles(datosRoles.roles ?? []);
                setServicios(
                    (datosServicios.servicios ?? []).filter((s) => s.clave !== SERVICIO_RESERVADO)
                );
            })
            .catch((e) => {
                if (!cancelado) setError(mensajeDe(e, 'No se pudo cargar la lista de usuarios'));
            })
            .finally(() => { if (!cancelado) setCargando(false); });

        return () => { cancelado = true; };
    }, []);

    const rolElegido = roles.find((r) => r.id_rol === rolActivo) || null;

    function tieneRol(usuario, idRol) {
        return usuario.roles.some((r) => r.id_rol === idRol);
    }

    // ----- Roles -----

    function elegirRol(idRol) {
        setRolActivo((actual) => (actual === idRol ? null : idRol));
        setErrorRoles('');
    }

    async function guardarRol(e) {
        e.preventDefault();
        const nombre = nombreRol.trim();
        if (!nombre) {
            setErrorRoles('Escribí un nombre para el rol');
            return;
        }
        if (serviciosNuevoRol.length === 0) {
            setAvisoServicios(true);
            return;
        }

        setOcupado(true);
        setErrorRoles('');
        setAvisoServicios(false);
        try {
            const rol = await crearRol({
                nombre_rol: nombre,
                usuarios: usuariosNuevoRol,
                servicios: serviciosNuevoRol,
            });
            const resumen = { id_rol: rol.id_rol, nombre_rol: rol.nombre_rol };

            setRoles((lista) => [...lista, { ...resumen, servicios: rol.servicios }]);
            setUsuarios((lista) =>
                lista.map((u) =>
                    rol.usuarios.includes(u.id_usuario) ? { ...u, roles: [...u.roles, resumen] } : u
                )
            );
            setNombreRol('');
            setUsuariosNuevoRol([]);
            setServiciosNuevoRol([]);
            setRolActivo(rol.id_rol);
        } catch (err) {
            setErrorRoles(mensajeDe(err, 'No se pudo crear el rol'));
        } finally {
            setOcupado(false);
        }
    }

    async function eliminarRol(rol) {
        if (!window.confirm(`¿Eliminar el rol "${rol.nombre_rol}"? Se le quitará a todos los usuarios.`)) {
            return;
        }

        setOcupado(true);
        setErrorRoles('');
        try {
            await borrarRol(rol.id_rol);
            setRoles((lista) => lista.filter((r) => r.id_rol !== rol.id_rol));
            setUsuarios((lista) =>
                lista.map((u) => ({ ...u, roles: u.roles.filter((r) => r.id_rol !== rol.id_rol) }))
            );
            if (rolActivo === rol.id_rol) setRolActivo(null);
        } catch (err) {
            setErrorRoles(mensajeDe(err, 'No se pudo eliminar el rol'));
        } finally {
            setOcupado(false);
        }
    }

    async function alternarServicio(rol, idServicio) {
        const nuevos = rol.servicios.includes(idServicio)
            ? rol.servicios.filter((s) => s !== idServicio)
            : [...rol.servicios, idServicio];

        setOcupado(true);
        setErrorRoles('');
        try {
            const actualizado = await reemplazarServicios(rol.id_rol, nuevos);
            setRoles((lista) =>
                lista.map((r) => (r.id_rol === rol.id_rol ? { ...r, servicios: actualizado.servicios } : r))
            );
        } catch (err) {
            setErrorRoles(mensajeDe(err, 'No se pudieron guardar los servicios'));
        } finally {
            setOcupado(false);
        }
    }

    // Servicios tildados para el rol que todavía no se creó (se guardan con el botón Guardar)
    function alternarServicioNuevo(idServicio) {
        setAvisoServicios(false);
        setServiciosNuevoRol((ids) =>
            ids.includes(idServicio) ? ids.filter((id) => id !== idServicio) : [...ids, idServicio]
        );
    }

    // ----- Usuarios -----

    // Con un rol elegido, tocar un usuario le asigna o le quita ese rol.
    // Sin rol elegido, tocar un usuario lo suma o lo saca del rol nuevo.
    async function tocarUsuario(usuario) {
        if (editando === usuario.id_usuario || ocupado) return;

        if (rolActivo === null) {
            setUsuariosNuevoRol((ids) =>
                ids.includes(usuario.id_usuario)
                    ? ids.filter((id) => id !== usuario.id_usuario)
                    : [...ids, usuario.id_usuario]
            );
            return;
        }

        setOcupado(true);
        setErrorRoles('');
        try {
            const respuesta = tieneRol(usuario, rolActivo)
                ? await quitarRol(usuario.id_usuario, rolActivo)
                : await asignarRol(usuario.id_usuario, rolActivo);

            setUsuarios((lista) =>
                lista.map((u) => (u.id_usuario === usuario.id_usuario ? { ...u, roles: respuesta.roles } : u))
            );
        } catch (err) {
            setErrorRoles(mensajeDe(err, 'No se pudo cambiar el rol del usuario'));
        } finally {
            setOcupado(false);
        }
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

        setOcupado(true);
        setErrorEdicion('');
        try {
            const actualizado = await renombrarUsuario(usuario.id_usuario, nombre);
            setUsuarios((lista) =>
                lista
                    .map((u) => (u.id_usuario === usuario.id_usuario ? { ...u, nombre: actualizado.nombre } : u))
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
            );
            cancelarEdicion();
        } catch (err) {
            setErrorEdicion(mensajeDe(err, 'No se pudo cambiar el nombre'));
        } finally {
            setOcupado(false);
        }
    }

    return (
        <Layout>
            <CajaMenu className="lista-usuarios-caja">
                <div className="contenedor-principal">

                    <section className="contenedor-de-lista-de-usuarios">
                        <h1>Lista de Usuarios</h1>

                        {cargando && <p className="usuarios-mensaje">Cargando usuarios...</p>}
                        {!cargando && error && (
                            <p className="usuarios-mensaje usuarios-mensaje--error">{error}</p>
                        )}
                        {!cargando && !error && usuarios.length === 0 && (
                            <p className="usuarios-mensaje">No hay usuarios registrados.</p>
                        )}

                        {usuarios.map((u) => {
                            // Violeta: tiene el rol que se está viendo, o está elegido para el rol nuevo
                            const elegido = rolActivo === null
                                ? usuariosNuevoRol.includes(u.id_usuario)
                                : tieneRol(u, rolActivo);
                            const enEdicion = editando === u.id_usuario;

                            return (
                                <div
                                    key={u.id_usuario}
                                    className={`tarjeta-de-usuarios${elegido ? ' tarjeta-seleccionada' : ''}`}
                                    onClick={() => tocarUsuario(u)}
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
                                                disabled={ocupado}
                                                onChange={(e) => setNombreEditado(e.target.value)}
                                            />
                                            <button type="submit" disabled={ocupado}>
                                                {ocupado ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button type="button" disabled={ocupado} onClick={cancelarEdicion}>
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
                                    onSubmit={guardarRol}
                                >
                                    <h2>Crea un nuevo Rol</h2>
                                    <label className="campo-nombre-rol">
                                        Nombre del rol:
                                        <input
                                            type="text"
                                            maxLength={30}
                                            value={nombreRol}
                                            disabled={ocupado || rolActivo !== null}
                                            onChange={(e) => setNombreRol(e.target.value)}
                                        />
                                    </label>
                                    <small>
                                        {rolActivo === null
                                            ? `Haga click en los usuarios que quiera tener este rol (Los usuarios elegidos se pondrán en violeta). Elegidos: ${usuariosNuevoRol.length}`
                                            : `Estás viendo el rol "${rolElegido?.nombre_rol}": tocá un usuario para asignárselo o quitárselo. Tocá el rol otra vez para crear uno nuevo.`}
                                    </small>
                                    {avisoServicios && (
                                        <span className="aviso-servicios" role="alert">
                                            No se puede crear un rol si no hay servicios seleccionados
                                        </span>
                                    )}
                                    {errorRoles && <small className="mensaje-error">{errorRoles}</small>}
                                    <div className="formulario-rol-pie">
                                        <button
                                            type="submit"
                                            className="btn-guardar-rol"
                                            disabled={ocupado || rolActivo !== null}
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </form>

                                <div className="tarjeta-amarilla servicios-checklist">
                                    <h2>
                                        {rolElegido
                                            ? `Servicios de "${rolElegido.nombre_rol}"`
                                            : 'Servicios del nuevo rol'}
                                    </h2>

                                    {servicios.map((s) => {
                                        const tildado = rolElegido
                                            ? rolElegido.servicios.includes(s.id_servicio)
                                            : serviciosNuevoRol.includes(s.id_servicio);

                                        return (
                                            <label key={s.id_servicio} className="servicio-item">
                                                <input
                                                    type="checkbox"
                                                    checked={tildado}
                                                    disabled={ocupado}
                                                    onChange={() =>
                                                        rolElegido
                                                            ? alternarServicio(rolElegido, s.id_servicio)
                                                            : alternarServicioNuevo(s.id_servicio)
                                                    }
                                                />
                                                {s.descripcion || s.clave}
                                            </label>
                                        );
                                    })}

                                    <small>
                                        {rolElegido
                                            ? 'Los cambios en un rol existente se guardan al tildar.'
                                            : 'Tildá los servicios del rol nuevo y apretá Guardar.'}
                                    </small>
                                </div>
                            </div>

                            <div className="lista-de-roles">
                                {!cargando && roles.length === 0 && (
                                    <p className="usuarios-mensaje">Todavía no hay roles creados.</p>
                                )}

                                {roles.map((r) => (
                                    <div
                                        key={r.id_rol}
                                        className={`rol-creado${r.id_rol === rolActivo ? ' rol-seleccionado' : ''}`}
                                        onClick={() => elegirRol(r.id_rol)}
                                    >
                                        <p>{r.nombre_rol}</p>
                                        <span
                                            className="btn-cerrar-rol"
                                            onClick={(e) => { e.stopPropagation(); eliminarRol(r); }}
                                        >
                                            x
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                </div>

                <button className="btn-volver btn-atras" onClick={() => window.history.back()}>← Atras</button>
            </CajaMenu>
        </Layout>
    );
}