import { Link } from 'wouter';
import CajaMenu from '../../componentes/Caja.jsx';
import './menu.css';
import Layout from '../../componentes/Layout.jsx';

export default function Menu() {
    return (
        <Layout>
            <CajaMenu size="principal" className="menu-caja">
                <div className="contenido">
                    <h1>Cozzy<span>&</span>Cosso</h1>
                    <Link href="niveles" className="btn-menu">Jugar</Link>

                    <Link href="/ajustes" className="btn-menu">Ajustes</Link>
                </div>
            </CajaMenu>
        </Layout>
    );
}