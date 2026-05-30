import type { Dict } from '../../types';

// FORMATO DE REFERENCIA — NAO entra no merge final (a fase 3 ignora arquivos _example.ts).
// Copie esta estrutura pro seu namespace real:
//   - nome do arquivo = seu namespace (ex: auth.ts)
//   - exporte `export const <ns>Messages: Dict` (ex: authMessages)
//   - chave plana namespaced: "<namespace>.<area>.<nome>" (ex: "auth.login.title")
//   - mesmas chaves nos 3 idiomas (paridade) e mesmos placeholders {x}
export const exampleMessages: Dict = {
  'example.hello': 'Ola',
  'example.greeting': 'Ola, {name}',
  'example.items': '{n} itens'
};
