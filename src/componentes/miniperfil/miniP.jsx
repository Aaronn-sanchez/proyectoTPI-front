import { useState } from 'react';
import Perfil from '../usuario-cuenta/perfil';
import './miniP.css';

export default function PerfilMini() {
    const [abierto, setAbierto] = useState(false);

    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    const esQA = usuario?.roles?.includes(2);

    function cerrarSiEsOverlay(e) {
        if (e.target === e.currentTarget) setAbierto(false);
    }

    return (
        <>
            <button type="button" className="perfil-mini" onClick={() => setAbierto(true)}>
                {esQA && <span className="corona">👑</span>}
                <span className="nombre-mini">{usuario?.nombre}</span>
            </button>

            {abierto && (
                <div className="overlay-perfil" onClick={cerrarSiEsOverlay}>
                    <Perfil />
                </div>
            )}
        </>
    );
}