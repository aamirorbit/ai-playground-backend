#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class QuickTester {
    constructor() {
        this.sessionId = null;
    }

    async quickTest() {
        console.log('⚡ AI Model Playground - Quick Test');
        console.log('══════════════════════════════════════');

        try {
            // Check server
            console.log('🔍 Checking server...');
            await axios.get(`${BASE_URL}/sessions`);
            console.log('✅ Server is running');

            // Test models info first
            console.log('\n📋 Fetching available models...');
            const modelsResponse = await axios.get(`${BASE_URL}/models`);
            console.log(`✅ Found ${modelsResponse.data.length} available models`);

            // Create session with latest models
            console.log('\n🎯 Creating test session...');
            const sessionResponse = await axios.post(`${BASE_URL}/sessions`, {
                selectedModels: ['openai-gpt4o', 'anthropic-claude35-sonnet']
            });
            
            this.sessionId = sessionResponse.data.sessionId;
            console.log(`✅ Session created: ${this.sessionId}`);

            // Quick prompt test
            console.log('\n💭 Testing quick prompt...');
            const prompt = 'Say hello in exactly 5 words.';
            
            const startTime = Date.now();
            const response = await axios.post(`${BASE_URL}/prompts/${this.sessionId}`, {
                prompt
            });
            const endTime = Date.now();

            console.log(`⚡ Response received in ${endTime - startTime}ms`);
            
            // Display results
            Object.entries(response.data.results).forEach(([model, result]) => {
                console.log(`\n🤖 ${model.toUpperCase()}:`);
                if (result.error) {
                    console.log(`   ❌ Error: ${result.error}`);
                } else {
                    console.log(`   ✅ Response: "${result.response}"`);
                    console.log(`   ⏱️  Time: ${result.timeTakenMs}ms`);
                    console.log(`   💰 Cost: $${result.costEstimateUsd}`);
                }
            });

            // Test history
            console.log('\n📚 Testing history...');
            const historyResponse = await axios.get(`${BASE_URL}/prompts/history?limit=1`);
            console.log(`✅ History retrieved: ${historyResponse.data.length} entries`);

            console.log('\n🎉 Quick test completed successfully!');
            console.log('💡 Run full tests with: node scripts/run-all-tests.js');

        } catch (error) {
            console.error('\n❌ Quick test failed:', error.response?.data || error.message);
            
            if (error.code === 'ECONNREFUSED') {
                console.log('\n💡 Server not running. Start it with:');
                console.log('   npm run start:dev');
                console.log('   or');
                console.log('   ./scripts/start-server.sh');
            }
        }
    }
}

// Main execution
if (require.main === module) {
    const tester = new QuickTester();
    tester.quickTest().catch(error => {
        console.error('❌ Quick test failed:', error.message);
        process.exit(1);
    });
}

module.exports = QuickTester; 