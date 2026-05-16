# Repository Strategy — Track Pays

## Visión General

La estrategia de repositorio define cómo organizamos, gestionamos y mantenemos el código fuente de Track Pays. El objetivo es **mantener un historial limpio, colaboración eficiente, y releases predecibles**.

---

## Repositorio Real

| Campo | Valor |
|-------|-------|
| **Owner** | Charles-X-Core |
| **Repo** | trackPays2.0 |
| **URL** | https://github.com/Charles-X-Core/trackPays2.0 |
| **Rama default** | master |
| **Fork origen** | LuckTateYB/trackPays2.0 |
| **Commits** | 3 |
| **Despliegue** | Vercel (track-pays2-0.vercel.app) |
| **Stack** | Angular 21 + Vitest + TypeScript + SCSS |
| **Lenguajes** | TypeScript 42.5%, SCSS 29.9%, HTML 22.5%, PLpgSQL 5.1% |

---

## Configuración de Usuario

```bash
# Configurar git con tu usuario
git config user.name "Alonso"
git config user.email "alonsopichogmail.com"
```

---

## Estructura de Branches

### Ramas Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE BRANCHES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   master ────────────────────────────► Production               │
│    │                                                           │
│    │   (protected, solo merge via PR)                          │
│    │                                                           │
│    └── develop ────────────────────► Staging / QA              │
│         │                                                     │
│         │   (protected, solo merge via PR)                    │
│         │                                                     │
│    feature/*  ───►  topic branches                              │
│    fix/*                                                      │
│    refactor/*                                                 │
│    docs/*                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Rama | Propósito | Protected | Merge desde |
|------|-----------|-----------|-------------|
| **master** | Producción activa | ✅ Sí | develop solo |
| **develop** | Integración de features | ✅ Sí | feature/fix/refactor |
| **feature/** | Nuevas funcionalidades | ❌ No | PR a develop |
| **fix/** | Correcciones de bugs | ❌ No | PR a develop |
| **refactor/** | Refactoring sin features | ❌ No | PR a develop |
| **docs/** | Documentación | ❌ No | PR a develop |
| **experiment/** | Pruebas temporales | ❌ No | Delete sin merge |

---

## Convenciones de Nomenclatura

### Feature Branches

```
feature/{ticket}-{short-description}
```

Ejemplos:

- `feature/TSK-001-firebase-migration`
- `feature/TSK-015-quick-entry-v2`
- `feature/TSK-023-dashboard-redesign`
- `feature/TSK-031-theme-system`

### Fix Branches

```
fix/{ticket}-{short-description}
```

Ejemplos:

- `fix/TSK-042-login-redirect-issue`
- `fix/TSK-055-transaction-date-bug`
- `fix/TSK-067-dashboard-loading-slow`

### Refactor Branches

```
refactor/{ticket}-{short-description}
```

Ejemplos:

- `refactor/TSK-070-move-to-signals`
- `refactor/TSK-075-restructure-folders`
- `refactor/TSK-080-remove-deprecated-code`

### Docs Branches

```
docs/{document-name}
```

Ejemplos:

- `docs/testing-strategy`
- `docs/repo-strategy`
- `docs/roadmap-update`

---

## Mensajes de Commit

### Formato Estandar

```
{type}({scope}): {subject}

{body}

{footer}
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **feat** | Nueva funcionalidad | `feat(dashboard): add balance card component` |
| **fix** | Corrección de bug | `fix(auth): resolve login redirect issue` |
| **refactor** | Código sin cambio funcional | `refactor(engine): move calculations to financial engine` |
| **docs** | Documentación | `docs: add testing strategy document` |
| **style** | Formato, no lógica | `style: run prettier on all components` |
| **test** | Tests añadidos/modificados | `test: add unit tests for goal service` |
| **chore** | Mantenimiento, config | `chore: update package.json dependencies` |
| **perf** | Mejora de performance | `perf(dashboard): optimize re-renders` |
| **ci** | Cambios en CI/CD | `ci: add github action for tests` |

### Alcances (Scopes) Comunes

- `auth` - Autenticación
- `dashboard` - Dashboard
- `transactions` - Transacciones
- `goals` - Metas
- `core` - Servicios core
- `ui` - Componentes UI
- `config` - Configuración
- `deps` - Dependencias

### Ejemplos de Commits

**Bien estructurado**:
```
feat(auth): add Firebase Auth integration

- Implement FirebaseAuth service with email/password
- Add login, register, logout methods
- Create session management with signals
- Add auth guard for protected routes

Closes TSK-001
```

**Corto y simple**:
```
fix(dashboard): correct balance calculation for negative amounts
```

**Con breaking change**:
```
refactor(core): restructure services into features folder

BREAKING CHANGE: Import paths changed from @core/services
to @features/{feature}/services. Update imports accordingly.
```

### Reglas para Commits

1. **Idioma**: Inglés para subject, español opcional para body
2. **Línea subjetiva**: Max 72 caracteres
3. **Cuerpo**: Max 100 caracteres por línea
4. **Tipo en minúsculas**: `feat`, no `Feat` o `FEAT`
5. **Referencia de ticket**: Al final del commit (opcional) `Closes TSK-123`

---

## Pull Requests

### Flujo de Trabajo

```
1. Crear branch desde develop
   │
   ▼
2. Trabajar en feature, commits frecuentes
   │
   ▼
3. Push branch, crear PR
   │
   ▼
4. Code Review (mínimo 1 approval)
   │
   ▼
5. Aprobar y hacer merge a develop
   │
   ▼
6. Eliminar branch (opcional)
```

### Plantilla de PR

```markdown
## Descripción
[Breve descripción de los cambios]

## Tipo de Cambio
- [ ] Feature nueva
- [ ] Fix de bug
- [ ] Refactoring
- [ ] Documentación
- [ ] Otro

## Cómo Testear
[Pasos para verificar que funciona]

## Screenshots (si aplica)
[Imágenes del cambio]

## Checklist
- [ ] Tests añadidos/actualizados
- [ ] Código formateado (prettier)
- [ ] No hay errores de lint
- [ ] Documentación actualizada (si aplica)
```

### Reglas de Merge

| Condición | Requisito |
|-----------|-----------|
| **Mínimo approvals** | 1 approval requerido |
| **Tests** | Todos los tests deben pasar |
| **Lint** | Sin errores de lint |
| **Branch actualizado** | Debe tener develop actual (rebase/merge) |
| **Conflicts** | Resolver antes de merge |

---

## Código de Conducta para Commits

### ✅ Hacer

- Commits frecuentes y atómicos
- Mensajes claros y descriptivos
- Commits que hacen una sola cosa
- Probar código antes de hacer commit
- Sincronizar con develop regularmente

### ❌ Evitar

- Commits masivos ("wip", "many changes")
- Commits con código roto
- Commits sin mensaje o con "asdf"
- Commits de código que no compila
- Commits de archivos de IDE (`.idea/`, `*.suo`)

---

## Gestión de Versiones

### Versionado Semántico

```
MAJOR.MINOR.PATCH
│     │     │
│     │     └── Bug fixes, cambios menores
│     │
│     └── Nuevas features (backward compatible)
│
└── Breaking changes, cambios incompatibles
```

### Branch de Release

```
develop ─────────────────────────┐
                                 │
   ┌──────────┐                  │
   │ release/ │                  ▼
   │  1.0.0   │ ────►►► master ────►►►►►► Tag v1.0.0
   └──────────┘                  │
                                 │
   hotfix/* ─────────────────────┘
```
develop ─────────────────────────┐
                                 │
   ┌──────────┐                  │
   │ release/ │                  ▼
   │  1.0.0   │ ───►►►► main ────►►►►►►► Tag v1.0.0
   └──────────┘                  │
                                 │
   hotfix/* ─────────────────────┘
```

### Tags

```bash
# Crear tag de release
git tag -a v1.0.0 -m "Release v1.0.0 - Firebase Migration"

# Push tag
git push origin v1.0.0

# Listar tags
git tag -l
```

---

## Git Hooks

### Pre-commit Hook (Lint + Tests rápidos)

```json
// package.json
{
  "scripts": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"],
    "*.scss": ["prettier --format"]
  }
}
```

### Pre-push Hook (Tests completos)

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Running tests before push..."
pnpm test --run

if [ $? -ne 0 ]; then
  echo "Tests failed. Push aborted."
  exit 1
fi
```

---

## Configuración de Git

### Configuración Local

```bash
# Nombre y email
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Aliases útiles
git config alias.co checkout
git config alias.br branch
git config alias.st status
git config alias.lg "log --oneline --graph --decorate"
git config alias.last "log -1 HEAD"

# Auto-merge con rebase
git config pull.rebase true
git config rebase.autoStash true
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/
.angular/

# IDE
.idea/
.vscode/
*.suo
*.ntvs*

# Environment
.env
.env.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Vitest
.vitest/

# Misc
*.swp
*.swo
```

---

## Flujo de Trabajo Diario

### Iniciar el día

```bash
# 1. Sincronizar con develop
git fetch origin
git checkout develop
git pull origin develop

# 2. Crear nueva branch
git checkout -b feature/TSK-XXX-description
```

### Durante el día

```bash
# Guardar cambios frecuentemente
git add .
git commit -m "feat(auth): add login validation"

# Sincronizar con develop (si hay cambios)
git fetch origin
git rebase origin/develop
```

### Terminar el día

```bash
# Push de la branch
git push -u origin feature/TSK-XXX-description

# Crear PR en GitHub/GitLab
```

---

## Code Review Checklist

### Para el Autor

- [ ] Los tests pasan localmente
- [ ] El código compila sin errores
- [ ] No hay console.log o código debug
- [ ] Los archivos innecesarios no están incluidos
- [ ] La documentación está actualizada si es necesario

### Para el Revisor

- [ ] El código tiene sentido y es mantenible
- [ ] No hay código duplicado innecesario
- [ ] Los nombres son claros y descriptivos
- [ ] Los tests son adecuados y pasan
- [ ] No hay vulnerabilidades de seguridad
- [ ] El cambio es necesario y no overkill

---

## Recursos

### Comandos Útiles

```bash
# Ver historial
git log --oneline -10
git log --graph --oneline

# Deshacer cambios
git checkout -- archivo          # discard changes
git reset --soft HEAD~1          # undo commit
git revert HEAD                  # crear nuevo commit que deshace

# Gestión de branches
git branch -a                    # list all
git branch -d feature/xyz        # delete local
git push origin --delete feature/xyz  # delete remote

# Stash
git stash save "wip message"
git stash pop
git stash list
```

---

## Resumen

| Aspecto | Estrategia |
|---------|------------|
| **Estructura** | main + develop + feature/fix/refactor/docs |
| **Naming** | `{type}/{TSK-XXX}-{description}` |
| **Commits** | Conventional commits (feat, fix, refactor, etc.) |
| **PRs** | Plantilla, 1 approval, tests pasan |
| **Versiones** | Semantic versioning (MAJOR.MINOR.PATCH) |
| **Hooks** | Pre-commit (lint), pre-push (tests) |
| **Code Review** | Checklist para autor y revisor |

El objetivo es un repositorio donde **cualquier desarrollador puede entender el historial, contribuir sin miedo, y hacer releases con confianza**.