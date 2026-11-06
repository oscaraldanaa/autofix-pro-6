# AutoFix Pro — Sistema de Gestión y Trazabilidad Operativa

Proyecto Integrador de Aprendizaje (PIA) · *Componentes de Lógica de Negocio* · FIME-UANL · Equipo 6

Plataforma para digitalizar el ciclo completo de una **Orden de Servicio** de un taller automotriz:
`Recibido → Diagnosticado → Cotizado → Autorizado → En reparación → Listo para entrega → Cerrado`,
con autorizaciones digitales auditables (RN-05, RN-10, RN-11), control de fechas prometidas (RN-06),
gestión de refacciones faltantes (RN-07) y atención de flotillas B2B (RN-09).

- **Repositorio:** `<URL del repositorio>`  ·  **Sistema desplegado:** `<URL del despliegue>`  ·  **Swagger UI:** `<URL>/docs`

## 1. Arquitectura

```
src/
├── domain/          Entidades, Value Objects, Aggregate Root OrdenServicio, Specification, State Machine, eventos
├── application/     Commands, Queries, Handlers, Application Services, Unit of Work (CQRS básico, ADR-002)
├── infrastructure/  Repositorios SQL, UnitOfWork SQL, base de datos (ADR-003)
└── api/             Capa de exposición REST (FastAPI)   ← Fase 4
tests/               unit/ + integration/
docs/                BRD.md, architecture/ (ADRs, diagramas), api/ (OpenAPI)
```

Dirección de dependencias: `api → application → domain ← infrastructure`. La API **no contiene reglas de negocio** (ADR-004):
solo valida formato (Pydantic), delega al puerto `OrdenServicePort` y traduce errores a HTTP:

| Situación | HTTP |
|---|---|
| Datos mal formados (p. ej. kilometraje negativo, cambio de fecha sin motivo) | **422** |
| Orden/vehículo inexistente | **404** |
| Regla de negocio o transición de estado violada (RN-xx) | **409** con `{"codigo","regla","detail"}` |

Archivos de `src/api/`: `main.py` (app + `/health`), `routers_ordenes.py` (endpoints), `schemas.py` (DTOs),
`ports.py` (contrato con la aplicación), `adapter.py` (**único punto de integración**), `dependencies.py`
(composition root), `errors.py`, `settings.py` (variables de entorno, 12-Factor).

### Integración con las capas de las Fases 1-3

`src/api/adapter.py` y `src/api/dependencies.py` asumen estos nombres; **ajústelos si su código difiere**
(son los únicos dos archivos que conocen el resto del sistema):

| Asumido | Dónde se usa |
|---|---|
| `src.domain.exceptions.DomainError` y `EntityNotFoundError` | traducción a 409 / 404 |
| `src.application.bootstrap.build_commands(session_factory)` y `build_queries(session_factory)` | construir fachadas de Commands y Queries con su `SqlUnitOfWork` |
| Métodos snake_case de Commands: `registrar_ingreso_vehiculo`, `registrar_diagnostico`, `generar_cotizacion`, `responder_cotizacion`, `asignar_trabajos`, `registrar_falla_adicional`, `modificar_fecha_entrega`, `marcar_listo_entrega`, `registrar_cobro` | `OrdenServiceAdapter` |
| Queries: `consultar_estado_orden`, `consultar_historial_vehiculo` | `OrdenServiceAdapter` |

## 2. Endpoints y trazabilidad

Base: `/api/v1` · Documentación interactiva: **`/docs`** (Swagger UI), **`/redoc`**, **`/openapi.json`**.

| Método y ruta | Caso de uso / US | Regla(s) | Transición |
|---|---|---|---|
| `POST /ordenes` | US-01, US-17 | RN-01, RN-09 | → Recibido |
| `GET /ordenes/{id}` | US-12 | RN-02 | — |
| `GET /vehiculos/{placas}/historial` | Query historial | — | — |
| `POST /ordenes/{id}/diagnostico` | US-02 | RN-01 | → Diagnosticado |
| `POST /ordenes/{id}/cotizacion` | US-03 | RN-05 | → Cotizado |
| `POST /ordenes/{id}/cotizacion/respuesta` | US-04 | RN-05, RN-10, RN-11 | → Autorizado |
| `POST /ordenes/{id}/asignacion` | US-05 | RN-04, RN-13 | → En reparación |
| `POST /ordenes/{id}/fallas-adicionales` | US-08 | RN-04 | pausa / ampliación |
| `PUT /ordenes/{id}/fecha-entrega` | US-11 | RN-06 | — |
| `POST /ordenes/{id}/listo-entrega` | US-14 | RN-01 | → Listo para entrega |
| `POST /ordenes/{id}/cobro` | US-15 | RN-01 | → Cerrado |

La IP de origen del cliente se captura en `cotizacion/respuesta` para el registro auditable (RN-11).

## 3. Instalación local (sin Docker)

Requisitos: Python 3.12+, PostgreSQL 16 (o usar solo Docker).

```bash
git clone <URL del repositorio> && cd <repo>
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                   # editar contraseña y DATABASE_URL (host=localhost)
uvicorn src.api.main:app --reload
```

Abrir http://localhost:8000/docs

## 4. Ejecución con Docker Compose

```bash
cp .env.example .env            # cambiar cambiar_esta_clave por una contraseña propia (en .env Y en DATABASE_URL)
docker compose up --build       # levanta db (PostgreSQL) + app
```

- API: http://localhost:8000 · Swagger: http://localhost:8000/docs · Salud: http://localhost:8000/health
- Detener: `docker compose down` · Borrar datos: `docker compose down -v`

Servicios: `db` (Postgres con healthcheck), `app` (espera a que `db` esté sano), `tests` (perfil `test`, no arranca con `up`).

## 5. Pruebas

```bash
# Local
pytest                                  # incluye cobertura; FALLA si < 80 %
pytest tests/unit                       # solo unitarias
pytest tests/integration                # solo integración HTTP
pytest --cov-report=html && open htmlcov/index.html

# En contenedor dedicado
docker compose run --rm tests
```

Estructura: `tests/unit` (esquemas, errores, adaptador, configuración, y las del dominio de las Fases 1-3) y
`tests/integration` (flujo HTTP completo del BPMN con un doble en memoria del puerto, errores 404/409/422, OpenAPI).
Agregue aquí las pruebas de dominio (Specification, State Machine, invariantes de `OrdenServicio`) para sostener el 80 %.

## 6. CI/CD (`.github/workflows/ci.yml`)

1. **test**: `ruff` + `pytest` (bloquea si cobertura < 80 %), publica `coverage.xml`.
2. **docker**: construye imágenes, levanta `app`+`db`, verifica `/health` y `/docs`, corre el contenedor `tests`.
3. **deploy** (solo `main`): llama al *Deploy Hook* de Render si existe el secret `RENDER_DEPLOY_HOOK`.

## 7. Despliegue (Render, alternativa Railway/Fly.io)

1. Crear **PostgreSQL** gestionado y copiar su *Internal Database URL* (con prefijo `postgresql+psycopg://`).
2. Crear **Web Service** desde el repo, entorno *Docker*, *target* `app`. Render inyecta `$PORT` (ya soportado).
3. Variables de entorno: `DATABASE_URL`, `ENVIRONMENT=production`. Health check path: `/health`.
4. Copiar el *Deploy Hook* a GitHub → *Settings → Secrets* → `RENDER_DEPLOY_HOOK`.
5. Verificar `https://<servicio>.onrender.com/docs` y poner la URL en este README.

## 8. Guion para la demo en vivo (≈ 8 min)

Abrir `/docs` y ejecutar con *Try it out* (o `curl`). Reemplace `{ID}` por el `id` devuelto.

1. **Salud**: `GET /health` → `ok`.
2. **US-01 Ingreso**: `POST /ordenes` → 201, estado `Recibido`. *Mostrar 422* repitiendo con `kilometraje: -5` (RN-01).
3. **US-02 Diagnóstico** → `Diagnosticado`. **US-03 Cotización** (mano de obra + refacciones) → `Cotizado`.
4. **Regla RN-13**: intentar `POST /ordenes/{ID}/asignacion` *antes* de autorizar → **409** `regla: RN-13`.
5. **US-04 Autorización parcial**: `cotizacion/respuesta` autorizando un concepto y rechazando otro →
   `Autorizado`, total recalculado; remarcar que se guarda timestamp + IP (RN-11).
6. **US-05 Asignación** → `En reparación`. **US-08 Falla adicional** → solicitud de ampliación (RN-04).
7. **US-11 Fecha**: `PUT fecha-entrega` con motivo; sin motivo → 422 (RN-06).
8. **Cierre**: `listo-entrega` → `cobro` → `Cerrado`; intentar `cobro` otra vez → **409** (máquina de estados).
9. **US-12 / Historial**: `GET /ordenes/{ID}` y `GET /vehiculos/{placas}/historial`.
10. Mostrar el pipeline verde en GitHub Actions y `docker compose run --rm tests` con cobertura ≥ 80 %.

```bash
curl -X POST http://localhost:8000/api/v1/ordenes -H "Content-Type: application/json" -d '{
  "cliente_id":"<uuid-de-cliente>","placas":"ABC-1234","modelo":"Nissan Versa 2020","kilometraje":45200,
  "nivel_combustible":"1/2","danos_visibles":["Rayón puerta derecha"],"motivo_ingreso":"Ruido en frenos"}'
```

## 9. Preguntas de defensa frecuentes

- **¿Por qué la API no tiene `if`s de negocio?** ADR-004: las reglas viven en `OrdenServicio` y Domain Services; la API valida formato y traduce errores.
- **¿Dónde está CQRS?** ADR-002: `GET` → Queries con DTO de lectura; `POST/PUT` → Commands vía Handler + Unit of Work.
- **¿Cómo se prueba sin base de datos?** Puerto `OrdenServicePort` + `dependency_overrides` (Dependency Inversion, SOLID).
- **12-Factor**: configuración solo por variables de entorno (`.env.example` sin secretos), logs a stdout, procesos sin estado.

## 10. Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena SQLAlchemy | `postgresql+psycopg://user:pass@db:5432/autofix` |
| `POSTGRES_USER/PASSWORD/DB` | Credenciales del contenedor `db` | `autofix` |
| `ENVIRONMENT` | `development` / `production` | `development` |
| `APP_PORT` | Puerto publicado en local | `8000` |
