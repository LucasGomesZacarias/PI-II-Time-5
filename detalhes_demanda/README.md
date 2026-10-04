# Tela de detalhes da demanda

Execute o projeto a partir da raiz do repositório com um servidor HTTP estático, por exemplo:

```bash
python3 -m http.server 8765
```

Na listagem existente, clique em **Mostrar Demandas ficticias** e abra os detalhes de uma demanda. Os links já existentes levam à tela oficial em `/detalhes_demanda/detalhesDemandas.html?id=1041` ou `?id=1045`. O botão **Editar demanda**, dentro dos detalhes, abre o formulário. Título e descrição são obrigatórios; responsável e prazo podem ficar vazios. **Descartar edição** fecha o formulário sem salvar. O histórico registra alterações salvas.

Os dados de demonstração desta tela estão em `detalhes_demanda/demandasExemplo.js`. As edições ficam no `localStorage` do navegador usado no teste e não atualizam a listagem existente. Este módulo é temporário: ainda não existe API ou banco de dados neste repositório. Autenticação, permissões, cancelamento lógico e validação de prazo contra feriados dependem da integração com o backend prevista no escopo do PI.
