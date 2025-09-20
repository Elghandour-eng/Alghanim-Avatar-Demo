// Test script for LLM Providers (Groq and Dify)
const LLMProvider = require('./llm-provider');
require('dotenv').config();

async function testLLMProviders() {
    console.log('🧪 Starting LLM Provider Tests\n');
    
    // Test current provider
    console.log(`📋 Current LLM Provider: ${process.env.LLM_PROVIDER || 'dify'}`);
    
    const llmProvider = new LLMProvider();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get provider info
    console.log('\n📊 Provider Information:');
    const providerInfo = llmProvider.getProviderInfo();
    console.log(JSON.stringify(providerInfo, null, 2));
    
    // Test message
    const testMessage = "Hello! Tell me about Cadillac cars.";
    console.log(`\n💬 Test Message: "${testMessage}"`);
    
    try {
        if (llmProvider.provider === 'groq') {
            console.log('\n🚀 Testing Groq Provider...');
            await testGroqProvider(llmProvider, testMessage);
        } else if (llmProvider.provider === 'dify') {
            console.log('\n🚀 Testing Dify Provider...');
            await testDifyProvider(llmProvider, testMessage);
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function testGroqProvider(llmProvider, message) {
    try {
        console.log('📤 Sending message to Groq...');
        
        // Test streaming
        console.log('🔄 Testing streaming response...');
        let fullResponse = '';
        
        await llmProvider.streamGroqMessage(message, 'test-user', 'test-conversation', (data) => {
            if (data.type === 'message') {
                process.stdout.write(data.content);
                fullResponse += data.content;
            } else if (data.type === 'message_end') {
                console.log('\n\n✅ Streaming completed');
                console.log('📋 Final Response Data:');
                console.log(JSON.stringify(data, null, 2));
            } else if (data.type === 'error') {
                console.error('❌ Streaming error:', data);
            }
        });
        
    } catch (error) {
        console.error('❌ Groq test failed:', error);
    }
}

async function testDifyProvider(llmProvider, message) {
    try {
        console.log('📤 Sending message to Dify...');
        
        const response = await llmProvider.sendDifyMessage(message, 'test-user', '');
        
        console.log('✅ Dify response received');
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response, null, 2));
        
    } catch (error) {
        console.error('❌ Dify test failed:', error);
    }
}

// Test both providers by switching environment variable
async function testBothProviders() {
    console.log('🔄 Testing Both Providers\n');
    
    const originalProvider = process.env.LLM_PROVIDER;
    
    // Test Groq
    console.log('=' .repeat(50));
    console.log('🤖 TESTING GROQ PROVIDER');
    console.log('=' .repeat(50));
    process.env.LLM_PROVIDER = 'groq';
    await testLLMProviders();
    
    // Test Dify
    console.log('\n' + '=' .repeat(50));
    console.log('🤖 TESTING DIFY PROVIDER');
    console.log('=' .repeat(50));
    process.env.LLM_PROVIDER = 'dify';
    await testLLMProviders();
    
    // Restore original
    process.env.LLM_PROVIDER = originalProvider;
    
    console.log('\n✅ All provider tests completed!');
}

// API endpoint testing examples
function generateAPITestExamples() {
    console.log('\n🌐 API Testing Examples:\n');
    
    console.log('1. Get LLM Provider Info:');
    console.log(`curl -X GET http://localhost:3000/api/llm-provider-info`);
    
    console.log('\n2. Send message to current LLM provider:');
    console.log(`curl -X POST http://localhost:3000/api/llm-chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello! Tell me about Cadillac cars.", "userId": "test-user"}'`);
    
    console.log('\n3. Send message to Dify (legacy endpoint):');
    console.log(`curl -X POST http://localhost:3000/api/dify-chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello! Tell me about Cadillac cars.", "userId": "test-user"}'`);
    
    console.log('\n4. Test with media request:');
    console.log(`curl -X POST http://localhost:3000/api/llm-chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Show me a video about Cadillac Escalade", "userId": "test-user"}'`);
}

// Environment validation
function validateEnvironment() {
    console.log('🔍 Environment Validation:\n');
    
    const requiredVars = [
        'LLM_PROVIDER',
        'GROQ_API_KEY',
        'DIFY_API_KEY'
    ];
    
    const optionalVars = [
        'GROQ_MODEL',
        'GROQ_TEMPERATURE',
        'GROQ_MAX_TOKENS',
        'GROQ_TOP_P'
    ];
    
    console.log('Required Environment Variables:');
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        const status = value ? '✅' : '❌';
        console.log(`${status} ${varName}: ${value ? 'Set' : 'Missing'}`);
    });
    
    console.log('\nOptional Environment Variables:');
    optionalVars.forEach(varName => {
        const value = process.env[varName];
        const status = value ? '✅' : '⚠️';
        console.log(`${status} ${varName}: ${value || 'Using default'}`);
    });
    
    console.log(`\n📋 Current Provider: ${process.env.LLM_PROVIDER || 'dify'}`);
}

// Run tests based on command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--validate') || args.includes('-v')) {
        validateEnvironment();
    } else if (args.includes('--both') || args.includes('-b')) {
        testBothProviders();
    } else if (args.includes('--examples') || args.includes('-e')) {
        generateAPITestExamples();
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🧪 LLM Provider Test Script

Usage:
  node test-llm-providers.js [options]

Options:
  --validate, -v    Validate environment variables
  --both, -b        Test both Groq and Dify providers
  --examples, -e    Show API testing examples
  --help, -h        Show this help message

Default: Test current provider (${process.env.LLM_PROVIDER || 'dify'})
        `);
    } else {
        testLLMProviders();
    }
}

module.exports = {
    testLLMProviders,
    testBothProviders,
    validateEnvironment,
    generateAPITestExamples
};