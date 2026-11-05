import { Route, Switch } from 'wouter';
import Menu from './pages/C_Menu/menu.jsx';
import Juego from './pages/juego.jsx';
import Niveles from './pages/Niveles-react/niveles-seleccion.jsx';
import ConfiguracionesUs from './pages/ConfigUsuario/configUsu.jsx'

export default function App() {
  return (

    <Switch>
      <Route path="/" component={Menu} />
      <Route path="/niveles" component={Niveles} />
      <Route path="/jugar/tutorial" component={Juego} />
      <Route path="/ajustes" component={ConfiguracionesUs} />
      {/* <Route path="/jugar" component={Juego} /> */}
      <Route>Página no encontrada</Route>
    </Switch>
  );
}