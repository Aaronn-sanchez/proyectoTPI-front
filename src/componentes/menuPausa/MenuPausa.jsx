import { useState } from 'react';
import CajaMenu from '../Caja';
import PanelGuardados from './PanelGuardados';
import PanelQA from '../panel-qa/PanelQA';
import './MenuPausa.css';

const ROL_QA = 2;

function esTester() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        return Boolean(usuario?.roles?.includes(ROL_QA));
    } catch {
        return false;
    }
}

export default function MenuPausa({ idNivel, obtenerEstado, onContinuar, onAjustes, onSalir, onSeleccionar }) {
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [panelQAAbierto, setPanelQAAbierto] = useState(false);
    const tester = esTester();

    return (
        <div className="pausa-overlay">
            <div className="pausa-layout">
                <CajaMenu>
                    <div className="pausa-contenido">
                        <h2>Pausa</h2>
                        <button className="pausa-btn" onClick={onContinuar}>Seguir jugando</button>
                        <button className="pausa-btn" onClick={onSalir}>Salí de la partida</button>
                        <button className="pausa-btn" onClick={onAjustes}>Ajustes</button>

                        {/* Solo para usuarios con el rol QA Tester */}
                        {tester && (
                            <button className="pausa-btn" onClick={() => setPanelQAAbierto(true)}>
                                Ajustes especiales
                            </button>
                        )}

                        <button className="pausa-btn" onClick={() => setPanelAbierto((a) => !a)}>
                            Guardar Partida
                        </button>
                    </div>
                </CajaMenu>

                <PanelGuardados
                    idNivel={idNivel}
                    obtenerEstado={obtenerEstado}
                    onSeleccionar={onSeleccionar}
                />
            </div>

            {tester && panelQAAbierto && (
                <PanelQA onCerrar={() => setPanelQAAbierto(false)} />
            )}
        </div>
    );
}