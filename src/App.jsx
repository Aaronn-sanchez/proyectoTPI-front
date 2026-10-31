import { Route, Switch } from 'wouter';
import Menu from './pages/menu.jsx';
import Juego from './pages/juego.jsx';
import Niveles from './pages/niveles-seleccion.jsx';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Menu} />
      <Route />
      <Route path="/niveles" component={Niveles} />
      <Route path="/jugar/nivel1" component={Juego} />
      {/* <Route path="/jugar" component={Juego} /> */}
      <Route>Página no encontrada</Route>
    </Switch>
  );
}