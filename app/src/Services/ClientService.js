const { Client, LocalAuth } = require("whatsapp-web.js");
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
    // NO limpiar sesión para mantener autenticación
    // await cleanSession(connection_id);
    
    let client = new Client({    
        authStrategy: new LocalAuth({
            dataPath: './sess',
            clientId: connection_id
        }),
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
            //userDataDir: `./sess/puppeteer-${connection_id}`
        }
    });

    client.on('qr', async (qr) => {
        console.log(`WEFIL: QR ${qr} CONN_ID: ${connection_id}`);
        qrcode.generate(qr, {small: true});
        await updateQR({connection_id,qr});
    });

    client.on('authenticated', async (e) => {
        console.log("WEFIL AUTH: ",connection_id);
        await updateState({connection_id,status:'AUTHENTICATED'});
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
        const client_id=connection_id; // Usar connection_id directamente
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

            if(
                data.type!=='video' &&
                (data.type==='audio' || 
                 data.type==='image' ||
                 data.type==='chat' || 
                 data.type==='document' || 
                 data.type==='ptt') &&
                data.type!=='call_log' &&
                data.type!=="e2e_notification" &&
                data.type!=='notification_template'
            ){
                if(data.type!=='chat' && msg.hasMedia){
                    try{
                        console.log(`WEFIL: Descargando media tipo: ${data.type}`);
                        
                        const downloadPromise = msg.downloadMedia();
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout descargando media')), 30000)
                        );
                        
                        const attachmentData = await Promise.race([downloadPromise, timeoutPromise]);
                        
                        if(attachmentData){
                            message.data=attachmentData.data;
                            message.media_url=`${new Date().getTime()}.${attachmentData.mimetype.split('/')[1]}`;
                            message.filename=`${new Date().getTime()}.${attachmentData.mimetype.split('/')[1]}`;
                            message.filetype=attachmentData.mimetype.split('/')[0];
                            message.fileformat=attachmentData.mimetype.split('/')[1];
                            console.log(`✅ Media descargada: ${message.filename}`);
                        }
                    }catch(error){
                        console.error(`❌ Error descargando multimedia (${data.type}):`, error.message);
                        message.media_url = '';
                        message.body = `[Media no disponible: ${data.type}]`;
                    }
                }

                console.log("ID Mensaje:", data.id);

                if(data.id.fromMe===false){
                    await store({message:message,msg:msg});
                }
            }else{
                console.log("WEFIL: Tipo de mensaje no soportado:", data.type);
            }
        }
    });
    
    client.on('message_ack',async (msg, ack) => {
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
    });

    client.on('disconnected',async (reason) => {
        console.log(`WEFIL: Desconectado ${connection_id} - Razón: ${reason}`);
        await updateState({connection_id,status:'DISCONNECTED'});
        
        if (clients[connection_id]) {
            delete clients[connection_id];
        }
    });

    await client.initialize();
    clients[connection_id] = client;
}

function getClients(){
    return clients;
}

module.exports = {
    ClientConnect,
    clients,
    getClients,
    cleanSession
}