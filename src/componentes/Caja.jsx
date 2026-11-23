import './caja.css';

const ROL_QA = 2;

// Lee el usuario de la sesión; si el JSON está roto, se trata como sin sesión
function esTester() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        return Boolean(usuario?.roles?.includes(ROL_QA));
    } catch {
        return false;
    }
}

export default function CajaMenu({ children, size, className = '' }) {
    const sizeClass = size ? `caja-menu-${size}` : '';
    const qaClass = esTester() ? 'caja-menu-qa' : '';
    return (
        <div className={`caja-menu-base ${sizeClass} ${qaClass} ${className}`.trim()}>
            {children}
        </div>
    );
}