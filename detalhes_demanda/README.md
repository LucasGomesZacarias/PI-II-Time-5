# Tela de detalhes da demanda

Execute o projeto a partir da raiz do repositório com um servidor HTTP estático, por exemplo:

```bash
python3 -m http.server 8765
```

Abra `/ListagemDemandas/ListagemDemandas.html`. A listagem carrega três demandas de demonstração e abre a tela oficial em `/detalhes_demanda/detalhesDemandas.html?id=1041` (ou outro ID da lista). O link **Editar** abre o formulário da mesma demanda. Título e descrição são obrigatórios; responsável e prazo podem ficar vazios. **Descartar edição** fecha o formulário sem salvar. O histórico registra alterações salvas.

A listagem e os detalhes compartilham os dados de `componentes/demandasExemplo.js`. As edições ficam no `localStorage` do navegador usado no teste. Este módulo é temporário: ainda não existe API ou banco de dados neste repositório. Autenticação, permissões, cancelamento lógico e validação de prazo contra feriados dependem da integração com o backend prevista no escopo do PI.
