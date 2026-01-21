-- ============================================
-- Sistema KAMBA Many - Seed Data
-- SuperAdmin e Dados Iniciais
-- ============================================

-- Inserir Organização Default para SuperAdmin
INSERT INTO organizations (id, name, nif, fiscal_regime, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'KAMBA Many - Administração',
    '9999999999',
    'GERAL',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Inserir SuperAdmin
-- Email: ildocuema@gmail.com
-- Password: Ildo7..Marques
-- Hash gerado com bcrypt (12 rounds)
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    full_name,
    role,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ildocuema@gmail.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWIvJ3Hu', -- Ildo7..Marques
    'Ildo Cuema - SuperAdmin',
    'SUPERADMIN',
    true
)
ON CONFLICT (email) DO UPDATE
SET 
    role = 'SUPERADMIN',
    is_active = true;

-- Inserir Assinatura Permanente para SuperAdmin
INSERT INTO subscriptions (
    id,
    organization_id,
    plan_type,
    status,
    start_date,
    end_date,
    amount,
    payment_status
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ANUAL',
    'ACTIVE',
    '2025-01-01',
    '2099-12-31', -- Assinatura "permanente"
    0.00,
    'PAID'
)
ON CONFLICT (id) DO UPDATE
SET 
    status = 'ACTIVE',
    end_date = '2099-12-31';

-- Inserir Categorias de Exemplo
INSERT INTO categories (id, organization_id, name, description)
VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Bebidas', 'Bebidas diversas'),
    ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Alimentação', 'Produtos alimentícios'),
    ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Higiene', 'Produtos de higiene pessoal'),
    ('10000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Limpeza', 'Produtos de limpeza')
ON CONFLICT DO NOTHING;

-- Inserir Produtos de Exemplo
INSERT INTO products (id, organization_id, category_id, code, barcode, name, description, unit_price, cost_price, tax_rate, current_stock, min_stock)
VALUES
    ('20000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'BEB001', '5600000000001', 'Água Mineral 1.5L', 'Água mineral natural', 150.00, 80.00, 14.0, 100, 20),
    ('20000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'BEB002', '5600000000002', 'Refrigerante Cola 2L', 'Refrigerante sabor cola', 350.00, 200.00, 14.0, 80, 15),
    ('20000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'ALI001', '5600000000003', 'Arroz Branco 1Kg', 'Arroz branco tipo 1', 450.00, 300.00, 14.0, 150, 30),
    ('20000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'ALI002', '5600000000004', 'Óleo Alimentar 1L', 'Óleo vegetal refinado', 850.00, 600.00, 14.0, 60, 10),
    ('20000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'HIG001', '5600000000005', 'Sabonete 90g', 'Sabonete em barra', 200.00, 120.00, 14.0, 200, 40),
    ('20000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, 'LIM001', '5600000000006', 'Detergente Líquido 500ml', 'Detergente para louça', 320.00, 180.00, 14.0, 120, 25)
ON CONFLICT (barcode) DO NOTHING;

-- Inserir Configurações do Sistema
INSERT INTO system_settings (organization_id, setting_key, setting_value, setting_type, description)
VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'invoice_serie_default', 'FT2025', 'STRING', 'Série padrão de facturas'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'next_invoice_number', '1', 'NUMBER', 'Próximo número de factura'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'default_tax_rate', '14', 'NUMBER', 'Taxa de IVA padrão (%)'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'company_name', 'Empresa Demonstração', 'STRING', 'Nome da empresa nas facturas'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'company_address', 'Luanda, Angola', 'STRING', 'Endereço da empresa'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'company_phone', '+244 900 000 000', 'STRING', 'Telefone da empresa'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'thermal_printer_enabled', 'true', 'BOOLEAN', 'Impressora térmica habilitada'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'barcode_scanner_enabled', 'true', 'BOOLEAN', 'Scanner de código de barras habilitado')
ON CONFLICT (organization_id, setting_key) DO NOTHING;

-- Log de auditoria da criação do SuperAdmin
INSERT INTO audit_logs (
    organization_id,
    user_id,
    entity_type,
    entity_id,
    action,
    new_values
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'USER',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'CREATE',
    '{"role": "SUPERADMIN", "email": "ildocuema@gmail.com", "full_name": "Ildo Cuema - SuperAdmin"}'::jsonb
);

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '✓ Seed concluída com sucesso!';
    RAISE NOTICE '  SuperAdmin: ildocuema@gmail.com';
    RAISE NOTICE '  Password: Ildo7..Marques';
    RAISE NOTICE '  Organização: KAMBA Many - Administração';
    RAISE NOTICE '  Produtos de exemplo: 6 produtos cadastrados';
END $$;
