# PhotoMax

> **Plataforma completa de gestão para fotógrafos.**
> Contratos, finanças, tarefas e CRM — tudo num só lugar, com visual sofisticado e operação offline-first.

🌐 **Demo online:** [https://guidevin.github.io/PhotoMax/](https://guidevin.github.io/PhotoMax/)

![PhotoMax](./public/favicon.svg)

## ✨ Funcionalidades

- 📋 **Contratos** — Pipeline completo (rascunho → enviado → assinado → em andamento → concluído), com pagamentos parcelados e controle de status.
- 💼 **Serviços** — Catálogo de pacotes por categoria (ensaio, casamento, corporativo, produto…) com preço em centavos.
- 👥 **Clientes (CRM)** — Base de contatos com tags, notas, histórico e estatísticas por cliente.
- 💸 **Financeiro** — Receita, despesas, impostos estimados, lucro líquido e gráfico de receita por serviço.
- 🗂️ **Tarefas (Kanban)** — Drag-and-drop lateral para mudar status. Quatro colunas: Backlog → Em andamento → Revisão → Concluídas.
- 🌗 **Tema escuro/claro** — Segue o sistema ou configure manualmente.
- 💾 **Offline-first** — Tudo persiste localmente no navegador via `localStorage` (criptografado por origem). Backup/Restore em JSON.
- 🛡️ **Seguro** — Sanitização de inputs, limites rígidos, sem `innerHTML`, headers de segurança e tipagem 100% TypeScript estrita.

## 🚀 Stack

- **React 18** + **TypeScript** (strict)
- **Vite 5** (build ultrarrápido com chunks separados)
- **Zustand** (estado centralizado com persistência segura)
- **React Router 6** (SPA com fallback para GitHub Pages)
- **Tailwind CSS** (design system completo, dark mode)
- **Framer Motion** (animações fluidas)
- **@dnd-kit** (drag-to-side acessível)
- **Recharts** (gráficos)
- **lucide-react** (ícones SVG)

## 🛠️ Scripts

```bash
npm install          # instala dependências
npm run dev          # servidor de desenvolvimento (Vite)
npm run build        # build de produção (tsc + vite build)
npm run preview      # preview do bundle final
npm run audit        # auditoria automatizada de segurança
npm run test:security  # bateria de testes de segurança
```

### Build para GitHub Pages (já configurado)

```bash
npm run build        # usa base /PhotoMax/ por padrão
# saída em dist/, pronta pra deploy
```

Para hospedar em outro caminho (ex.: domínio próprio), use:

```bash
VITE_BASE=/ npm run build
```

## 🌐 Deploy no GitHub Pages

Este projeto já vem com:

- `base: '/PhotoMax/'` configurado no `vite.config.ts`
- `public/404.html` com fallback SPA (deep links funcionam)
- `public/.nojekyll` (desabilita Jekyll do GH Pages)

### Setup inicial (uma vez só)

1. Crie o repositório no GitHub: <https://github.com/new>
   - Nome: `PhotoMax`
   - Visibilidade: Public
   - **Não** marque "Initialize with README" (você já tem um)
2. Adicione o remote:

   ```bash
   git remote add origin https://github.com/GuiDevin/PhotoMax.git
   ```

3. Faça push da branch `main`:

   ```bash
   git push -u origin main
   ```

4. Nas configurações do repo no GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **root**
5. Para publicar o conteúdo do `dist/` a cada release, basta rodar:

   ```bash
   npm run build
   git add dist -f
   git commit -m "deploy: build artifacts"
   git subtree push --prefix dist origin gh-pages
   ```

   Ou use uma Action automática (veja `.github/workflows/deploy.yml` abaixo).

### Workflow de deploy automático

Já incluímos um workflow GitHub Actions em `.github/workflows/deploy.yml`. Cada push em `main` faz build e publica em `gh-pages` automaticamente. Basta:

1. Habilitar GitHub Pages no repo (Settings → Pages → Source: GitHub Actions)
2. Pronto — push em `main` = deploy

## 🛡️ Segurança implementada

| Camada              | O que é feito                                                                                       |
|---------------------|------------------------------------------------------------------------------------------------------|
| Inputs              | `sanitizeText`, `sanitizeEmail`, `sanitizePhone`, `sanitizeMultiline`, `sanitizeTags` antes de gravar |
| IDs              | `crypto.randomUUID` com fallback CSPRNG (`getRandomValues`)                                           |
| Storage             | Limite de 4 MB por chave; `safeJsonParse`; **rate-limit** 8 writes/s; schema versionado               |
| Schema validation   | Import JSON valida shape completo (tipos, ranges, datas) antes de persistir                          |
| Render              | Zero uso de `innerHTML` / `dangerouslySetInnerHTML`; React JSX faz escaping                          |
| TypeScript          | `strict`, `noUnusedLocals`, `noImplicitReturns`, `noFallthroughCasesInSwitch`                      |
| CSP                | `default-src 'self'`, sem `eval`, sem scripts inline, `frame-ancestors 'none'`                       |
| HTTP headers         | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`           |
| Backup              | Export/Import JSON validado, com mensagens de erro claras                                            |

## 📁 Estrutura

```
src/
├── components/
│   ├── dashboard/     # StatCard, RevenueChart, ServiceBreakdownChart
│   ├── layout/        # Sidebar, Topbar, AppShell, PageHeader
│   ├── tasks/         # KanbanColumn, TaskCard
│   └── ui/            # Modal, Button, Input, Badge, …
├── data/              # seed inicial
├── hooks/             # useTheme, useToast, useGlobalSearch
├── pages/             # Dashboard, Services, Contracts, Clients, Finance, Tasks, Settings
├── store/             # Zustand store central
├── types/             # tipos de domínio
├── utils/             # security, storage, format, classnames
├── App.tsx
├── main.tsx
└── index.css          # Tailwind + design system
```

## 📦 Build de produção

```bash
npm run build
```

Saída em `dist/`. Hospede em qualquer servidor estático (GitHub Pages, Vercel, Netlify, Cloudflare Pages, S3…).

— Feito com 💜 para a comunidade de fotografia.