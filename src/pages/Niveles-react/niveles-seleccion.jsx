import './niveles-select.css';
import { Link } from 'wouter';
import basic from '../../imagenes-react/tutorial-img.svg';
import nivel2 from '../../imagenes-react/nivel2-img.svg';
import nivel3 from '../../imagenes-react/nivel3-img.svg';
import nivel4 from '../../imagenes-react/nivel4-img.svg';
import nivel5 from '../../imagenes-react/nivel5-img.svg';

export default function Niveles() {
    return (
        <div className="niveles-container">
            <h1 className="niveles-titulo">Mapa de niveles</h1>

            <div className="mapa">
                {/* Rastros dibujados a mano (van detrás de las imágenes) */}
                <svg className="rastros" viewBox="0 0 1044 595" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        {/* Distorsiona el trazo para que parezca hecho a mano */}
                        <filter id="a-mano" x="-5%" y="-5%" width="110%" height="110%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="ruido" />
                            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="7" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </defs>
                    <g filter="url(#a-mano)">
                        <path className="rastro rastro-amarillo" d="M 158 272 C 172 292, 190 300, 198 322 S 214 340, 218 352" />
                        <path className="rastro rastro-punteado" d="M 352 348 C 380 330, 392 300, 420 285 S 445 262, 462 250" />
                        <path className="rastro rastro-punteado" d="M 548 262 C 570 285, 590 300, 604 320 S 620 338, 628 350" />
                        <path className="rastro rastro-punteado" d="M 792 350 C 812 330, 826 312, 842 296 S 858 272, 868 262" />
                    </g>
                </svg>

                <Link href="/jugar/tutorial">
                    <img className="nivel nivel-basico" src={basic} alt="Nivel basico" />
                </Link>
                <img className="nivel nivel-2" src={nivel2} alt="Nivel 2" />
                <img className="nivel nivel-3" src={nivel3} alt="Nivel 3" />
                <img className="nivel nivel-4" src={nivel4} alt="Nivel 4" />
                <img className="nivel nivel-5" src={nivel5} alt="Nivel 5" />
            </div>

            <button className="btn-azul btn-atras" onClick={() => window.history.back()}>← Atras</button>
            <button className="btn-azul btn-jugar">Jugar →</button>
        </div>
    );
}