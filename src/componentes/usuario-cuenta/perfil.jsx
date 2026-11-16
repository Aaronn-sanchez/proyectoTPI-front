import CajaMenu from "../Caja";
import './perfil.css'
import { cerrarSesion } from "../../api/cerrasSesion";

const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

export default function Perfil(params) {
    return (
        <CajaMenu>
            <main className="contenido-de-perfil">

                <h2>Perfil de usuario</h2>

                <div className="datos-usuario">
                    <h3>datos del usuario</h3>

                    <p className="texto-perfil">{usuario?.nombre}</p>
                    <p className="texto-perfil">{usuario?.email}</p>
                </div>

                <div className="roles-asignados">
                    <h3>Privilegios concedidos</h3>

                </div>

                <button className='cerrar-sesion' onClick={cerrarSesion}>Cerrar sesión</button>

            </main>
        </CajaMenu>
    );
}