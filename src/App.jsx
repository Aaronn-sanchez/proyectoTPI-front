import { useState, useEffect } from 'react';
import { Route, Switch, Redirect, useLocation } from 'wouter';

import Menu from './pages/C_Menu/menu.jsx';
import Juego from './pages/juego.jsx';
import Niveles from './pages/Niveles-react/niveles-seleccion.jsx';
import ConfiguracionesUs from './pages/ConfigUsuario/configUsu.jsx';
import Registro from './pages/Registro/registro.jsx';
import Login from './pages/Login/login.jsx';
import Logros from './pages/Logros/logros.jsx';
import ListaUsers from './pages/Lista-de-usuarios/list_users.jsx';
import PantallaCarga from './pages/pantallaCarga/pantallaCarga.jsx';
import { refrescarSesion } from "./game/utilidades/permisos.js";
const RUTAS_PUBLICAS = ['/', '/registro'];

export default function App() {
  const [ubicacion, setLocation] = useLocation();
  const token = localStorage.getItem('token');

  const esPublica = RUTAS_PUBLICAS.includes(ubicacion);

  const [validando, setValidando] = useState(Boolean(token));

  // Al abrir la app, comprueba que el token guardado siga siendo válido
  useEffect(() => {
    if (!token) return;

    refrescarSesion()
      .catch(() => {
        // Token vencido o inválido: se borra y se vuelve al login
        localStorage.removeItem('token');
        setLocation('/');
      })
      .finally(() => setValidando(false));
  }, []);

  if (validando) return null;

  if (!token && !esPublica) return <Redirect to="/" />;
  if (token && esPublica) return <Redirect to="/menu" />;

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Registro} />

      <Route path="/menu" component={Menu} />
      <Route path="/niveles" component={Niveles} />
      <Route path="/jugar/:id">
        {(params) => <Juego key={params.id} id={params.id} />}
      </Route>
      <Route path="/ajustes" component={ConfiguracionesUs} />
      <Route path="/misLogros" component={Logros} />
      <Route path="/listaUsuarios" component={ListaUsers} />
      <Route path="/cargando" component={PantallaCarga} />

      <Route>Página no encontrada</Route>
    </Switch>
  );
}
