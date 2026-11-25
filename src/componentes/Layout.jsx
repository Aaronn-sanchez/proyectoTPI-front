
import './Layout.css';
import imagenSuelo from '../imagenes-react/imagen del suelo.png';
import imagenNubes from '../imagenes-react/grupo-de-nubes.png';

export default function Layout({ children }) {
    return (
        <main className="menu-container">
            <img
                src={imagenNubes}
                alt="Nubes"
                className="imagen-nubes"
            />

            {children}

            <img
                src={imagenSuelo}
                alt="Suelo y carpincho"
                className="imagen-suelo"
            />
        </main>
    );
}
