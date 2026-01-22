import { generateActivationCode, type PlanType } from '@/lib/subscription/activationService';

/**
 * ADMIN TOOL: Generate Activation Code
 * Usage: npm run generate-code <REFERENCE_CODE> <PLAN_TYPE>
 * Example: npm run generate-code REF-ABC123 MENSAL
 */

const args = process.argv.slice(2);
const referenceCode = args[0];
const planType = args[1] as PlanType;

if (!referenceCode || !planType) {
    console.error('Usage: ts-node scripts/generateActivation.ts <REFERENCE_CODE> <PLAN_TYPE>');
    console.error('Plan Types: MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL');
    process.exit(1);
}

try {
    const code = generateActivationCode(referenceCode, planType);
    console.log('\n=================================================');
    console.log(`✅ Activation Code Generated for ${referenceCode} (${planType})`);
    console.log('-------------------------------------------------');
    console.log(`\n👉  ${code}  👈\n`);
    console.log('=================================================\n');
} catch (error) {
    console.error('Error generating code:', error);
}
