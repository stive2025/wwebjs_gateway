const WebSocket = require('ws');
const conn = new WebSocket(process.env.WS_ROOT);
const { messageHook } = require('../Hooks/MessageHook');

conn.onopen = function(e) {
    console.log("WS: CONNECTED");
};

conn.onerror=function(e){
    console.log(e);
}

conn.onmessage=async (e)=>{
    const data=JSON.parse(e.data);
    if(data.ch_type==="NEW.MESSAGE"){
        await messageHook({e});
    }else if(data.ch_type==="NEW.CONNECTION"){

    }else if(data.ch_type==="CONTACT.SYNC"){
        
    }else if(data.ch_type==="CHAT.SYNC"){

    }
}

module.exports = { conn }