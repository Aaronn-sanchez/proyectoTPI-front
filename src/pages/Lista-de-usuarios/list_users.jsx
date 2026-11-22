import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import './list_user.css'

export default function ListaUsers() {

    return (
        <Layout>
            <CajaMenu>
                <div className="contenedor-principal">

                    <section className="contenedor-de-lista-de-usuarios">
                        <h1>Lista de Usuarios</h1>

                        <div className="tarjeta-de-usuarios tarjeta-seleccionada">
                            <p>Nombre1</p>
                            <div className="contenedor-acciones">
                                <div className="modificar">Modificar</div>
                                <span className="btn-cerrar-usuario-lista">x</span>
                            </div>
                        </div>

                        <div className="tarjeta-de-usuarios">
                            <p>Nombre2</p>
                        </div>

                        <div className="tarjeta-de-usuarios">
                            <p>Nombre3</p>
                        </div>

                        <div className="tarjeta-de-usuarios">
                            <p>Nombre4</p>
                        </div>
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

                <button className="btn-azul btn-atras" onClick={() => window.history.back()}>← Atras</button>
            </CajaMenu>
        </Layout>
    );

}