const { Client, NoAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');
const { updateConnection,updateState,updateQR } = require('../Helpers/ConnectionHelper');
const { store,updateACK } = require('../Helpers/MessageHelper');

let clients={};

// Función para limpiar sesión corrupta
async function cleanSession(connection_id) {
    const sessionPath = path.join(__dirname, `../../sess/session-${connection_id}`);
    try {
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log(`✅ Sesión limpiada: ${sessionPath}`);
    } catch (error) {
        console.log(`⚠️ No se pudo limpiar sesión: ${error.message}`);
    }
}

async function ClientConnect(connection_id) {
    // Limpiar sesión previa si existe
    await cleanSession(connection_id);
    
    let client = new Client({    
        authStrategy: new NoAuth(),
        puppeteer: {
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--disable-dev-profile'
            ],
            userDataDir: `./sess/session-${connection_id}`
        }
    });

    client.on('qr', async (qr) => {
        console.log(`WEFIL: QR ${qr} CONN_ID: ${connection_id}`);
        qrcode.generate(qr, {small: true});
        await updateQR({connection_id,qr});
    });

    client.on('authenticated', async (e) => {
        console.log("WEFIL AUTH: ",connection_id);
        await updateState({connection_id,status:'CONNECTED'});
    });

    client.on('auth_failure', async msg => {
        console.log("WEFIL AUTH FAIL: ",connection_id);
        await updateState({connection_id,status:'DISCONNECTED'});
    });

    client.on('ready', async (e) => {
        console.log(`WEFIL: ${connection_id} Whatsapp enlazado, listo para enviar y recibir mensajes.`);
        await updateConnection({
            connection_id,
            name:client.info.pushname,
            status:'CONNECTED',
            number:client.info.wid.user
        });
    });

    client.on('message_create', async (msg) => {
        const data=msg._data;
        console.log("WEFIL: Nuevo mensaje recibido.");
        const client_id=client.options.authStrategy.clientId;
        console.log("WEFIL: Client ID:",client_id);

        if(data.id.remote!=='status@broadcast'){
            const message={
                'body':(data.type!=='chat') ? (data.caption!==null) ? data.caption : 'Multimedia' : data.body,
                'ack':data.ack,
                'from_me':data.id.fromMe,
                'id_message_wp':data.id.id,
                'to':data.to.split('@')[0],
                'number':data.from.split('@')[0],
                'media_type':data.type,
                'notify_name':data.notifyName,
                'media_url':(data.type==='chat') ? '' : data.body,
                'timestamp':data.t,
                'is_private':0
            };

            let resp=[];

            if(
                data.type!=='video' &
                (   data.type=='audio'      || 
                    data.type=='image'      ||
                    data.type=='chat'       || 
                    data.type=='document'   || 
                    data.type=='ptt'
                ) &
                data.type!=='call_log' &
                data.type!=="e2e_notification" &
                data.type!=='notification_template'
            ){
                if(data.type!=='chat'){
                    try{
                        const attachmentData = await msg.downloadMedia();
                        message.data=attachmentData.data;
                        message.media_url=`${new Date()}.${attachmentData.mimetype.split('/')[1]}`;
                        message.filename=`${new Date()}.${attachmentData.mimetype.split('/')[1]}`;
                        message.filetype=attachmentData.mimetype.split('/')[0];
                        message.fileformat=attachmentData.mimetype.split('/')[1];
                    }catch(error){
                        console.log("WEFIL: Error procesando multimedia: ",error);
                    }
                }

                console.log(data.id);

                if(data.id.fromMe===false){
                    await store({message:message,msg:msg});
                }
            }else{
                console.log("WEFIL: No se soporta videos ni llamadas.")
            }
        }
    });
    
    client.on('message_ack',async (msg, ack) => {
        /*
            == ACK VALUES ==
            ACK_ERROR (No enviado): -1
            ACK_PENDING (Pendiente de entregar): 0
            ACK_SERVER (Enviado): 1
            ACK_DEVICE (Entregado): 2
            ACK_READ (Leído): 3
            ACK_PLAYED (Abierto, Reproducido): 4
        */
        const data=msg._data;

        const message={
            'ack':data.ack,
            'from_me':data.id.fromMe,
            'id_wp':data.id.id,
            'timestamp':data.t,
            'body':data.body
        };

        const message_ws={
            'ack':data.ack,
            'from_me':data.id.fromMe,
            'id_wp':data.id.id,
            'timestamp':data.t
        };

        if(data.id.fromMe){
            await updateACK({message,message_ws});
        }
    });

    let rejectCalls = false;

    client.on('call', async (call) => {
        console.log('Call received, rejecting. GOTO Line 261 to disable', call);
        if (rejectCalls) await call.reject();
        // await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? 'This call was automatically rejected by the script.' : ''}`);
    });

    client.on('disconnected',async (reason) => {
        console.log(`WEFIL: Desconectado ${connection_id} - Razón: ${reason}`);
        await updateState({connection_id,status:'DISCONNECTED'});
    });

    await client.initialize();
    clients[connection_id] = client;
}

module.exports = {
    ClientConnect,
    clients
}