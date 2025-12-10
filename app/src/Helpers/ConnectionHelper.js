const { conn } = require('../Services/BroadcastService');
const ch_type='CONNECTION';

async function getConnections() {
    return [2,4,5,6,7,8,56,57,60];
}

//  Conectado a Whatsapp
async function updateConnection({connection_id,name,status,number}){
    const request=await fetch(`${process.env.API_ROOT}/connections/${connection_id}`,{
        method:'PUT',
        headers: {
            Accept: 'application/json',
        },
        body:new URLSearchParams({
            status,
            number,
            name
        })
    });
    
    const response=await request.json();

    if(response.status===200){
        conn.send(JSON.stringify({
            connection_id,
            name,
            status,
            number,
            ch_type
        }));
    }
}

//  Para actualizar solo estado
async function updateState({connection_id,status}){
    const request=await fetch(`${process.env.API_ROOT}/connections/${connection_id}`,{
        method:'PUT',
        headers: {
            Accept: 'application/json',
        },
        body:new URLSearchParams({
            status
        })
    });
    
    const response=await request.json();

    if(response.status===200){
        conn.send(JSON.stringify({
            connection_id,
            status,
            ch_type
        }));
    }
}

//  Para actualizar el QR de la conexión
async function updateQR({connection_id,qr}){
    const request=await fetch(`${process.env.API_ROOT}/connections/${connection_id}`,{
        method:'PUT',
        headers: {
            Accept: 'application/json',
        },
        body:new URLSearchParams({
            qr_code:qr,
            status:'DISCONNECTED'
        })
    });
    
    const response=await request.json();

    if(response.status===200){
        conn.send(JSON.stringify({
            connection_id,
            qr,
            ch_type
        }));
    }
}

module.exports = {getConnections,updateConnection,updateQR,updateState}