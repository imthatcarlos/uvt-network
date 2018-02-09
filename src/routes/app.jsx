import Dashboard from 'views/Dashboard/Dashboard';
import Gateway from 'views/Gateway/Gateway';
import TableList from 'views/TableList/TableList';
import Client from 'views/Client/Client';
import Notifications from 'views/Notifications/Notifications';


const appRoutes = [
    { path: "/client", name: "UVT Client", icon: "pe-7s-map-2", component: Client },
    { path: "/gateway", name: "UVT Gateway", icon: "pe-7s-signal", component: Gateway },
    { path: "/odr", name: "Open Device Registry", icon: "pe-7s-news-paper", component: TableList },
    { redirect: true, path:"/", to:"/client", name: "Client" }
];

export default appRoutes;
