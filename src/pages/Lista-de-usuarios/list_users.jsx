import Layout from "../../componentes/Layout";
import CajaMenu from "../../componentes/Caja";

export default function ListaUsers() {

    return (
        <Layout>
            <CajaMenu>
                <h1>Lista de Usuarios</h1>
                <button className="btn-azul btn-atras" onClick={() => window.history.back()}>← Atras</button>
            </CajaMenu>
        </Layout>
    );

}