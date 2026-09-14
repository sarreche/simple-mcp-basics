# MCP básico con TypeScript

Ejemplo pequeño pero completo de [Model Context Protocol (MCP)](https://modelcontextprotocol.io/): un servidor local, un cliente y una demostración ejecutable de las tres primitivas principales del servidor.

- **Tools**: acciones que un modelo puede decidir invocar.
- **Resources**: datos de solo lectura que una aplicación cliente obtiene por URI.
- **Prompts**: plantillas de mensajes que el usuario o cliente puede seleccionar.

El proyecto evita deliberadamente bases de datos, frameworks web, autenticación y llamadas a un LLM. El objetivo es que se vea el protocolo sin ruido adicional y que el código pueda servir como punto de partida.

## Requisitos

- Node.js 20 o posterior
- npm

## Ejecutar la demo

```bash
npm install
npm run demo
```

No hay que iniciar el servidor aparte. El cliente lo lanza como subproceso, se conecta por `stdio`, hace el handshake MCP y lo cierra al terminar.

La salida incluye, en este orden:

1. Descubrimiento de `sumar` mediante `listTools()` y ejecución con `callTool()`.
2. Descubrimiento de `info://app` mediante `listResources()` y lectura con `readResource()`.
3. Descubrimiento de `explicar-concepto` mediante `listPrompts()` y renderizado con `getPrompt()`.

También se puede comprobar el tipado y generar JavaScript:

```bash
npm run check
npm run build
```

## Mapa del proyecto

```text
src/
├── server.ts  # declara tools, resources y prompts; atiende por stdio
└── client.ts  # inicia el server, descubre capacidades y las consume
```

## Qué ocurre al ejecutar el cliente

```text
npm run demo
     │
     ▼
Client + StdioClientTransport
     │  crea el proceso y usa stdin/stdout
     ▼
McpServer + transporte stdio
     │
     ├── tools/list      ──► definición y JSON Schema de `sumar`
     ├── tools/call      ──► ejecuta `sumar`
     ├── resources/list  ──► metadatos de `info://app`
     ├── resources/read  ──► contenido del resource
     ├── prompts/list    ──► metadatos de `explicar-concepto`
     └── prompts/get     ──► mensajes de la plantilla
```

`client.connect(transport)` realiza primero el handshake `initialize`: cliente y servidor intercambian versión, identidad y capacidades. Después, el SDK presenta métodos TypeScript de alto nivel; por debajo viajan mensajes JSON-RPC de MCP.

### Tool

`sumar` ilustra una operación. Su esquema Zod tiene tres trabajos: documenta los argumentos, genera el JSON Schema que descubre el cliente y valida el input antes de ejecutar el handler.

En un sistema real, un tool podría consultar una API, crear un ticket o ejecutar una operación de negocio. Debe tener un nombre estable, una descripción precisa y un esquema estricto.

### Resource

`info://app` ilustra información direccionable y de solo lectura. La lista contiene metadatos; el contenido se obtiene en una llamada separada usando la URI.

En un sistema real, un resource podría representar documentación, configuración, el esquema de una base de datos o un registro. Para colecciones variables, el SDK también ofrece `ResourceTemplate` con URIs como `customer://{id}`.

### Prompt

`explicar-concepto` recibe argumentos y produce mensajes. No llama por sí mismo a un LLM: un host con un modelo podría tomar esos mensajes y enviárselos.

En un sistema real, un prompt puede estandarizar flujos como “analizar incidente”, “resumir cliente” o “preparar revisión”. A diferencia de un tool, normalmente lo selecciona explícitamente el usuario o la aplicación.

## Responsabilidades: host, cliente y servidor

- El **servidor MCP** publica capacidades y ejecuta sus handlers.
- El **cliente MCP** mantiene una conexión y traduce operaciones del protocolo a métodos como `listTools()`.
- El **host** es la aplicación completa (un IDE o asistente, por ejemplo). Puede contener el cliente, mostrar resources/prompts y permitir que un modelo elija tools.

Este repositorio implementa servidor y cliente, pero no un host con LLM. Por eso la demo llama `sumar` directamente: hace visible el mecanismo MCP sin depender de una API de IA.

## Cómo extender este template

1. Mantener `createServer()` independiente del transporte.
2. Registrar cada capacidad con un nombre, una descripción y schemas claros.
3. Mover integraciones reales a módulos de dominio; los handlers MCP deberían ser adaptadores pequeños.
4. Añadir manejo de errores esperado con resultados que incluyan `isError: true`.
5. Añadir tests del servidor con un transporte en memoria antes de introducir HTTP.
6. Usar Streamable HTTP cuando el servidor deje de ser un proceso local y deba atender conexiones remotas; ahí también habrá que diseñar autenticación, sesiones y despliegue.

## Regla importante de `stdio`

`stdout` es el canal del protocolo. Cualquier `console.log()` en el servidor puede corromper los mensajes JSON-RPC. Los logs del servidor deben enviarse a `stderr` con `console.error()`. El cliente sí puede imprimir normalmente su propia salida.

## Referencias oficiales

- [SDK oficial de TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Guía para construir servidores](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)
- [Guía para construir clientes](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/client.md)
- [Especificación MCP](https://modelcontextprotocol.io/specification/latest)
