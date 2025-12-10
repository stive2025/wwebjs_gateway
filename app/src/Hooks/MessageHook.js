const downloadMediaFromUrl = async (url) => {
    const response = await fetch(url);
    const { MessageMedia } = require('whatsapp-web.js');
    const mime = require('mime-types');
    if (!response.ok) throw new Error(`Error al descargar archivo: ${response.statusText}`);

    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type');
    const base64 = Buffer.from(buffer).toString('base64');
    const media = new MessageMedia(mimeType, base64, 'file.' + mime.extension(mimeType));

    return media;
};

async function messageHook({e}) {
    const { getClients } = require('../Hooks/ClientsHook');
    const { MessageMedia } = require('whatsapp-web.js');
    const axios= require('axios');

    const clients = getClients();

    console.log("WEFIL: Nuevo mensaje desde CRM para enviar.");

    try {
        const rq = JSON.parse(e.data);
        const media = rq.media;

        if (media.length > 0) {
            media.map(async file => {
                const filePath = `${process.env.PUBLIC_PATH}${file.filename}`;
                console.log(filePath);
                let data = [];

                if (file.type !== 'video') {
                    let media = "";
                    if (file.type === 'audio') {
                        if (file.format === 'webm') {
                            
                            const response = await fetch(filePath);
                            if (!response.ok) throw new Error('Error al descargar el archivo de audio');
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            const base64Audio = buffer.toString('base64');
                            media = new MessageMedia('audio/ogg', base64Audio, 'voice.ogg');
                            const create_message = await clients[rq.user_id].sendMessage(`${rq.number}@c.us`, media, { sendAudioAsVoice: true, caption: file.caption });
                            data = create_message._data;

                        } else {
                            media = await downloadMediaFromUrl(filePath);
                            const create_message = await clients[rq.user_id].sendMessage(`${rq.number}@c.us`, media, { caption: file.caption });
                            data = create_message._data;
                        }
                    } else if (file.type === 'image') {
                        const response = await axios.get(filePath, {
                            responseType: 'arraybuffer'
                        });

                        media = new MessageMedia(
                            'image/jpeg',
                            Buffer.from(response.data, 'binary').toString('base64'),
                            'imagen.jpg'
                        );

                        const create_message = await clients[rq.user_id].sendMessage(`${rq.number}@c.us`, media, { caption: file.caption });
                        data = create_message._data;
                    } else {

                        media = await downloadMediaFromUrl(filePath);
                        const create_message = await clients[rq.user_id].sendMessage(`${rq.number}@c.us`, media, { caption: file.caption });
                        data = create_message._data;

                    }

                    const message = {
                        'body': (data.type !== 'chat') ? (file.caption !== "") ? file.caption : "Multimedia" : "Multimedia",
                        'ack': data.ack,
                        'from_me': true,
                        'id_message_wp': data.id.id,
                        'to': data.id.remote.split('@')[0],
                        'number': data.id.remote.split('@')[0],
                        'media_type': data.type,
                        'media_url': filePath,
                        'timestamp': data.t,
                        'is_private': 0,
                        'notify_name': data.id.remote.split('@')[0],
                        'temp_signature': rq.temp_signature
                    };

                    if (rq.chat_id !== null && rq.chat_id !== undefined) {
                        message.chat_id = rq.chat_id;
                    }

                    const request = await fetch(`${process.env.API_ROOT}/messages`, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                        },
                        body: new URLSearchParams(message)
                    });

                    const response = await request.json();
                }
            });
        } else {

            const send = await clients[rq.user_id].sendMessage(`${rq.number}@c.us`, rq.body);
            const data = send._data;
            const message = {
                'body': data.body,
                'ack': data.ack,
                'from_me': data.id.fromMe,
                'id_message_wp': data.id.id,
                'to': data.id.remote.split('@')[0],
                'number': data.id.remote.split('@')[0],
                'media_type': data.type,
                'media_url': "",
                'timestamp': data.t,
                'is_private': 0,
                //'temp_signature': rq.temp_signature
            };

            if (rq.chat_id !== null) {
                message.chat_id = rq.chat_id;
            }
            
            const request = await fetch(`${process.env.API_ROOT}/messages`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: new URLSearchParams(message)
            });

            const response = await request.json();

            console.log(response)

            if (response.status === 200) {
                console.log("WEFIL: Mensaje enviado");
            } else {
                console.log("WEFIL: Mensaje no enviado");
            }
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = { messageHook };