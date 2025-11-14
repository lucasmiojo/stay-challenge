# 🏦 Pension API

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

Antes de detalhar o fluxo operacional, é importante entender que, dependendo do tipo de plano (PGBL ou VGBL), o valor final resgatado passa por uma regra específica de tributação aplicada pelo domínio.

### 💡 Resumo do processo

1. O usuário solicita um **resgate** (`withdrawal request`).
2. A aplicação verifica:
   - Se existe saldo suficiente.
   - Se o valor solicitado respeita limites e regras internas.
3. Se o valor for **resgatável**, é criado um registro com status **`PENDING`**, e uma mensagem é enviada para a fila **`requested-withdrawal`**.
4. O **consumidor RabbitMQ** processa essa mensagem:
   - Se a transação **já existir**, cria um registro com status **`REJECTED`** e envia uma mensagem para a fila **`rejected-withdrawal`**.
   - Caso contrário, cria o registro com status **`CONFIRMED`**.
5. A API retorna para o cliente o objeto original com status **`PENDING`**.

---

### 🧠 Como funciona a tributação nos resgates (PGBL e VGBL)

A tributação é aplicada **antes da confirmação** do resgate, de acordo com o tipo de estratégia definida no plano do cliente.  
O cálculo é sempre feito sobre o Value Object **Money**, composto por:

- `amount`: valor inteiro em centavos
- `currency`: moeda (ex.: `R$`)

#### 🟦 PGBL — Tributação aplicada sobre o valor total solicitado

No modelo **PGBL**, o imposto incide sobre **todo o valor solicitado**, independentemente do histórico de contribuições.

Características principais:

- A base de cálculo é **100% do montante solicitado**.
- Regra simples e direta.
- Costuma resultar em imposto maior que no VGBL.
- Recomendada para quem declara IR completo, podendo deduzir aportes.

#### 🟩 VGBL — Tributação aplicada somente sobre o lucro

No modelo **VGBL**, o imposto incide **apenas sobre o lucro**, calculado como:

```
valor solicitado – total já contribuído
```

Regras principais:

- Se o lucro for zero ou negativo, **não há imposto**.
- Apenas o excedente vira base tributável.
- Mantém o Value Object `Money` sempre em estado válido.
- Costuma ser mais vantajoso quando há muitos aportes acumulados.

---

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

## 📈 Observabilidade (Grafana, Loki e Prometheus)

A pasta **`./observability`** contém dois dashboards prontos para importação:

- `dashboard.loki.json` – Logs via Grafana Loki
- `dashboard.prometheus.json` – Métricas via Prometheus

Para importar:

1. Acesse Grafana
2. **Create → Import**
3. Envie o `.json`
4. Selecione a datasource (Loki ou Prometheus)

---

## 🐳 Execução com Docker Compose

### ⚙️ Pré-requisitos

- Docker e Docker Compose instalados
- Portas livres:
  - `5007`
  - `5432`
  - `15672`
  - `6379`
  - `8080`

### ▶️ Subir o ambiente

```bash
docker-compose up --build
```

API disponível em:  
👉 http://localhost:5007

---

## 💾 Acesso aos Painéis e Ferramentas

| Serviço       | URL de Acesso          | Credenciais                | Descrição                 |
| ------------- | ---------------------- | -------------------------- | ------------------------- |
| 🐰 RabbitMQ   | http://localhost:15672 | user / password            | Monitoramento de filas    |
| 🐘 pgAdmin    | http://localhost:8080  | admin@local.com / admin123 | Interface para PostgreSQL |
| 🔥 Redis      | localhost:6379         | —                          | Cache                     |
| 🧱 PostgreSQL | localhost:5432         | adminuser / newpassword    | Banco principal           |

---

## 🧠 Variáveis de Ambiente

| Variável       | Descrição              | Valor padrão                         |
| -------------- | ---------------------- | ------------------------------------ |
| `PG_HOST`      | Host do banco de dados | `postgres`                           |
| `PG_PORT`      | Porta do banco         | `5432`                               |
| `PG_USER`      | Usuário                | `adminuser`                          |
| `PG_PASSWORD`  | Senha                  | `newpassword`                        |
| `PG_DATABASE`  | Nome do banco          | `pensions`                           |
| `RABBITMQ_URL` | Conexão RabbitMQ       | `amqp://user:password@rabbitmq:5672` |
| `NODE_ENV`     | Ambiente               | `development`                        |

---

## 🧪 Testes Automatizados

Cobrem:

- Controllers
- Use Cases
- Produtores RabbitMQ
- Repositórios

### ▶️ Executar testes

```bash
npm test
```

Modo watch:

```bash
npm run test:watch
```

---

## 🧰 Comandos Úteis

| Comando                      | Descrição                   |
| ---------------------------- | --------------------------- |
| `docker-compose up -d`       | Sobe em background          |
| `docker-compose down -v`     | Remove containers e volumes |
| `docker-compose logs -f api` | Logs da API                 |
| `npm run start:dev`          | Desenvolvimento             |
| `npm run build`              | Build                       |
| `npm test`                   | Testes                      |

---

## 🔍 Monitoramento e Depuração

```bash
docker-compose logs -f rabbitmq
```

Filas:

- `requested-withdrawal`
- `rejected-withdrawal`

---

## 🧑‍💻 Autor

**Lucas Costa**  
Desenvolvedor Backend • Arquitetura Distribuída • Node.js • Web3

---

## 🧾 Licença

Projeto privado — uso interno e restrito.
