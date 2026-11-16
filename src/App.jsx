import { Route, Switch, Redirect, useLocation } from 'wouter';

import Menu from './pages/C_Menu/menu.jsx';
import Juego from './pages/juego.jsx';
import Niveles from './pages/Niveles-react/niveles-seleccion.jsx';
import ConfiguracionesUs from './pages/ConfigUsuario/configUsu.jsx'
import Registro from './pages/Registro/registro.jsx';
import Login from './pages/Login/login.jsx';

import { useState, useEffect } from 'react';
import { obtenerPerfil } from './api/auth';

const RUTAS_PRIVADAS = ['/menu', '/niveles', '/jugar/tutorial', '/ajustes'];
const RUTAS_PUBLICAS = ['/', '/registro'];

export default function App() {

  const [ubicacion] = useLocation();
  const token = localStorage.getItem('token');

  const esPrivada = RUTAS_PRIVADAS.includes(ubicacion);
  const esPublica = RUTAS_PUBLICAS.includes(ubicacion);

  const [validando, setValidando] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    obtenerPerfil()
      .catch(() => { })
      .finally(() => setValidando(false));
  }, []);

  if (validando) return null;

  if (!token && esPrivada) return <Redirect to="/" />;
  if (token && esPublica) return <Redirect to="/menu" />;


  return (

    <Switch>
      <Route path="/" component={Login} />
      <Route path="/registro" component={Registro} />

      <Route path="/menu" component={Menu} />
      <Route path="/niveles" component={Niveles} />
      <Route path="/jugar/tutorial" component={Juego} />
      <Route path="/ajustes" component={ConfiguracionesUs} />

      <Route>Página no encontrada</Route>
    </Switch>
  );
}