
import CajaMenu from "../Caja";
import './perfil.css';
import { cerrarSesion } from "../../api/cerrasSesion";
import { eliminarCuenta, actualizarNombre } from "../../api/auth";

export default function Perfil() {

    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    const handleActualizarNombre = async () => {
        const nuevoNombre = window.prompt(
            "Ingresá tu nuevo nombre de usuario:",
            usuario?.nombre
        );

        if (!nuevoNombre || nuevoNombre.trim() === "") return;

        try {
            const datosFrescos = await actualizarNombre(nuevoNombre.trim());

            localStorage.setItem('usuario', JSON.stringify(datosFrescos.usuario));
            localStorage.setItem('token', datosFrescos.token);

            alert("¡Nombre actualizado con éxito!");
            window.location.reload();

        } catch (error) {
            console.error("Error al actualizar el nombre", error);
            alert("No se pudo actualizar el nombre. Verificá tu conexión.");
        }
    };

    const handleEliminarCuenta = async () => {
        const confirmado = window.confirm(
            "¿Estás seguro de que querés eliminar tu cuenta? Vas a perder todo tu progreso y no se puede deshacer."
        );

        if (confirmado) {
            try {
                await eliminarCuenta();

                localStorage.removeItem('token');
                localStorage.removeItem('usuario');

                window.location.href = '/login';

            } catch (error) {
                console.error("Error al eliminar la cuenta", error);
                alert("Hubo un error al eliminar tu cuenta.");
            }
        }
    };

    return (
        <CajaMenu className="color-de-perfil">

            <main className="contenido-de-perfil">

                <h2>Perfil de usuario</h2>

                <div className="datos-usuario">

                    <h3>
                        Datos del usuario:

                        <button
                            type="button"
                            className="boton-editar-sutil"
                            onClick={handleActualizarNombre}
                            aria-label="Editar nombre de usuario"
                        >
                            ✏️
                        </button>
                    </h3>

                    <p>
                        <span>Nombre de usuario: </span>
                        {usuario?.nombre}
                    </p>

                    <p>
                        <span>Email registrado: </span>
                        {usuario?.email}
                    </p>

                </div>

                <div className="roles-asignados">
                    <h3>Privilegios concedidos:</h3>
                </div>

                <div className="acciones-perfil">

                    <button
                        type="button"
                        className="cerrar-sesion"
                        onClick={cerrarSesion}
                    >
                        Cerrar sesión
                    </button>

                    <button
                        type="button"
                        className="eliminar-cuenta"
                        onClick={handleEliminarCuenta}
                    >
                        Eliminar cuenta
                    </button>

                </div>

            </main>

        </CajaMenu>
    );
}
