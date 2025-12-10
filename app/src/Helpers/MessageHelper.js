/**
 * Para actualizar estados ACK
 */
const { conn } = require('../Services/BroadcastService');

//  Actualización de ACK de mensajes
async function updateACK({ message, message_ws }) {
    const request = await fetch(`${process.env.API_ROOT}/messages/updateACK`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
        },
        body: new URLSearchParams(message)
    });

    const response = await request.json();

    if (response.status === 200) {
        message_ws.chat_id = response.chat_id;
        message_ws.user_id = response.user_id;
        message_ws.temp_signature = response.temp_signature;

        conn.send(JSON.stringify(message_ws));
    }
}

//  Para guardar un mensaje nuevo
async function store({ message, msg }) {
    try {
        const request = await fetch(`${process.env.API_ROOT}/messages`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: new URLSearchParams(message)
        });
        const response = await request.json();
        resp = response;
        message.filename = response.media_path;

        if (msg.fromMe) {
            console.log(`WEFIL: Mensaje interno creado correctamente.`);
        } else {
            console.log(`WEFIL: Mensaje externo creado correctamente.`);
            message.user_id = resp.user_id;
            message.chat_id = resp.chat_id;
            conn.send(JSON.stringify(message));
        }
    } catch (error) {
        console.log("WEFIL: Error enviando mensaje a backend: ", error);
    }
}

module.exports = {
    updateACK,
    store
};