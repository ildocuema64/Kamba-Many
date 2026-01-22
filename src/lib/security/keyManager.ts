/**
 * Gestão Segura de Chaves de Assinatura
 * Carrega chave privada de variável de ambiente
 */

// Chave de demonstração (apenas para desenvolvimento)
const DEMO_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYQ6yvKCwz9h1f
BHz+s3OcbA3vSGgMZwyYSsP/NBu4r68h73jiJ8RzULS0yLcV/1FrxW4FU3KynFU6
5at95Z7lZpcUBeItCgnky2vNfA7jnNtAHTztDD1JG6uKUzcvRavxns6rYckF5pCY
A3FPZtfnAQh0qBMLGrWBmHlYR+Jk1EAJddWF/hqIzokJlmyibvrMrEcAw9fDZ453
i5q96J/cDud3yXaJoCGW0PDhx6qDE5iiLRye/M6B0S4GZMvu//NDrpqxF6+ua4s1
gcX97JMM1tn6uqzgEUqU1yq1AcZ42grJAzSrMwyktpOnCJvhGcu082ssTyteBq6Y
OlWOCuSbAgMBAAECggEATAVJw7/SZfUEkAqNH5tX5uqaAHRNopeWlbiKZ7HL/2cT
kOVfnMZPEmXievpVUrHBJIYTWqxhsSRVd0zw1LAep5kTZ+dSF7uR2f3oKlU8l86a
NsYCQ7XfKU+b0zmd7UejQ8TOmYl+VKhbW9IoMgT+WXLOFnRN4bbplTUbrIRjV4RN
99sR6B0rVxOTMnJUn5pak0Yoafuf0KfFb3FMUsPhHDr7nJM7L8Als6vrBAB90MH9
73PgE9OPF9aohBbzspzc4pWYrCRaT25zinEhLZuWlNC1AVu6huoGZ5Fm8V+O8WWT
jkgwzhmrM4BsFjxtWiHYkouC5Rtl9nB3bzi9JAlcYQKBgQDGyai3HDSrqUmMM6G7
iyalwfZFhyfMkfnsIjhXeVizDJmKOcqAVbxbrnUfvVx0Fcsr3RZdZiS4yhtn8RC4
wgX1upm71uvRJV9cItYCgedqFUaldEQdDY/gokOL6zf0N0XWQkndTPkA1TcSGZqG
UfUiZQAB/nNhmhqG/IdzaEu/4QKBgQDEFkCfwGpttZiZkRMTOdUy9c7ISxu1+T6c
s87bmfc2Y4shosKrTiHYCXLbUVrfupyBleyfh64RSUVJoaY2FMzlzmGf0k3mQlhs
a6ZxRQk5GL3w2ziMCdDVyGhbtlianAS6YK264pM2S+xuzCdVIJ0/pvWIFhdhvaT3
cXLbqcoj+wKBgFF0+wylozOgeAHaenCmUZzkwSy2eGmMe7P2Rc4abG1aQWRxz/gM
qdWLxHTQHJ14/Lspqmt1WqDaOKa8EpUS9GxAHZTqOdGHFe9kWvvGDXTb6QoNfYfG
Menjs/gW1+Pb7mMg4LGtQ+/CbwGcukRGO0PvzTQD93XMNwiPXFW/LCMhAoGBAJQf
Qx3qGftZ7DZE8qXZUAW4zUVcB0jFSNjSsvYMLkR1mYoFCwygbsxlBtBJel3693Kk
MCSqN4FzWdWvOIEt4UHPTsuN7656e5UbFJYH0lnBKOoij2qpl4mGY96ztebE6IVp
tpKvyQiA/c8MhMG3a1HD60Grfmok+dK5bkwkzD+1AoGAeuGstQABXkneh/eAMVn1
u+XEP9JT9hpvSySfTOZUvmnA4fMRkmUEd15Tj/HMNj/XGAKsBCMs3EvMkwrWXJ+5
Zj1KLma9hjA7+m04NmOwrpZOrMEBW7V9CmOHHFfgDvvAkte4i68IpIiN3tSS1uEO
CK6Ep9FKoUVq2aLvai7/tGw=
-----END PRIVATE KEY-----`;

/**
 * Obtém a chave privada de forma segura
 * Prioridade: 1) Variável de ambiente (produção), 2) Chave demo (desenvolvimento)
 */
export function getPrivateKey(): string {
    // 1. Tentar carregar de variável de ambiente (base64 encoded)
    const envKeyB64 = process.env.AGT_PRIVATE_KEY_B64;
    if (envKeyB64 && envKeyB64.trim().length > 0) {
        try {
            // Decode from base64
            const decoded = Buffer.from(envKeyB64, 'base64').toString('utf-8');
            return decoded;
        } catch (e) {
            console.error('[KeyManager] Erro ao decodificar AGT_PRIVATE_KEY_B64:', e);
        }
    }

    // 2. Tentar carregar chave direta (formato PEM)
    const envKeyDirect = process.env.AGT_PRIVATE_KEY;
    if (envKeyDirect && envKeyDirect.includes('PRIVATE KEY')) {
        return envKeyDirect;
    }

    // 3. Fallback para chave de demonstração (APENAS DESENVOLVIMENTO)
    if (process.env.NODE_ENV === 'development') {
        console.warn('[KeyManager] ⚠️ Usando chave de demonstração. NÃO USAR EM PRODUÇÃO!');
        return DEMO_PRIVATE_KEY;
    }

    throw new Error(
        'Chave privada AGT não configurada. ' +
        'Defina a variável de ambiente AGT_PRIVATE_KEY_B64 ou AGT_PRIVATE_KEY.'
    );
}

/**
 * Verifica se está usando chave de produção
 */
export function isProductionKeyConfigured(): boolean {
    const envKeyB64 = process.env.AGT_PRIVATE_KEY_B64;
    const envKeyDirect = process.env.AGT_PRIVATE_KEY;

    return Boolean(
        (envKeyB64 && envKeyB64.trim().length > 0) ||
        (envKeyDirect && envKeyDirect.includes('PRIVATE KEY'))
    );
}
