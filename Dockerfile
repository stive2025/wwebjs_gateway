FROM node:18-bullseye

# Instalar dependencias del sistema para Puppeteer y FFmpeg
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

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install

# Copiar el resto del código
COPY . .

# Copiar archivo .env de producción (si existe)
RUN if [ -f .env.production ]; then cp .env.production /app/app/.env.local; fi

# Crear directorio para sesiones de WhatsApp
RUN mkdir -p /app/.wwebjs_auth && chmod 777 /app/.wwebjs_auth

# Exponer puerto (ajusta según tu aplicación)
EXPOSE 3000

# Variable de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Comando para iniciar la aplicación
CMD ["node", "app/src/index.js"]