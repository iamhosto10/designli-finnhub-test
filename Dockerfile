# 1. Usamos una versión ligera de Node 20 (la misma de tu entorno local)
FROM node:20-alpine

# 2. Establecemos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de configuración principales del monorepo
COPY package*.json ./
COPY backend/package*.json ./backend/

# 4. Instalamos todas las dependencias
RUN npm install

# 5. Copiamos el código fuente del backend (y el JSON de Firebase que está ahí dentro)
COPY backend/ ./backend/

# 6. Exponemos el puerto
EXPOSE 3000

# 7. Ejecutamos el mismo comando que usas en tu terminal local
CMD ["npm", "run", "dev", "--workspace=backend"]