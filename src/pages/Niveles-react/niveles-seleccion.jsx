import './niveles-select.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { obtenerProgreso } from '../../api/niveles';
import candado from '../../imagenes-react/Candadito.svg';
import basic from '../../imagenes-react/tutorial-img.svg';
import nivel2 from '../../imagenes-react/nivel2-img.svg';
import nivel3 from '../../imagenes-react/nivel3-img.svg';
import nivel4 from '../../imagenes-react/nivel4-img.svg';
import nivel5 from '../../imagenes-react/nivel5-img.svg';

// ruta: null = el nivel todavía no tiene escena jugable
const NIVELES = [
    { id: 0, img: basic, clase: 'nivel-basico', alt: 'Nivel básico', ruta: '/jugar/tutorial' },
    { id: 1, img: nivel2, clase: 'nivel-2', alt: 'Nivel 2', ruta: null },
    { id: 2, img: nivel3, clase: 'nivel-3', alt: 'Nivel 3', ruta: null },
    { id: 3, img: nivel4, clase: 'nivel-4', alt: 'Nivel 4', ruta: null },
    { id: 4, img: nivel5, clase: 'nivel-5', alt: 'Nivel 5', ruta: null },
];

export default function Niveles() {
    const [, navigate] = useLocation();
    const [progreso, setProgreso] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        obtenerProgreso()
            .then(setProgreso)
            .catch(() => setError('No se pudo cargar tu progreso'));
    }, []);

    // Mientras carga (o si falla) todo se ve bloqueado
    const estaBloqueado = (id) =>
        !progreso?.niveles.find((n) => n.id_nivel === id)?.desbloqueado;

    const rutaJugar = NIVELES.find((n) => n.id === progreso?.nivelActual)?.ruta ?? null;

    return (
        <div className="niveles-container">
            <h1 className="niveles-titulo">Mapa de niveles</h1>
            {error && <p>{error}</p>}

            <div className="mapa">
                <svg className="rastros" viewBox="0 0 1044 595" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
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

                {NIVELES.map(({ id, img, clase, alt, ruta }) => {
                    const bloqueado = estaBloqueado(id);
                    const icono = (
                        <div className={`nivel ${clase}${bloqueado ? ' nivel-bloqueado' : ''}`}>
                            <img className="nivel-img" src={img} alt={alt} />
                            {bloqueado && <img className="nivel-candado" src={candado} alt="Nivel bloqueado" />}
                        </div>
                    );

                    return !bloqueado && ruta
                        ? <Link key={id} href={ruta}>{icono}</Link>
                        : <div key={id}>{icono}</div>;
                })}
            </div>

            <button className="btn-azul btn-atras" onClick={() => navigate('/menu')}>← Atras</button>
            <button
                className="btn-azul btn-jugar"
                disabled={!rutaJugar}
                onClick={() => navigate(rutaJugar)}
            >
                Jugar →
            </button>
        </div>
    );
}