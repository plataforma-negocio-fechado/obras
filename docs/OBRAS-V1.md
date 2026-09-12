# Negócio Fechado · Obras V1

## 1. Princípio

O produto é uma plataforma de informação operacional da obra. WhatsApp é apenas um canal de entrada. O núcleo é:

**Conta → Contexto → Permissão → Obra → Evento → Evidência → Histórico → Gestão**

A unidade central do sistema é o **Evento da Obra**, não a mensagem nem o formulário.

## 2. Entrada do usuário

1. Abrir o aplicativo/PWA.
2. Acessar o Acesso Central.
3. Entrar ou criar conta.
4. Escolher contexto: Autônomo ou Empresa.
5. Escolher plano correspondente.
6. Em Empresa, definir função de acesso: Gestor, Engenheiro ou Encarregado.
7. Entrar no Acesso Central.

Nesta V1, a seleção de plano é funcional como configuração de ambiente; cobrança e assinatura real ficam para uma etapa posterior.

## 3. Contextos

### Autônomo
- Perfil profissional
- Obras
- Campo
- Gestão operacional
- Evidências

### Empresa
- Empresa
- Usuários
- Obras
- Campo
- Gestão operacional
- Evidências
- Indicadores, conforme permissão

## 4. Permissões

### Gestor
- Visualiza todas as obras da empresa.
- Entra individualmente em qualquer obra.
- Acessa gestão de usuários e permissões.
- Visualiza indicadores e gestão consolidada.

### Engenheiro
- Visualiza as obras atribuídas.
- Acessa o dashboard operacional das obras.
- Registra e edita informações.
- Usa Campo.
- Consulta produção, custos, materiais, máquinas, equipe, ocorrências, ações, diário e evidências.

### Encarregado
- Acessa Campo das obras atribuídas.
- Envia texto, áudio, foto e documento.
- Participa do registro operacional sem precisar navegar pelo ERP completo.

## 5. Navegação

O Acesso Central é a entrada do produto. Os módulos não são aplicativos separados.

Dentro de uma obra, o dashboard é operacional e deve permitir registro direto.

Ações principais:
- + Registrar
- Produção
- Material
- Custo
- Máquina
- Equipe
- Ocorrência
- Ação
- Diário
- Campo
- Evidência

## 6. Evento

Fluxo direto:

**Entrada → interpretação → proposta → confirmação → evento**

Toda informação estruturada deve manter contexto suficiente para responder:
- o que aconteceu;
- quando aconteceu;
- em qual obra;
- quem registrou;
- qual foi a origem;
- quais evidências sustentam o registro;
- quem confirmou ou editou.

## 7. Campo

O Campo aceita:
- texto;
- áudio;
- foto;
- documento.

A IA pode interpretar entradas não estruturadas e propor eventos. A IA não deve registrar silenciosamente fatos críticos. A confirmação humana preserva rastreabilidade.

## 8. Dashboard da obra

O dashboard deve responder primeiro: **O que está acontecendo na obra?**

Deve apresentar, conforme os dados disponíveis:
- produção;
- materiais;
- máquinas;
- custos;
- ocorrências;
- ações/pedências;
- evidências;
- atividade recente.

## 9. MVP por sprints

### Sprint 1 — núcleo
- Acesso Central
- Contexto de uso
- Plano
- Função/permissão visual
- Lista de obras
- Obra individual
- Evento
- Evidência
- Histórico

### Sprint 2 — Campo
- texto
- áudio
- foto
- documento
- interpretação local
- revisão
- confirmação

### Sprint 3 — domínios
- Produção
- Materiais
- Custos
- Máquinas

### Sprint 4 — gestão
- Equipe
- Ocorrências
- Ações
- Diário
- Indicadores

### Sprint 5 — canais
- WhatsApp
- n8n
- Evolution

WhatsApp fica por último. O produto precisa fazer sentido sem depender dele.

## 10. Regra de implementação

Não reconstruir tudo de uma vez. Cada sprint deve entregar uma fatia vertical funcional e testável. O código existente pode ser reaproveitado quando representar corretamente o conceito V1; o backup `backup/obras-v0-2026-09-12` preserva o estado anterior.
