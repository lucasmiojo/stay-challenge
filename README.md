# 🏦 Pension Withdrawals API

API para **gestão de resgates de planos de previdência privada**, desenvolvida com **Node.js (NestJS)**, **PostgreSQL**, **RabbitMQ** e **Redis**, executada de forma orquestrada via **Docker Compose**.

---

## 🚀 Tecnologias Utilizadas

- **Node.js / NestJS** – Framework backend principal
- **PostgreSQL** – Banco de dados relacional
- **RabbitMQ** – Sistema de mensageria (filas)
- **Redis** – Cache e filas auxiliares
- **Docker Compose** – Orquestração dos serviços
- **Jest** – Framework de testes automatizados

---

## 🧭 Visão Geral do Fluxo de Resgates

### 💡 Resumo do processo

1. O usuário solicita um **resgate** (`withdrawal request`).
2. Se o valor for **resgatável**, é criado um registro com status **`PENDING`**, e uma mensagem é enviada para a fila **`requested-withdrawal`**.
3. O **consumidor RabbitMQ** processa essa mensagem:
   - Se a transação **já existir**, cria um registro com status **`REJECTED`** e envia uma mensagem para a fila **`rejected-withdrawal`**.
   - Caso contrário, cria o registro com status **`CONFIRMED`**.
4. A API retorna para o cliente o objeto original com status **`PENDING`**.

### 📊 Diagrama de Fluxo (Mermaid)

```mermaid
flowchart TD
    A[Usuário solicita resgate] --> B[Verifica se valor é resgatável]
    B -->|Sim| C[Cria registro PENDING no banco]
    C --> D[Envia mensagem para fila requested-withdrawal]
    D --> E[Consumidor processa mensagem]
    E -->|Transação duplicada| F[Cria registro REJECTED no banco]
    F --> G[Envia mensagem para fila rejected-withdrawal]
    E -->|Transação nova| H[Cria registro CONFIRMED no banco]
    H --> I[Retorna objeto PENDING ao usuário]
    B -->|Não| F
```

---

## 🧱 Estrutura do Projeto

```
src/
 ├── api/
 │   ├── balance/
 │   ├── status/
 │   └── withdrawals/
 │   └── taxation/
 ├── application/
 │   ├── dtos/
 │   ├── use-cases/
 ├── domain/
 │   ├── entities/
 │   ├── factories/
 │   └── services/
 │   └── value-objects/
 └── infra/
     ├── config/
     │   └── rabbitmq/
     └── persistence/
         └── database/
              ├── postgres
              ├── redis
         └── repositories/
```

---

## 🐳 Execução com Docker Compose

### ⚙️ Pré-requisitos

- **Docker** e **Docker Compose** instalados
- As seguintes portas precisam estar livres:
  - `5007` (API)
  - `5432` (PostgreSQL)
  - `15672` (RabbitMQ)
  - `6379` (Redis)
  - `8080` (pgAdmin)

### ▶️ Subir todo o ambiente

```bash
docker-compose up --build
```

Esse comando sobe **PostgreSQL**, **RabbitMQ**, **Redis**, **pgAdmin** e a **API NestJS**, aguardando o RabbitMQ ficar pronto antes de inicializar a aplicação.

A API ficará disponível em:  
👉 **http://localhost:5007**

---

## 💾 Acesso aos Painéis e Ferramentas

| Serviço           | URL de Acesso                                    | Credenciais                                  | Descrição                                             |
| ----------------- | ------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| 🐰 **RabbitMQ**   | [http://localhost:15672](http://localhost:15672) | **user / password**                          | Painel de controle e monitoramento de filas.          |
| 🐘 **pgAdmin**    | [http://localhost:8080](http://localhost:8080)   | **admin@local.com / admin123**               | Interface web para acessar o PostgreSQL (`pensions`). |
| 🔥 **Redis**      | Porta local `6379`                               | Sem autenticação                             | Cache e filas auxiliares.                             |
| 🧱 **PostgreSQL** | Host: `localhost` • Porta: `5432`                | **adminuser / newpassword** • DB: `pensions` | Banco principal da aplicação.                         |

> 💡 O painel do **RabbitMQ** exibe em tempo real o status das filas `requested-withdrawal` e `rejected-withdrawal`.  
> O **pgAdmin** permite consultar e inspecionar os dados persistidos de usuários, planos e resgates.

---

## 🧠 Variáveis de Ambiente

Configuradas automaticamente pelo `docker-compose.yml`:

| Variável       | Descrição               | Valor padrão                         |
| -------------- | ----------------------- | ------------------------------------ |
| `PG_HOST`      | Host do banco de dados  | `postgres`                           |
| `PG_PORT`      | Porta do banco          | `5432`                               |
| `PG_USER`      | Usuário do banco        | `adminuser`                          |
| `PG_PASSWORD`  | Senha do banco          | `newpassword`                        |
| `PG_DATABASE`  | Nome do banco           | `pensions`                           |
| `RABBITMQ_URL` | URL de conexão RabbitMQ | `amqp://user:password@rabbitmq:5672` |
| `NODE_ENV`     | Ambiente de execução    | `development`                        |

---

## 🧪 Testes Automatizados

Os testes utilizam **Jest** e cobrem:

- **Controllers**: chamadas HTTP e parâmetros
- **Use Cases**: lógica de negócio de resgates e confirmações
- **Produtores RabbitMQ**: envio correto para filas
- **Repositórios**: simulação de persistência e mocks

### ▶️ Executar testes

```bash
npm test
```

ou, para executar em modo de observação:

```bash
npm run test:watch
```

---

## 🧰 Comandos Úteis

| Comando                      | Descrição                                    |
| ---------------------------- | -------------------------------------------- |
| `docker-compose up -d`       | Sobe todos os containers em background       |
| `docker-compose down -v`     | Remove containers e volumes                  |
| `docker-compose logs -f api` | Exibe logs em tempo real da API              |
| `npm run start:dev`          | Inicia o servidor em modo de desenvolvimento |
| `npm run build`              | Compila o projeto                            |
| `npm test`                   | Roda os testes automatizados                 |

---

## 🧾 Execução Manual (sem Docker)

Caso queira rodar sem containers:

```bash
npm install
npm run start:dev
```

> Certifique-se de ter um PostgreSQL e RabbitMQ rodando localmente com as variáveis de ambiente configuradas conforme a tabela acima.

---

## 🔍 Monitoramento e Depuração

- Verifique logs do RabbitMQ:
  ```bash
  docker-compose logs -f rabbitmq
  ```
- Monitore mensagens publicadas:
  - `requested-withdrawal` → novas solicitações de resgate
  - `rejected-withdrawal` → resgates rejeitados
- Verifique filas via painel: [http://localhost:15672](http://localhost:15672)

---

## 🧑‍💻 Autor

**Lucas Costa**  
Desenvolvedor Backend • Arquitetura Distribuída • Node.js • Web3

---

## 🧾 Licença

Projeto privado — uso interno e restrito.
