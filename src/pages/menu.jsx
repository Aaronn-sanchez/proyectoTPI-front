import { Link } from 'wouter';
import './menu.css'

export default function Menu() {
    return (
        <div className='menu-container'>
            <h1>Carpincho</h1>
            <Link href="niveles">Jugar</Link>
            <Link href="/configuracion">Configuración</Link>
            <Link href="/tienda">Tienda</Link>
        </div>
    );
}