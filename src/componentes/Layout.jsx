import './Layout.css';
import imagenSuelo from '../imagenes-react/imagen del suelo.png';
import imagenNubes from '../imagenes-react/grupo-de-nubes.png';

export default function Layout({ children }) {
    return (
        <main className='menu-container'>
            {/* Fondo compartido: Nubes */}
            <img src={imagenNubes} alt="Nubes" className="imagen-nubes" />

            {/* Botón global de cerrar sesión */}
            <button className='cerrar-sesion'>Cerrar sesión</button>

            {/* Aquí se inyectará dinámicamente cada vista (Menú, Niveles, Tienda, etc.) */}
            {children}

            {/* Fondo compartido: Suelo y carpincho */}
            <img src={imagenSuelo} alt="Suelo y carpincho" className="imagen-suelo" />
        </main>
    );
}