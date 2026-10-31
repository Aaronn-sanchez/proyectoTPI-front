import { Link } from 'wouter';
import './niveles-select.css'

export default function Niveles() {
    return (
        <div className='niveles-container'>
            <h1>Niveles</h1>
            <span className='botonsito-menu'>
                <Link href="/jugar/nivel1">tutorial Basico</Link>
            </span>
            <span className='botonsito-menu'>
                <Link href="/jugar/nivel1">Nivel 1</Link>
            </span>
            <span className='botonsito-menu'>
                <Link href="/jugar/nivel2">Nivel 2</Link>
            </span>
            <span className='botonsito-menu'>
                <Link href="/jugar/nivel3">Nivel 3</Link>
            </span>

            <button onClick={() => window.history.back()}>Volver</button>
        </div>
    );
}