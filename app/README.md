# 🌐 Proyecto CRM WEFIL

Este proyecto usa archivos `.env` para manejar variables de entorno en diferentes entornos (desarrollo y producción) usando la librería [`dotenv`](https://www.npmjs.com/package/dotenv).

---
## Archivos de entorno

###  Debug
`Entorno local`
npm run dev

`Entorno de producción`
npm run start
pm2 start wweb_server.sh

#  Whatsapp Service ACK
- ACK_ERROR (No enviado):               -1
- ACK_PENDING (Pendiente de entregar):  0
- ACK_SERVER (Enviado):                 1
- ACK_DEVICE (Entregado):               2
- ACK_READ (Leído):                     3
- ACK_PLAYED (Abierto, Reproducido):    4
