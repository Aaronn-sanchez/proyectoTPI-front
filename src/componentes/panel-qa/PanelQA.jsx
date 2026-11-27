import { useState } from 'react';
import Caja from '../Caja';
import './PanelQA.css';

// Ejemplo: después vendrán de la partida
const CHECKPOINTS = [1, 2, 3, 4];

// 50 = valor normal del juego. 0 = mínimo, 100 = el doble.
const VALOR_NORMAL = 50;

export default function PanelQA({ ajustes, onCambiarAjustes, onCerrar }) {
    // El valor real vive en la escena de Phaser; acá solo se arranca desde él
    // para que al reabrir el panel los sliders sigan donde los dejaste.
    const [gravedad, setGravedad] = useState(ajustes?.gravedad ?? VALOR_NORMAL);
    const [velocidad, setVelocidad] = useState(ajustes?.velocidad ?? VALOR_NORMAL);
    const [checkpoint, setCheckpoint] = useState(1);

    function cambiarGravedad(valor) {
        setGravedad(valor);
        onCambiarAjustes?.({ gravedad: valor });
    }

    function cambiarVelocidad(valor) {
        setVelocidad(valor);
        onCambiarAjustes?.({ velocidad: valor });
    }

    function restablecer() {
        setGravedad(VALOR_NORMAL);
        setVelocidad(VALOR_NORMAL);
        onCambiarAjustes?.({ gravedad: VALOR_NORMAL, velocidad: VALOR_NORMAL });
    }

    return (
        <div className="panel-qa-fondo" role="dialog" aria-modal="true" aria-label="Panel de QA Tester">
            <Caja>
                <div className="panel-qa">
                    <button type="button" className="panel-qa__cerrar" aria-label="Cerrar panel" onClick={onCerrar}>
                        ✕
                    </button>

                    <h1 className="panel-qa__titulo">Panel de QA Tester</h1>

                    {/* ---------- Ajustes especiales ---------- */}
                    <section className="qa-ajustes">
                        <h2>Ajustes especiales</h2>

                        <div className="qa-ajustes__sliders">
                            <label className="qa-control">
                                Gravedad
                                <input
                                    type="range"
                                    className="slider-qa"
                                    min="0"
                                    max="100"
                                    value={gravedad}
                                    onChange={(e) => cambiarGravedad(Number(e.target.value))}
                                    style={{ '--valor': gravedad }}
                                />
                            </label>

                            <label className="qa-control">
                                Velocidad
                                <input
                                    type="range"
                                    className="slider-qa"
                                    min="0"
                                    max="100"
                                    value={velocidad}
                                    onChange={(e) => cambiarVelocidad(Number(e.target.value))}
                                    style={{ '--valor': velocidad }}
                                />
                            </label>
                        </div>

                        <button type="button" className="qa-ir" onClick={restablecer}>
                            Restablecer
                        </button>

                        {/* Interruptor ON/OFF: lo resuelve el CSS, no necesita estado */}
                        <label className="qa-interruptor">
                            Atravesar paredes
                            <input type="checkbox" role="switch" className="qa-interruptor__input" />
                            <span className="qa-interruptor__pista" aria-hidden="true" />
                        </label>
                    </section>

                    {/* ---------- Checkpoints ---------- */}
                    <section className="qa-checkpoints">
                        <h2>Checkpoints</h2>
                        <p className="qa-checkpoints__subtitulo">Elige a que punto de la partida quieres ir</p>

                        <div className="qa-recorrido">
                            {CHECKPOINTS.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`qa-bandera ${checkpoint === n ? 'qa-bandera--elegida' : ''}`}
                                    onClick={() => setCheckpoint(n)}
                                    aria-pressed={checkpoint === n}
                                    aria-label={`Checkpoint ${n}`}
                                >
                                    <svg viewBox="0 0 28 44" aria-hidden="true">
                                        <line x1="8" y1="4" x2="8" y2="44" stroke="white" strokeWidth="2" />
                                        <path d="M8 4 L26 10.5 L8 17 Z" fill="#e0453f" />
                                    </svg>
                                </button>
                            ))}
                            <div className="qa-recorrido__barra" />
                        </div>

                        <button type="button" className="qa-ir">
                            Ir al checkpoint {checkpoint}→
                        </button>
                    </section>
                </div>
            </Caja>
        </div>
    );
}