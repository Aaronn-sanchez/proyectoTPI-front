import { useState } from 'react';
import CajaMenu from '../Caja';
import PanelGuardados from './PanelGuardados';
import './MenuPausa.css';

export default function MenuPausa({ idNivel, obtenerEstado, onContinuar, onAjustes, onSalir, onSeleccionar }) {
    const [panelAbierto, setPanelAbierto] = useState(false);

    return (
        <div className="pausa-overlay">
            <div className="pausa-layout">
                <CajaMenu>
                    <div className="pausa-contenido">
                        <h2>Pausa</h2>
                        <button className="pausa-btn" onClick={onContinuar}>Seguir jugando</button>
                        <button className="pausa-btn" onClick={onSalir}>Salir de la partida</button>
                        <button className="pausa-btn" onClick={onAjustes}>Ajustes</button>
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
        </div>
    );
}