# TimeWise Web

**Organizar tarefas é só o começo. O próximo passo é encontrar tempo para elas.**

Aplicação web de planejamento pessoal que reúne tarefas, compromissos e uma agenda gerada a partir das prioridades e dos horários disponíveis. O projeto inclui um assistente de IA que recebe o contexto da rotina para sugerir ajustes.

## O que o código implementa

- Cadastro de tarefas com prioridade, prazo e duração estimada.
- Compromissos únicos ou recorrentes.
- Alocação de tarefas considerando compromissos, sono e períodos produtivos.
- Estratégias para preencher o primeiro dia, distribuir tarefas ou limitar a uma tarefa por dia.
- Relatórios de produtividade e tempo por categoria.
- Autenticação com Clerk e assistente com respostas em streaming pela API da OpenAI.

A distribuição da agenda é feita por regras no backend. A IA é usada no assistente de conversa.

## Estrutura

| Caminho | Responsabilidade |
| :--- | :--- |
| [`frontend/pages/`](frontend/pages/) | Dashboard, tarefas, agenda, compromissos, perfil, relatórios e assistente. |
| [`frontend/components/`](frontend/components/) | Layout e componentes da interface. |
| [`backend/agenda/`](backend/agenda/) | Regras de alocação de tarefas. |
| [`backend/assistant/`](backend/assistant/) | Assistente e montagem do contexto enviado à API. |
| [`backend/auth/`](backend/auth/) | Autenticação e associação dos usuários. |
| [`backend/db/`](backend/db/) | Banco de dados e migrações SQL. |

**Stack:** TypeScript · React 19 · Vite · Tailwind CSS · Encore.ts · PostgreSQL · Clerk

## Desenvolvimento local

O projeto usa **Bun** para os pacotes e **Encore CLI** para o backend. Instale as dependências na raiz:

```sh
bun install
```

Antes de executar, configure os segredos `ClerkSecretKey` e `OpenAIKey` no ambiente Encore. A constante `PUBLISHABLE_KEY` em `frontend/App.tsx` deve apontar para sua própria aplicação Clerk. Ela é uma chave pública de frontend; as chaves privadas ficam no backend.

Em um terminal:

```sh
cd backend
encore run
```

Em outro:

```sh
cd frontend
bunx vite dev
```

Consulte [`DEVELOPMENT.md`](DEVELOPMENT.md) para os detalhes do ambiente, geração do cliente e implantação. As referências de nuvem nesse documento pertencem ao ambiente original e precisam ser adaptadas ao criar uma instalação própria.

## Estado e dados utilizados

O repositório contém frontend e backend, mas exige configuração dos serviços externos para funcionar. Ao usar o assistente, o backend envia à API da OpenAI informações do perfil, até dez tarefas pendentes e até cinco compromissos futuros para montar a resposta.

A proposta de versão desktop está no repositório [TimeWise](https://github.com/kenzomatsui/TimeWise); seu código ainda não foi publicado.
