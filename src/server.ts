import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

/**
 * Crea una instancia del servidor y registra sus capacidades MCP.
 *
 * Mantener esta logica separada del transporte facilita reutilizarla despues
 * con Streamable HTTP o en tests sin cambiar tools, resources ni prompts.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "simple-mcp-basics",
      version: "1.0.0",
    },
    {
      instructions:
        "Servidor didactico. Usa sumar para calculos, lee info://app para conocer la aplicacion y usa explicar-concepto para iniciar una explicacion.",
    },
  );

  // TOOL: representa una accion que un modelo puede decidir ejecutar.
  // Zod sirve a la vez para validar el input y generar el JSON Schema que ve el cliente.
  server.registerTool(
    "sumar",
    {
      title: "Sumar dos numeros",
      description: "Suma dos numeros y devuelve el resultado.",
      inputSchema: z.object({
        a: z.number().describe("Primer sumando"),
        b: z.number().describe("Segundo sumando"),
      }),
    },
    async ({ a, b }) => ({
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${a + b}`,
        },
      ],
    }),
  );

  // RESOURCE: representa datos de solo lectura identificados por una URI.
  // En un sistema real podria leer configuracion, documentacion o datos de una DB.
  server.registerResource(
    "informacion-aplicacion",
    "info://app",
    {
      title: "Informacion de la aplicacion",
      description: "Metadatos de ejemplo expuestos como un resource MCP.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              application: "simple-mcp-basics",
              purpose: "Entender tools, resources y prompts de MCP",
              environment: "demo",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  // PROMPT: es una plantilla reutilizable que el usuario/cliente elige.
  // No ejecuta un modelo; solo devuelve los mensajes que un host podria enviarle.
  server.registerPrompt(
    "explicar-concepto",
    {
      title: "Explicar un concepto",
      description: "Genera un mensaje para pedir una explicacion didactica.",
      argsSchema: z.object({
        concepto: z.string().min(1).describe("Concepto que se desea explicar"),
        nivel: z
          .enum(["principiante", "intermedio"])
          .default("principiante")
          .describe("Nivel de profundidad"),
      }),
    },
    ({ concepto, nivel }) => ({
      description: `Explicacion de ${concepto} para nivel ${nivel}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explica el concepto \"${concepto}\" para una persona de nivel ${nivel}. Incluye un ejemplo breve.`,
          },
        },
      ],
    }),
  );

  return server;
}

// stdio reserva stdin/stdout para mensajes JSON-RPC de MCP.
// Por eso los logs del servidor SIEMPRE deben ir a stderr con console.error.
console.error("[server] MCP listo; esperando un cliente por stdio...");
void serveStdio(createServer);
