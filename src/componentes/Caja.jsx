import './caja.css';

// Solo contenedor visual.
// 'size' es opcional: sin él, la caja se adapta al contenido.
export default function CajaMenu({ children, size, className = '' }) {
    const sizeClass = size ? `caja-menu-${size}` : '';
    return (
        <div className={`caja-menu-base ${sizeClass} ${className}`.trim()}>
            {children}
        </div>
    );
}