const path = require('path');
const dotenv = require('dotenv');

const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

const { getConnections } = require('./src/Helpers/ConnectionHelper');
const { ClientConnect } = require('./src/Services/ClientService');

let connections=[];

(async function () {
    try {
        //  Obtenemos el listado de conexiones
        connections = await getConnections();
        
        //  Inicializamos los clientes
        connections.forEach(connection=>{
            ClientConnect(connection);
        });
    } catch (error) {
        console.error('Error:', error);
    }
})();