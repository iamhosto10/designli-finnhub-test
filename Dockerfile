
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install

COPY backend/ ./backend/

RUN npm run build --workspace=backend

EXPOSE 3000


CMD ["npm", "run", "start", "--workspace=backend"]