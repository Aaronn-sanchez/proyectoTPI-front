import { Route, Switch } from 'wouter';
import Menu from './pages/menu.jsx';
import Juego from './pages/juego.jsx';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Menu} />
      <Route path="/jugar" component={Juego} />
      <Route>Página no encontrada</Route>
    </Switch>
  );
}