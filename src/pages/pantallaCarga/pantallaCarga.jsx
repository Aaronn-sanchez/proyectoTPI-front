import { useEffect, useState } from 'react';
import './pantallaCarga.css';
import { obtenerDatoAlAzar } from '../../context/datosCurioso.js';
import sueloCarpincho from '../../imagenes-react/carpincho-suelo-pantalla-carga.png';
import nube from '../../imagenes-react/nube-pantalla-carga.png';

// Debe coincidir con la transición de opacity de .pantalla-carga en el CSS
const DURACION_FADE_MS = 500;

// Elige el tamaño de letra según el largo de la frase
function claseTamano(texto) {
    if (texto.length <= 85) return 'dato-corto';
    if (texto.length <= 120) return 'dato-medio';
    return 'dato-largo';
}

// Overlay de carga: visible = true lo muestra; al pasar a false se desvanece y se desmonta.
// error = true cambia el "Loading..." por un mensaje con botón para volver.
export default function PantallaCarga({ visible = true, error = false, onVolver }) {
    const [montado, setMontado] = useState(visible);

    // Se elige una sola vez al montar
    const [dato] = useState(() => obtenerDatoAlAzar());

    useEffect(() => {
        if (visible) {
            setMontado(true);
            return;
        }
        const temporizador = setTimeout(() => setMontado(false), DURACION_FADE_MS);
        return () => clearTimeout(temporizador);
    }, [visible]);

    if (!montado) return null;

    return (
        <div className={`pantalla-carga${visible ? '' : ' pantalla-carga--saliendo'}`}>
            <div className="nube">
                <img className="nube-img" src={nube} alt="" />
                <p className={`nube-texto ${claseTamano(dato)}`}>{dato}</p>
            </div>

            {error ? (
                <>
                    <h1 className="cargando-titulo cargando-titulo--error" role="alert">
                        No se pudo cargar el nivel
                    </h1>
                    <button type="button" className="cargando-volver" onClick={onVolver}>
                        Volver al mapa
                    </button>
                </>
            ) : (
                <h1 className="cargando-titulo" role="status">
                    Loading
                    <span className="cargando-puntos" aria-hidden="true">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                </h1>
            )}

            <img className="suelo-carga" src={sueloCarpincho} alt="" />
        </div>
    );
}