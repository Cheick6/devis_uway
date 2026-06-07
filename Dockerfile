FROM node:18-slim

WORKDIR /app

COPY package*.json ./

# Installer TOUTES les dépendances (dev incluses, expo en a besoin)
RUN npm ci

COPY . .

# Expo web tourne sur le port 8081 (Metro) et 19006 (web)
EXPOSE 8081
EXPOSE 19006

# --web : lance en mode navigateur, --non-interactive : pas de prompt TTY
CMD ["npx", "expo", "start", "--web", "--non-interactive"]
