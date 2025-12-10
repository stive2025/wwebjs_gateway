const { clients } = require('../Services/ClientService');

const getClients = () => {
    return clients;
}

module.exports = { getClients };