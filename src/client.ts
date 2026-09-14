import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

// Resolvemos server.ts desde este mismo modulo para que el ejemplo funcione
// aunque npm run demo se invoque desde otro directorio.
const serverPath = fileURLToPath(new URL("./server.ts", import.meta.url));

const client = new Client({
  name: "simple-mcp-demo-client",
  version: "1.0.0",
});

// El transporte stdio crea y administra el proceso hijo del servidor.
// process.execPath es el ejecutable Node actual; --import tsx permite ejecutar TS.
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "tsx", serverPath],
});

try {
  console.log("1. Conectando: el cliente inicia el server y negocia capacidades...");
  await client.connect(transport);
  console.log("   Conexion MCP establecida.\n");

  console.log("2. TOOLS - descubrir y ejecutar una accion");
  const { tools } = await client.listTools();
  for (const tool of tools) {
    console.log(`   - ${tool.name}: ${tool.description}`);
  }
  const toolResult = await client.callTool({
    name: "sumar",
    arguments: { a: 7, b: 5 },
  });
  console.log("   callTool(sumar, { a: 7, b: 5 }) =>");
  console.dir(toolResult.content, { depth: null });

  console.log("\n3. RESOURCES - descubrir y leer datos por URI");
  const { resources } = await client.listResources();
  for (const resource of resources) {
    console.log(`   - ${resource.name}: ${resource.uri}`);
  }
  const resourceResult = await client.readResource({ uri: "info://app" });
  console.log("   readResource(info://app) =>");
  console.dir(resourceResult.contents, { depth: null });

  console.log("\n4. PROMPTS - descubrir y obtener una plantilla de mensajes");
  const { prompts } = await client.listPrompts();
  for (const prompt of prompts) {
    console.log(`   - ${prompt.name}: ${prompt.description}`);
  }
  const promptResult = await client.getPrompt({
    name: "explicar-concepto",
    arguments: { concepto: "MCP", nivel: "principiante" },
  });
  console.log("   getPrompt(explicar-concepto, ...) =>");
  console.dir(promptResult.messages, { depth: null });

  console.log("\nDemo finalizada correctamente.");
} catch (error) {
  console.error("La demo fallo:", error);
  process.exitCode = 1;
} finally {
  // Cierra la conexion y termina de forma ordenada el proceso hijo.
  await client.close();
}
