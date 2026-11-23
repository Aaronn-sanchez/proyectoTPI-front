
import Layout from '../../componentes/Layout.jsx';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import './pantallaCarga.css';

export default function PantallaCarga() {

    const [, setLocation] = useLocation();

    useEffect(() => {
        const temporizador = setTimeout(() => {
            setLocation('/jugar/tutorial');
        }, 3500);

        return () => clearTimeout(temporizador);
    }, [setLocation]);

    return (
        <div className="pantalla-carga">
            <h1>Loading...</h1>
        </div>
    );
}
