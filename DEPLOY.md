# 🚀 Como publicar no GitHub Pages

O build já está pronto em `dist/` e o commit local já foi feito (branch `main`).
Só falta criar o repositório no GitHub e dar o push.

## Passo 1 — Criar o repositório

Abra este link e preencha exatamente:

👉 **https://github.com/new**

| Campo          | Valor       |
|----------------|-------------|
| Owner          | `GuiDevin`  |
| Repository name| `PhotoMax`  |
| Description    | `PhotoMax — plataforma completa de gestão para fotógrafos` |
| Visibilidade   | ✅ Public  (obrigatório pra GitHub Pages gratuito)
| Initialize     | ❌ **NÃO** marcar nada (README, .gitignore, license) — já temos tudo |

Clique em **Create repository**.

## Passo 2 — Subir o código

Volta pro terminal e rode:

```powershell
cd C:\Users\MrDev\Desktop\PhotoMax
git push -u origin main
```

> Na primeira vez ele vai pedir autenticação. O navegador abre pra você autorizar o GitHub Desktop Manager — só confirmar.

## Passo 3 — Ativar GitHub Pages

Depois do push:

1. Vá em **https://github.com/GuiDevin/PhotoMax/settings/pages**
2. Em **Build and deployment → Source** escolha **GitHub Actions**
3. Salve (não precisa selecionar branch, é Actions)

Pronto! O workflow que está em `.github/workflows/deploy.yml` vai:
- Detectar o push em `main`
- Rodar `npm ci && npm run build`
- Publicar o conteúdo de `dist/` na branch `gh-pages`
- Servir em **https://guidevin.github.io/PhotoMax/**

## Verificação

Acompanhe o status do deploy em:
👉 **https://github.com/GuiDevin/PhotoMax/actions**

Quando o ✅ aparecer, abre:
👉 **https://guidevin.github.io/PhotoMax/**

(Em geral leva 1-2 minutos pra propagar.)

## Atualizações

Da próxima vez que mudar algo, é só:

```powershell
cd C:\Users\MrDev\Desktop\PhotoMax
git add .
git commit -m "sua mensagem aqui"
git push
```

O deploy é automático via Actions. ✨

---

Se aparecer erro de autenticação, crie um **Personal Access Token (PAT)**:
1. https://github.com/settings/tokens/new
2. Marque apenas `repo` (Full control of private repositories) e `workflow`
3. Copie o token gerado
4. Na primeira vez que o git pedir senha, cole o token (não a senha normal)