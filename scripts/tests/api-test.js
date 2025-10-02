#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '../analysis/results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test prompts for different scenarios
const TEST_PROMPTS = [
    {
        name: 'creative_writing',
        prompt: 'Write a short creative story about a robot learning to paint.',
        description: 'Tests creative writing capabilities'
    },
    {
        name: 'technical_explanation',
        prompt: 'Explain how machine learning works in simple terms.',
        description: 'Tests technical explanation abilities'
    },
    {
        name: 'problem_solving',
        prompt: 'How would you solve the problem of reducing plastic waste in oceans?',
        description: 'Tests problem-solving and reasoning'
    },
    {
        name: 'code_generation',
        prompt: 'Write a Python function to find the longest palindrome in a string.',
        description: 'Tests code generation capabilities'
    },
    {
        name: 'analysis_task',
        prompt: 'Compare the advantages and disadvantages of renewable energy sources.',
        description: 'Tests analytical thinking'
    }
];

// Available AI models - updated with new model variants
const ALL_MODELS = [
  'openai-gpt4o', 
  'openai-gpt4o-mini', 
  
  'anthropic-claude35-sonnet', 
  'anthropic-claude35-haiku',
  'anthropic-claude4-sonnet',
  'xai-grok3-beta', 
  'xai-grok4'
];

// Test different model combinations
const MODEL_TEST_COMBINATIONS = [
  ['openai-gpt4o', 'anthropic-claude35-sonnet'],
  ['xai-grok3-beta', 'xai-grok4'],
  ['openai-gpt4o-mini', 'anthropic-claude35-haiku'],
  ALL_MODELS.slice(0, 3), // First 3 models
];

class AIPlaygroundTester {
    constructor() {
        this.sessionId = null;
        this.results = [];
        this.startTime = Date.now();
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async makeRequest(method, url, data = null) {
        try {
            const config = {
                method,
                url: `${BASE_URL}${url}`,
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 120000, // 2 minutes timeout
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    async createSession(selectedModels = ALL_MODELS) {
        console.log(`🎯 Creating session with models: ${selectedModels.join(', ')}`);
        
        const result = await this.makeRequest('POST', '/sessions', {
            selectedModels
        });

        if (result.success) {
            this.sessionId = result.data.sessionId;
            console.log(`✅ Session created: ${this.sessionId}`);
            return true;
        } else {
            console.error('❌ Failed to create session:', result.error);
            return false;
        }
    }

    async submitPrompt(prompt, promptName) {
        console.log(`\n📝 Testing prompt: ${promptName}`);
        console.log(`💭 Prompt: "${prompt.substring(0, 100)}..."`);
        
        const startTime = Date.now();
        const result = await this.makeRequest('POST', `/prompts/${this.sessionId}`, {
            prompt
        });

        const totalTime = Date.now() - startTime;

        if (result.success) {
            const response = result.data;
            console.log(`✅ Completed in ${totalTime}ms`);
            
            // Analyze results
            const analysis = this.analyzeResponse(response, promptName, totalTime);
            this.results.push(analysis);
            
            return analysis;
        } else {
            console.error(`❌ Failed to submit prompt: ${result.error}`);
            return null;
        }
    }

    analyzeResponse(response, promptName, totalTime) {
        const analysis = {
            timestamp: new Date().toISOString(),
            promptName,
            prompt: response.prompt,
            totalTime,
            models: {},
            summary: {
                successfulModels: 0,
                failedModels: 0,
                totalCost: 0,
                averageResponseTime: 0,
                totalTokens: 0
            }
        };

        // Analyze each model's response
        Object.entries(response.results).forEach(([modelName, result]) => {
            if (result.error) {
                analysis.models[modelName] = {
                    status: 'error',
                    error: result.error,
                    timeTaken: result.timeTakenMs || 0
                };
                analysis.summary.failedModels++;
            } else {
                analysis.models[modelName] = {
                    status: 'success',
                    responseLength: result.response?.length || 0,
                    tokens: result.tokens,
                    timeTaken: result.timeTakenMs,
                    cost: result.costEstimateUsd,
                    wordsPerSecond: this.calculateWordsPerSecond(result.response, result.timeTakenMs)
                };
                analysis.summary.successfulModels++;
                analysis.summary.totalCost += result.costEstimateUsd;
                analysis.summary.totalTokens += result.tokens?.total_tokens || 0;
            }
        });

        // Calculate averages
        if (analysis.summary.successfulModels > 0) {
            const successfulModels = Object.values(analysis.models).filter(m => m.status === 'success');
            analysis.summary.averageResponseTime = successfulModels.reduce((sum, m) => sum + m.timeTaken, 0) / successfulModels.length;
        }

        // Display results
        this.displayAnalysis(analysis);
        
        return analysis;
    }

    calculateWordsPerSecond(text, timeMs) {
        if (!text || timeMs === 0) return 0;
        const words = text.split(/\s+/).length;
        return (words / (timeMs / 1000)).toFixed(2);
    }

    displayAnalysis(analysis) {
        console.log('\n📊 Response Analysis:');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        Object.entries(analysis.models).forEach(([modelName, result]) => {
            console.log(`\n🤖 ${modelName.toUpperCase()}:`);
            if (result.status === 'error') {
                console.log(`   ❌ Error: ${result.error}`);
            } else {
                console.log(`   ✅ Success`);
                console.log(`   📝 Response length: ${result.responseLength} characters`);
                console.log(`   🔢 Tokens: ${result.tokens?.total_tokens || 0} (${result.tokens?.prompt_tokens || 0} + ${result.tokens?.completion_tokens || 0})`);
                console.log(`   ⏱️  Time: ${result.timeTaken}ms`);
                console.log(`   💰 Cost: $${result.cost.toFixed(6)}`);
                console.log(`   🏃 Speed: ${result.wordsPerSecond} words/second`);
            }
        });

        console.log(`\n📈 Summary:`);
        console.log(`   ✅ Successful: ${analysis.summary.successfulModels}`);
        console.log(`   ❌ Failed: ${analysis.summary.failedModels}`);
        console.log(`   💰 Total cost: $${analysis.summary.totalCost.toFixed(6)}`);
        console.log(`   🔢 Total tokens: ${analysis.summary.totalTokens}`);
        console.log(`   ⏱️  Avg response time: ${analysis.summary.averageResponseTime.toFixed(0)}ms`);
    }

    async runAllTests() {
        console.log('🎮 Starting AI Model Playground Tests\n');
        
        // Create session
        if (!(await this.createSession())) {
            return;
        }

        // Wait a moment for session to be fully created
        await this.delay(1000);

        // Run all test prompts
        for (const testPrompt of TEST_PROMPTS) {
            await this.submitPrompt(testPrompt.prompt, testPrompt.name);
            await this.delay(2000); // Wait between tests
        }

        // Generate final report
        await this.generateReport();
        
        console.log(`\n🎉 All tests completed in ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            totalTests: this.results.length,
            totalDuration: Date.now() - this.startTime,
            results: this.results,
            aggregateStats: this.calculateAggregateStats()
        };

        // Save detailed report
        const reportPath = path.join(RESULTS_DIR, `test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Generate summary
        this.generateSummaryReport(report);
        
        console.log(`\n📊 Detailed report saved: ${reportPath}`);
    }

    calculateAggregateStats() {
        const stats = {
            byModel: {},
            overall: {
                totalCost: 0,
                totalTokens: 0,
                averageResponseTime: 0,
                successRate: 0
            }
        };

        // Initialize model stats
        ALL_MODELS.forEach(model => {
            stats.byModel[model] = {
                successes: 0,
                failures: 0,
                totalCost: 0,
                totalTokens: 0,
                totalTime: 0,
                averageWordsPerSecond: 0
            };
        });

        // Aggregate data
        this.results.forEach(result => {
            Object.entries(result.models).forEach(([modelName, modelResult]) => {
                const modelStats = stats.byModel[modelName];
                
                if (modelResult.status === 'success') {
                    modelStats.successes++;
                    modelStats.totalCost += modelResult.cost;
                    modelStats.totalTokens += modelResult.tokens?.total_tokens || 0;
                    modelStats.totalTime += modelResult.timeTaken;
                } else {
                    modelStats.failures++;
                }
            });

            stats.overall.totalCost += result.summary.totalCost;
            stats.overall.totalTokens += result.summary.totalTokens;
        });

        // Calculate averages
        Object.values(stats.byModel).forEach(modelStats => {
            if (modelStats.successes > 0) {
                modelStats.averageResponseTime = modelStats.totalTime / modelStats.successes;
                modelStats.successRate = (modelStats.successes / (modelStats.successes + modelStats.failures)) * 100;
            }
        });

        const totalTests = this.results.length * ALL_MODELS.length;
        const totalSuccesses = Object.values(stats.byModel).reduce((sum, model) => sum + model.successes, 0);
        stats.overall.successRate = (totalSuccesses / totalTests) * 100;

        return stats;
    }

    generateSummaryReport(report) {
        console.log('\n📋 FINAL TEST SUMMARY');
        console.log('══════════════════════════════════════════════════════════');
        
        console.log(`\n📊 Overall Performance:`);
        console.log(`   🎯 Tests completed: ${report.totalTests}`);
        console.log(`   ⏱️  Total duration: ${(report.totalDuration / 1000).toFixed(1)}s`);
        console.log(`   ✅ Success rate: ${report.aggregateStats.overall.successRate.toFixed(1)}%`);
        console.log(`   💰 Total cost: $${report.aggregateStats.overall.totalCost.toFixed(6)}`);
        console.log(`   🔢 Total tokens: ${report.aggregateStats.overall.totalTokens}`);

        console.log(`\n🤖 Model Performance Comparison:`);
        Object.entries(report.aggregateStats.byModel).forEach(([modelName, stats]) => {
            console.log(`\n   ${modelName.toUpperCase()}:`);
            console.log(`     ✅ Successes: ${stats.successes}`);
            console.log(`     ❌ Failures: ${stats.failures}`);
            console.log(`     📈 Success rate: ${stats.successRate.toFixed(1)}%`);
            console.log(`     💰 Total cost: $${stats.totalCost.toFixed(6)}`);
            console.log(`     ⏱️  Avg response time: ${stats.averageResponseTime.toFixed(0)}ms`);
        });

        // Find best performing model
        const bestModel = Object.entries(report.aggregateStats.byModel)
            .filter(([_, stats]) => stats.successes > 0)
            .sort((a, b) => b[1].successRate - a[1].successRate)[0];

        if (bestModel) {
            console.log(`\n🏆 Best performing model: ${bestModel[0].toUpperCase()} (${bestModel[1].successRate.toFixed(1)}% success rate)`);
        }
    }
}

// Main execution
async function main() {
    // Check if server is running
    try {
        await axios.get(`${BASE_URL}/sessions`);
    } catch (error) {
        console.error('❌ Server is not running. Please start the server first:');
        console.error('   npm run start:dev');
        console.error('   or');
        console.error('   ./scripts/start-server.sh');
        process.exit(1);
    }

    const tester = new AIPlaygroundTester();
    await tester.runAllTests();
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
}

module.exports = AIPlaygroundTester; 