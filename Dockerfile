# Usar Node LTS
FROM node:20

# Criar diretório da app
WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Expor porta da API
EXPOSE 5007

# Rodar em modo dev
CMD ["npm", "run", "start:dev"]
