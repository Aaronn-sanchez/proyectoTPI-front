import { useState } from "react";
import { Link, useLocation } from "wouter";
import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import { registrar } from "../../api/auth";
import './registro.css'
import '../Login/login.css'

export default function Registro() {
    const [, navigate] = useLocation();

    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        try {
            const datos = await registrar(nombre.trim(), email.trim(), password);

            localStorage.setItem('token', datos.token);
            localStorage.setItem('usuario', JSON.stringify(datos.usuario));

            navigate('/menu');
        } catch (error) {
            setError(error.response?.data?.error || 'No se pudo conectar con el servidor');
        }
    }

    return (
        <Layout>
            <CajaMenu>
                <main className="Contendero-princ-reg">
                    <h1>Crear cuenta</h1>

                    <form className="estilo-form-reg" onSubmit={handleSubmit}>
                        <p>Email</p>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="Ingresa tu correo electronico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <p>Nombre</p>
                        <input
                            type="text"
                            name="nombre"
                            required
                            placeholder="Ingresa un nombre de usuario"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />

                        <p>Contraseña</p>
                        <div className="campo-password">
                            <input
                                type={verPassword ? "text" : "password"}
                                name="password"
                                required
                                minLength={8}
                                maxLength={72}
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                className="btn-ojito"
                                onClick={() => setVerPassword(!verPassword)}
                                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {verPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {error && <div className="msg-error-form">{error}</div>}

                        <div className="botoncitos-registro">
                            <Link href="/" className="btn-menu">Iniciar sesión</Link>
                            <button className="btn-menu" type="submit">Registrarse →</button>
                        </div>
                    </form>
                </main>
            </CajaMenu>
        </Layout>
    );
}