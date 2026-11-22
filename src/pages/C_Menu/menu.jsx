import { Link } from 'wouter';
import CajaMenu from '../../componentes/Caja.jsx';
import './menu.css';
import Layout from '../../componentes/Layout.jsx';
import { obtenerPerfil } from '../../api/auth.js';
import Perfil from '../../componentes/usuario-cuenta/perfil.jsx';
import PerfilMini from '../../componentes/miniperfil/miniP.jsx';

export default function Menu() {

    return (
        <Layout>
            <PerfilMini>

            </PerfilMini>
            <CajaMenu className="menu-caja">
                <div className="contenido">
                    <h1>Cozzy<span>&</span>Cosso</h1>
                    <Link href="/cargando" className="btn-menu">Jugar</Link>
                    <Link href='/misLogros' className="btn-menu">Mis Logros</Link>
                    <Link href='/listaUsuarios' className="btn-menu">Lista de usuarios</Link>
                    <Link href="/ajustes" className="btn-menu">Ajustes</Link>
                    <Link href="niveles" className="btn-menu">Lista de niveles</Link>
                </div>
            </CajaMenu>
        </Layout>
    );

}
