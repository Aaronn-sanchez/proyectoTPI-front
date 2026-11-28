import { useState } from 'react';
import Caja from '../Caja';
import { SERVICIO, tieneServicio } from "../../game/utilidades/permisos.js";
import './PanelQA.css';


export default function PanelQA({ onCerrar, obtenerEscena }) {
    const escena = obtenerEscena?.();
    const inicial = escena?.qa ?? { gravedad: 50, velocidad: 50, atravesar: false };

    const [gravedad, setGravedad] = useState(inicial.gravedad);
    const [velocidad, setVelocidad] = useState(inicial.velocidad);
    const [atravesar, setAtravesar] = useState(inicial.atravesar);

    const restablecerAjustes = () => {
    setGravedad(50);
    setVelocidad(50);
    setAtravesar(false);

    escena?.aplicarAjustesQA({
        gravedad: 50,
        velocidad: 50,
        atravesar: false,
    });
};

    const puede = {
    gravedad: true,
    velocidad: true,
    paredes: true,
    checkpoint: tieneServicio(SERVICIO.CHECKPOINT),
};
    const aviso = (ok) => (ok ? undefined : 'No tenés permiso para esto');

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

                        <label className={`qa-interruptor ${puede.paredes ? '' : 'qa-bloqueado'}`} title={aviso(puede.paredes)}>
                            Atravesar paredes
                            <input type="checkbox" role="switch" className="qa-interruptor__input"
                                checked={atravesar} disabled={!puede.paredes}
                                onChange={(e) => {
                                    setAtravesar(e.target.checked);
                                    escena?.aplicarAjustesQA({ atravesar: e.target.checked });
                                }} />
                            <span className="qa-interruptor__pista" aria-hidden="true" />
                        </label>
                    </section>
                    <button
    type="button"
    className="qa-restablecer"
    onClick={restablecerAjustes}
>
    Restablecer
</button>

                    <section className={`qa-checkpoints ${puede.checkpoint ? '' : 'qa-bloqueado'}`} title={aviso(puede.checkpoint)}>
                        {/* ...igual que antes, pero con disabled={!puede.checkpoint} en cada bandera y en el botón .qa-ir */}
                    </section>
                </div>
            </Caja>
        </div>
    );
}