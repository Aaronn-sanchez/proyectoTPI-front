import { useState } from 'react';
import Caja from '../Caja';
import { SERVICIO, puedeServicio } from "../../game/utilidades/permisos.js";
import './PanelQA.css';

const NORMAL = { gravedad: 50, velocidad: 50, fantasma: false };

export default function PanelQA({ onCerrar, obtenerEscena }) {
    const escena = obtenerEscena?.();
    const inicial = escena?.ajustesQA ?? NORMAL;

    const [gravedad, setGravedad] = useState(inicial.gravedad);
    const [velocidad, setVelocidad] = useState(inicial.velocidad);
    const [fantasma, setFantasma] = useState(inicial.fantasma ?? false);

    const puede = {
        gravedad: puedeServicio(SERVICIO.GRAVEDAD),
        velocidad: puedeServicio(SERVICIO.VELOCIDAD),
        fantasma: puedeServicio(SERVICIO.PAREDES),
        checkpoint: puedeServicio(SERVICIO.CHECKPOINT),
    };
    const aviso = (ok) => (ok ? undefined : 'No tenés permiso para esto');

    // Solo restablece lo que este usuario tiene permitido tocar
    const restablecerAjustes = () => {
        const cambios = {};

        if (puede.gravedad) { setGravedad(NORMAL.gravedad); cambios.gravedad = NORMAL.gravedad; }
        if (puede.velocidad) { setVelocidad(NORMAL.velocidad); cambios.velocidad = NORMAL.velocidad; }
        if (puede.fantasma) { setFantasma(NORMAL.fantasma); cambios.fantasma = NORMAL.fantasma; }

        escena?.aplicarAjustesQA(cambios);
    };

    return (
        <div className="panel-qa-fondo" role="dialog" aria-modal="true" aria-label="Panel de QA Tester">
            <Caja>
                <div className="panel-qa">
                    <button type="button" className="panel-qa__cerrar" aria-label="Cerrar panel" onClick={onCerrar}>✕</button>
                    <h1 className="panel-qa__titulo">Panel de QA Tester</h1>

                    <section className="qa-ajustes">
                        <h2>Ajustes especiales</h2>

                        <div className="qa-ajustes__sliders">
                            <label className={`qa-control ${puede.gravedad ? '' : 'qa-bloqueado'}`} title={aviso(puede.gravedad)}>
                                Gravedad
                                <input type="range" className="slider-qa" min="0" max="100"
                                    value={gravedad} disabled={!puede.gravedad}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setGravedad(v);
                                        escena?.aplicarAjustesQA({ gravedad: v });
                                    }}
                                    style={{ '--valor': gravedad }} />
                            </label>

                            <label className={`qa-control ${puede.velocidad ? '' : 'qa-bloqueado'}`} title={aviso(puede.velocidad)}>
                                Velocidad
                                <input type="range" className="slider-qa" min="0" max="100"
                                    value={velocidad} disabled={!puede.velocidad}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setVelocidad(v);
                                        escena?.aplicarAjustesQA({ velocidad: v });
                                    }}
                                    style={{ '--valor': velocidad }} />
                            </label>
                        </div>

                        <label className={`qa-interruptor ${puede.fantasma ? '' : 'qa-bloqueado'}`} title={aviso(puede.fantasma)}>
                            Modo fantasma
                            <input
                                type="checkbox"
                                role="switch"
                                className="qa-interruptor__input"
                                checked={fantasma}
                                disabled={!puede.fantasma}
                                onChange={(e) => {
                                    setFantasma(e.target.checked);
                                    escena?.aplicarAjustesQA({ fantasma: e.target.checked });
                                }}
                            />
                            <span className="qa-interruptor__pista" aria-hidden="true" />
                        </label>
                    </section>

                    <button type="button" className="qa-restablecer" onClick={restablecerAjustes}>
                        Restablecer
                    </button>

                    <section className={`qa-checkpoints ${puede.checkpoint ? '' : 'qa-bloqueado'}`} title={aviso(puede.checkpoint)}>
                    </section>
                </div>
            </Caja>
        </div>
    );
}