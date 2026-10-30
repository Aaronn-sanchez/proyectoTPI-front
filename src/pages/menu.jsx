import { Link } from 'wouter';
import './menu.css'

export default function Menu() {
    return (
        <div>
            <h1>Carpincho</h1>
            <Link href="/jugar">Jugar</Link>
            <Link href="/configuracion">Configuración</Link>
        </div>
    );
}