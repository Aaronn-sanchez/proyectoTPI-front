import { useState } from 'react';
import CajaMenu from '../Caja';
import PanelGuardados from './PanelGuardados';
import PanelQA from '../panel-qa/PanelQA';
import { puedeVerPanelQA } from '../../game/utilidades/permisos.js';

import './MenuPausa.css';

export default function MenuPausa({
    idNivel, obtenerEstado, onContinuar, onAjustes, onSalir, onSeleccionar,
    obtenerEscena,
}) {
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [panelQAAbierto, setPanelQAAbierto] = useState(false);
    const verPanelQA = puedeVerPanelQA();

    return (
        <div className="pausa-overlay">
            <div className="pausa-layout">
                <CajaMenu>
                    <div className="pausa-contenido">
                        <h2>Pausa</h2>
                        <button className="pausa-btn" onClick={onContinuar}>Seguir jugando</button>
                        <button className="pausa-btn" onClick={onSalir}>Salí de la partida</button>
                        <button className="pausa-btn" onClick={onAjustes}>Ajustes</button>

                        {/* QA Tester, o cualquiera con al menos un servicio habilitado */}
                        {verPanelQA && (
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

            {verPanelQA && panelQAAbierto && (
                <PanelQA
                    obtenerEscena={obtenerEscena}
                    onCerrar={() => setPanelQAAbierto(false)}
                />
            )}
        </div>
    );
}