import { useState } from "react";
import { Link, useLocation } from "wouter";
import { login } from "../../api/auth";
import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";
import '../Registro/registro.css'
import './login.css'

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState('');
    const [, navigate] = useLocation();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            const datos = await login(email, password);

            console.log("Salió bien:", datos);
            localStorage.setItem('token', datos.token);
            localStorage.setItem('usuario', JSON.stringify(datos.usuario));

            navigate('/menu');

        } catch (error) {
            setError(error.response?.data?.error || 'No se pudo conectar con el servidor');
            console.log(error);
        }
    }

    return (
        <Layout>
            <CajaMenu>
                <main className="Contendero-princ-reg">
                    <h1>Iniciar sesión</h1>

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

                        <p>Contraseña</p>
                        <div className="campo-password">
                            <input
                                type={verPassword ? "text" : "password"}
                                name="password"
                                required
                                placeholder="Ingresa tu contraseña"
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
                            <Link href="/registro" className="btn-menu">Registrarse</Link>
                            <button className="btn-menu" type="submit">Ingresar →</button>
                        </div>
                    </form>
                </main>
            </CajaMenu>
        </Layout>
    );
}