
FROM node:20-alpine


WORKDIR /app


COPY package*.json ./
COPY backend/package*.json ./backend/


RUN npm install


COPY backend/ ./backend/

EXPOSE 3000


CMD ["npm", "run", "start", "--workspace=backend"]