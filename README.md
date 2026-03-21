# LavaSuite Desktop · Fase 1

Aplicación de escritorio para lavandería y sastrería construida con Electron, React, TypeScript, Node.js y MySQL.

## Arquitectura inicial

```text
src/
  backend/
    db/
      connection.ts
      schema.ts
      migrator.ts
      migrations/
    modules/
      auth/
      clients/
      orders/
      settings/
  main/
    main.ts
    preload.ts
    ipc/
    services/
  renderer/
    modules/
      auth/
      clients/
      dashboard/
      orders/
      shared/
    hooks/
    services/
    ui/
      components/
      layouts/
    utils/
    styles/
  shared/
    types.ts
```

## MVP funcional incluido en esta fase

- configuración inicial de conexión MySQL por instalación
- login funcional con auditoría en `audit_logs`
- layout principal con sidebar, topbar y navegación
- dashboard base
- CRUD real de clientes
- órdenes reales con múltiples ítems
- cálculo de subtotal, descuento, total y saldo
- detalle de orden
- consecutivo automático usando `counters`
- migración inicial con tablas esenciales de Fase 1

## Cómo correr

1. Instala dependencias.
2. Ejecuta `npm run dev`.
3. Configura la conexión MySQL desde la primera pantalla.
4. Ingresa con `admin / admin`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
