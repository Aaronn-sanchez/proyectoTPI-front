import { useEffect, useState } from 'react';
import './notificarLogro.css';

const DURACION = 4000;

export default function NotificacionLogro({ logro, onFinalizar }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!logro) return;

        setVisible(false);

        // Pequeña espera para iniciar la animación de entrada
        const entrada = setTimeout(() => {
            setVisible(true);
        }, 50);

        // Comienza la salida después de 4 segundos
        const salida = setTimeout(() => {
            setVisible(false);
        }, DURACION);

        // Finaliza cuando termina la animación de salida
        const finalizar = setTimeout(() => {
            onFinalizar();
        }, DURACION + 600);

        return () => {
            clearTimeout(entrada);
            clearTimeout(salida);
            clearTimeout(finalizar);
        };
    }, [logro, onFinalizar]);

    if (!logro) return null;

    return (
        <div className={`notificacion-logro ${visible ? 'notificacion-logro--visible' : ''}`}>

            <div className="notificacion-logro__imagen">
                <img
                    src={`/imagenes-react/logros/${logro.codigo.toLowerCase()}.png`}
                    alt={logro.logro}
                />
            </div>

            <div className="notificacion-logro__info">
                <span className="notificacion-logro__encabezado">
                    ¡LOGRO DESBLOQUEADO!
                </span>

                <h3>{logro.logro}</h3>

                <p>Has conseguido un nuevo logro.</p>
            </div>

            <div className="notificacion-logro__trofeo">
                🏆
            </div>

        </div>
    );
}