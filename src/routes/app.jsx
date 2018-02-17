import Gateway from 'views/Gateway/Gateway';
import Registry from 'views/Registry/Registry';
import Client from 'views/Client/Client';


const appRoutes = [
    { path: "/client", name: "UVT Client", icon: "pe-7s-global", component: Client },
    { path: "/gateway", name: "UVT Gateway", icon: "pe-7s-signal", component: Gateway },
    { path: "/odr", name: "Open Device Registry", icon: "pe-7s-news-paper", component: Registry },
    { redirect: true, path:"/", to:"/client", name: "Client" }
];

export default appRoutes;
