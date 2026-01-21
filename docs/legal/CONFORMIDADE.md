# Conformidade Legal - Sistema KAMBA Many

## Legislação Aplicável

### Decreto Executivo n.º 74/19, de 6 de Março
**Regras e Requisitos para Validação de Sistemas de Processamento Eletrónico de Faturação**

#### Requisitos Implementados

✅ **Software de Faturação**
- Sistema preparado para certificação pela AGT (Administração Geral Tributária)
- Capacidade de gerar ficheiros SAF-T (Standard Audit File for Tax) formato Angola
- Transmissão de dados em tempo real quando online

✅ **Formato Digital Estruturado**
-- Facturas emitidas em formato digital estruturado
- Assinatura eletrónica (hash SHA-256)
- Validação automática de documentos
- Arquivo digital seguro e inalterável

✅ **Validação e Comunicação**
- Sistema de validação interna antes de emissão
- Comunicação preparada para integração com AGT
- Arquivo de cópias digitais com acesso para auditorias

---

### Decreto Presidencial n.º 71/25, de 20 de Março de 2025
**Regime Jurídico das Facturas - Faturação Eletrónica**

#### Conformidade Implementada

✅ **Obrigatoriedade**
- Sistema suporta emissão de facturas eletrónicas
- Aplicável a contribuintes dos regimes Geral e Simplificado
- Contribuintes no Regime de Exclusão podem aderir voluntariamente

✅ **Definição de Factura Eletrónica**
- Documento emitido por meios digitais
- Software autorizado (preparado para validação AGT)
- Cumprimento de requisitos técnicos e legais
- Geração de ficheiros SAF-T
- Transmissão preparada para tempo real

✅ **Fases de Implementação**
O sistema está preparado para:
- **1 Janeiro 2026**: Grandes Contribuintes e fornecedores do Estado
- **1 Janeiro 2027**: Todos os contribuintes Geral e Simplificado

✅ **Valor Limite**
- Transações > 25.000.000 Kz requerem factura eletrónica
- Sistema valida e força emissão eletrónica automaticamente

✅ **Prazo de Emissão**
- Facturas emitidas até 5 dias após facto tributário
- Ou até 1 mês em operações contínuas
- Sistema alerta para prazos

---

## Requisitos dos Documentos Fiscais

### Elementos Obrigatórios

Todos os documentos fiscais DEVEM conter:

1. **Identificação do Emitente**
   - Nome ou denominação social
   - NIF (Número de Identificação Fiscal)
   - Endereço da sede ou estabelecimento
   - Telefone e email

2. **Identificação do Adquirente**
   - Nome ou denominação social
   - NIF (obrigatório para valores > 10.000 Kz)
   - Endereço (quando disponível)

3. **Numeração**
   - Série e número sequencial único
   - Não pode haver quebras na sequência
   - Números crescentes
   - Por série e tipo de documento

4. **Datas**
   - Data de emissão (data e hora)
   - Data de vencimento (se aplicável)
   - Data de facto tributário

5. **Descrição**
   - Designação dos produtos/serviços
   - Quantidade
   - Preço unitário
   - Descontos (se aplicável)
   - Taxa de IVA aplicável
   - Valor de IVA
   - Total por linha

6. **Totais**
   - Subtotal (base tributável)
   - IVA discriminado por taxa
   - Total do documento
   - Total extenso (por escrito)

7. **Informações Fiscais**
   - **Hash**: Assinatura digital do documento anterior
   - **ATCUD**: Código Único do Documento
   - **QR Code**: Para validação rápida
   - Código de validação AGT (após submissão)

8. **Regime de IVA**
   - Identificação do regime: Geral, Simplificado ou Exclusão
   - Taxa aplicável: 14% (taxa normal em Angola)
   - Taxas especiais quando aplicável

---

## Tipos de Documentos

### Documentos NÃO Fiscais

#### Factura Proforma
- **Finalidade**: Orçamento sem valor fiscal
- **Menção Obrigatória**: "FACTURA PROFORMA – SEM VALOR FISCAL"
- **Numeração**: Série própria separada
- **Conversão**: Pode ser convertida em factura fiscal
- **IVA**: Não gera obrigação de IVA

### Documentos Fiscais

#### 1. Factura (FT)
- Documento fiscal padrão
- Emitida em operações de venda de bens/serviços
- Pode ou não incluir recibo de pagamento

#### 2. Factura-Recibo (FR)
- Factura com comprovativo de pagamento
- Emitida quando pagamento é simultâneo à emissão
- Dispensa emissão de recibo separado

#### 3. Factura Simplificada (FS)
- Para operações de valor reduzido
- Dados simplificados do cliente
- Limite: definido pela AGT

#### 4. Nota de Crédito (NC)
- Corrige facturas por valores a menor
- Anula total ou parcialmente factura anterior
- Deve referenciar documento original
- Motivo da emissão obrigatório

#### 5. Nota de Débito (ND)
- Corrige facturas por valores a maior
- Acrescenta valores não faturados
- Deve referenciar documento original
- Motivo da emissão obrigatório

---

## Sistema de Numeração

### Regras de Numeração

```
Formato: [SÉRIE][ANO]/[SEQUÊNCIA]
Exemplo: FT2025/00001

Onde:
- SÉRIE: Identificador da série (FT, FR, FS, NC, ND, PRO)
- ANO: Ano de emissão
- SEQUÊNCIA: Número sequencial (sem quebras)
```

### Séries Implementadas

- **FT**: Factura
- **FR**: Factura-Recibo
- **FS**: Factura Simplificada
- **NC**: Nota de Crédito
- **ND**: Nota de Débito
- **PRO**: Factura Proforma (não fiscal)

### Integridade da Numeração

✅ O sistema garante:
1. Sequência contínua e crescente
2. Sem duplicações
3. Sem quebras na sequência
4. Uma série por tipo de documento
5. Persistência mesmo offline

---

## Hash e Assinatura Digital

### Algoritmo Implementado

```
Hash = SHA-256(
  Data emissão +
  Número documento +
  NIF emitente +
  NIF adquirente +
  Total documento +
  Hash documento anterior
)
```

### Características

- **Primeiro documento**: Hash inicial baseado em chave do sistema
- **Documentos subsequentes**: Encadeamento com hash do anterior
- **Imutabilidade**: Qualquer alteração invalida o hash
- **Validação**: Sistema valida cadeia completa

---

## ATCUD - Código Único do Documento

### Formato

```
ATCUD: [CÓDIGO VALIDAÇÃO AGT]-[SEQUÊNCIA]
Exemplo: ABCD1234-00001
```

### Obtenção

1. **Desenvolvimento**: Código temporário gerado pelo sistema
2. **Produção**: Obtido através do portal da AGT após validação

---

## Ficheiros SAF-T (Angola)

### Standard Audit File for Tax

O sistema gera ficheiros SAF-T conforme especificações da AGT de Angola:

#### Estrutura
```xml
<?xml version="1.0" encoding="UTF-8"?>
<AuditFile>
  <Header>...</Header>
  <MasterFiles>...</MasterFiles>
  <SourceDocuments>...</SourceDocuments>
</AuditFile>
```

#### Conteúdo

1. **Header**: Informações da empresa e período
2. **MasterFiles**: 
   - Clientes
   - Fornecedores
   - Produtos
   - Impostos
3. **SourceDocuments**:
   - Vendas (SalesInvoices)
   - Movimentos de stock
   - Pagamentos

#### Geração

- Gerado por período (mensal, anual)
- Formato XML conforme XSD da AGT
- Compressão GZIP para transmissão
- Validação antes de submissão

---

## Retenção e Arquivo de Dados

### Período de Retenção

**10 ANOS MÍNIMO** conforme Código Geral Tributário

### Dados Arquivados

✅ O sistema armazena permanentemente:
1. Todos os documentos fiscais emitidos
2. Logs de auditoria
3. Ficheiros SAF-T gerados
4. Comprovantes de submissão à AGT
5. Dados de vendedores e clientes

### Segurança do Arquivo

- Documentos imutáveis após emissão
- Backup automático quando online
- Criptografia de dados sensíveis
- Proteção contra eliminação acidental
- Logs de acesso para auditoria

---

## IVA (Imposto sobre o Valor Acrescentado)

### Taxas Aplicáveis em Angola

#### Taxa Normal: 14%
- Aplicável à maioria dos bens e serviços

#### Taxa Reduzida ou Isenção
- Produtos básicos essenciais
- Serviços específicos definidos por lei

### Cálculo de IVA

```
Base Tributável = Preço sem IVA
IVA = Base Tributável × (Taxa / 100)
Total = Base Tributável + IVA

Exemplo (taxa 14%):
Base: 1.000,00 Kz
IVA:    140,00 Kz (1.000 × 0,14)
Total: 1.140,00 Kz
```

### Discriminação Obrigatória

Todas as facturas DEVEM mostrar:
- Base tributável por taxa de IVA
- Montante de IVA por taxa
- Total geral

---

## Certificação e Validação AGT

### Processo de Certificação

Para uso em produção, o software deve:

1. **Submeter à AGT**
   - Documentação técnica
   - Código fonte (para análise)
   - Casos de teste

2. **Testes AGT**
   - Validação de numeração
   - Integridade de hash
   - Formato SAF-T
   - Comunicação em tempo real

3. **Aprovação**
   - Certificado de conformidade
   - Código de validação
   - Autorização para uso

### Integração Portal AGT

**Funcionalidades a Implementar para Produção:**

1. **Comunicação em Tempo Real**
   - Endpoint da AGT
   - Credenciais de acesso
   - Protocolo de comunicação

2. **Submissão de Documentos**
   - Envio de cada factura emitida
   - Recepção de código de validação
   - Atualização de status

3. **Ficheiros SAF-T**
   - Upload periódico
   - Validação remota
   - Confirmação de recepção

---

## Checklist de Conformidade

### ✅ Implementado

- [x] Numeração sequencial única
- [x] Tipos de documentos (Factura, FR, FS, NC, ND, Proforma)
- [x] Hash SHA-256 encadeado
- [x] ATCUD (código temporário)
- [x] Dados obrigatórios (NIF, datas, totais)
- [x] Cálculo automático de IVA (14%)
- [x] Imutabilidade de documentos
- [x] Armazenamento local (10+ anos)
- [x] Logs de auditoria
- [x] Distinção fiscal/não fiscal
- [x] Geração SAF-T (estrutura base)

### 🔄 Pendente para Produção

- [ ] Certificação oficial AGT
- [ ] Integração tempo real com portal AGT
- [ ] ATCUD oficial (obtido da AGT)
- [ ] Testes de certificação
- [ ] Validação SAF-T com AGT
- [ ] Protocolo de comunicação oficial

---

## Penalidades por Não Conformidade

### Infrações e Multas

Conforme legislação fiscal angolana:

- **Falta de Faturação**: Multa de 500.000 a 5.000.000 Kz
- **Numeração Irregular**: Multa de 200.000 a 2.000.000 Kz
- **Não Submissão à AGT**: Multa e suspensão de atividade
- **Faturação Incorreta**: Multa proporcional ao valor

### Prevenção

O sistema PREVINE:
- Emissão sem facturas
- Quebras de numeração
- Documentos sem dados obrigatórios
- Falta de discriminação de IVA
- Eliminação de documentos fiscais

---

## Recomendações

### Para Utilizadores

1. **Mantenha Backups**: Exportar base de dados regularmente
2. **Verifique Conexão**: Sincronizar com servidor quando online
3. **Atualize Dados**: NIF e dados da empresa atualizados
4. **Confira Totais**: Validar cálculos antes de emitir
5. **Arquive Documentos**: Não eliminar documentos fiscais

### Para Produção

1. **Obter Certificação AGT**
2. **Configurar Integração Oficial**
3. **Testar Extensivamente**
4. **Formar Utilizadores**
5. **Estabelecer Backups Remotos**

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Responsável**: Sistema KAMBA Many
