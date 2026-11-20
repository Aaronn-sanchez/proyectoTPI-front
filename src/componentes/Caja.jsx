import './caja.css';
export default function CajaMenu({ children, size, className = '' }) {
    const sizeClass = size ? `caja-menu-${size}` : '';
    return (
        <div className={`caja-menu-base ${sizeClass} ${className}`.trim()}>
            {children}
        </div>
    );
}