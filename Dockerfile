FROM node:18-bullseye

# Instalar dependencias del sistema para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar el package.json desde la carpeta app
COPY app/package*.json ./

# Ejecutar npm install
RUN npm install

# Copiar el resto del código de la carpeta app
COPY app/ ./

# Copiar archivo .env de producción si existe
RUN if [ -f /app/.env.production ]; then cp /app/.env.production /app/.env.local; fi

# Crear directorio para sesiones de WhatsApp
RUN mkdir -p /app/.wwebjs_auth && chmod 777 /app/.wwebjs_auth

EXPOSE 3000

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

CMD ["node", "wweb_server.js"]