import Dashboard from 'views/Dashboard/Dashboard';
import Gateway from 'views/Gateway/Gateway';
import TableList from 'views/TableList/TableList';
import Maps from 'views/Maps/Maps';
import Notifications from 'views/Notifications/Notifications';


const appRoutes = [
    { path: "/wallet", name: "Wallet", icon: "pe-7s-wallet", component: Dashboard },
    { path: "/client", name: "Client Software", icon: "pe-7s-map-2", component: Maps },
    { path: "/odr", name: "Open Device Registry", icon: "pe-7s-news-paper", component: TableList },
    { path: "/gateway", name: "UVT Gateway", icon: "pe-7s-signal", component: Gateway },
    { path: "/logs", name: "Logs", icon: "pe-7s-coffee", component: Notifications },
    { redirect: true, path:"/", to:"/wallet", name: "Dashboard" }
];

export default appRoutes;
