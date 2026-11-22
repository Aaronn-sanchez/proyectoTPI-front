import CajaMenu from '../Caja';
import './MenuPausa.css';

export default function MenuPausa({ onContinuar, onAjustes, onSalir }) {
    return (
        <div className="pausa-overlay">
            <CajaMenu>
                <div className="pausa-contenido">
                    <h2>Pausa</h2>
                    <button className="pausa-btn" onClick={onContinuar}>Continuar</button>
                    <button className="pausa-btn" onClick={onAjustes}>Ajustes</button>
                    <button className="pausa-btn" onClick={onSalir}>Salir al mapa</button>
                </div>
            </CajaMenu>
        </div>
    );
}