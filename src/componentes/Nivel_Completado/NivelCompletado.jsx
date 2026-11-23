import CajaMenu from '../Caja';
import './NivelCompletado.css';

export default function NivelCompletado({ estado, nombreNivel, onReintentar, onVolver }) {
    const fallo = estado === 'error';
    const guardando = estado === 'guardando';

    return (
        <div className="nivel-completado-overlay" role="dialog" aria-modal="true">
            <CajaMenu>
                <div className="nivel-completado-contenido">
                    <h2 className="nivel-completado-titulo">
                        {fallo ? 'No se pudo guardar' : '¡Nivel completado!'}
                    </h2>

                    {nombreNivel && !fallo && (
                        <p className="nivel-completado-nivel">{nombreNivel}</p>
                    )}

                    {guardando && (
                        <p className="nivel-completado-mensaje">Guardando tu progreso...</p>
                    )}

                    {fallo && (
                        <p className="nivel-completado-mensaje">
                            Tu progreso no se guardó. Probá de nuevo.
                        </p>
                    )}

                    <div className="nivel-completado-botones">
                        {fallo && (
                            <button type="button" className="nivel-completado-btn" onClick={onReintentar}>
                                Reintentar
                            </button>
                        )}

                        {!guardando && (
                            <button type="button" className="nivel-completado-btn" onClick={onVolver}>
                                Volver al mapa
                            </button>
                        )}
                    </div>
                </div>
            </CajaMenu>
        </div>
    );
}