#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Script paths
const SCRIPTS = {
    apiTest: path.join(__dirname, 'tests', 'api-test.js'),
    websocketTest: path.join(__dirname, 'tests', 'websocket-test.js'),
    analyzer: path.join(__dirname, 'analysis', 'response-analyzer.js')
};

class TestRunner {
    constructor() {
        this.results = {
            apiTest: null,
            websocketTest: null,
            analysis: null
        };
        this.startTime = Date.now();
    }

    async runScript(scriptPath, name, timeout = 300000) { // 5 minute timeout
        return new Promise((resolve, reject) => {
            console.log(`\n🚀 Running ${name}...`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            const child = spawn('node', [scriptPath], {
                stdio: 'inherit',
                cwd: process.cwd()
            });

            const timer = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`${name} timed out after ${timeout / 1000}s`));
            }, timeout);

            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0) {
                    console.log(`✅ ${name} completed successfully`);
                    resolve({ success: true, code });
                } else {
                    console.log(`❌ ${name} failed with code ${code}`);
                    resolve({ success: false, code });
                }
            });

            child.on('error', (error) => {
                clearTimeout(timer);
                console.error(`❌ ${name} failed to start:`, error.message);
                reject(error);
            });
        });
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if scripts exist
        const missingScripts = [];
        Object.entries(SCRIPTS).forEach(([name, scriptPath]) => {
            if (!fs.existsSync(scriptPath)) {
                missingScripts.push(`${name}: ${scriptPath}`);
            }
        });

        if (missingScripts.length > 0) {
            console.error('❌ Missing scripts:');
            missingScripts.forEach(script => console.error(`   ${script}`));
            return false;
        }

        // Check if server is running
        try {
            const axios = require('axios');
            await axios.get('http://localhost:3000/sessions', { timeout: 5000 });
            console.log('✅ Server is running');
        } catch (error) {
            console.error('❌ Server is not running. Please start the server first:');
            console.error('   npm run start:dev');
            console.error('   or');
            console.error('   ./scripts/start-server.sh');
            return false;
        }

        console.log('✅ All prerequisites met');
        return true;
    }

    displaySummary() {
        const totalTime = Date.now() - this.startTime;
        
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                      TEST SUITE SUMMARY                     ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        
        console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(1)}s`);
        console.log(`📅 Completed at: ${new Date().toISOString()}`);
        
        console.log('\n📊 Test Results:');
        Object.entries(this.results).forEach(([testName, result]) => {
            if (result === null) {
                console.log(`   ⏭️  ${testName}: Skipped`);
            } else if (result.success) {
                console.log(`   ✅ ${testName}: Passed`);
            } else {
                console.log(`   ❌ ${testName}: Failed (code: ${result.code})`);
            }
        });

        const totalTests = Object.values(this.results).filter(r => r !== null).length;
        const passedTests = Object.values(this.results).filter(r => r && r.success).length;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);

        if (successRate === 100) {
            console.log('\n🎉 All tests passed! Your AI Model Playground is working perfectly.');
        } else if (successRate >= 50) {
            console.log('\n⚠️  Some tests failed. Check the logs above for details.');
        } else {
            console.log('\n🚨 Multiple test failures detected. Please check your setup.');
        }

        console.log('\n💡 Next Steps:');
        if (successRate === 100) {
            console.log('   • Your API is ready for production use');
            console.log('   • Consider setting up monitoring and alerting');
            console.log('   • Review the analysis report for optimization opportunities');
        } else {
            console.log('   • Check your API keys in the .env file');
            console.log('   • Ensure MongoDB is running and accessible');
            console.log('   • Verify all required dependencies are installed');
            console.log('   • Check server logs for detailed error information');
        }
    }

    async runAllTests() {
        console.log('🎮 AI Model Playground - Comprehensive Test Suite');
        console.log('══════════════════════════════════════════════════════════════');
        console.log(`🕐 Started at: ${new Date().toISOString()}`);

        try {
            // Check prerequisites
            if (!(await this.checkPrerequisites())) {
                process.exit(1);
            }

            // Run API tests
            console.log('\n📝 Phase 1: API Testing');
            try {
                this.results.apiTest = await this.runScript(
                    SCRIPTS.apiTest,
                    'API Tests',
                    300000 // 5 minutes
                );
            } catch (error) {
                console.error(`❌ API test error: ${error.message}`);
                this.results.apiTest = { success: false, error: error.message };
            }

            // Wait a bit between tests
            console.log('\n⏳ Waiting 5 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Run WebSocket tests
            console.log('\n🔌 Phase 2: WebSocket Testing');
            try {
                this.results.websocketTest = await this.runScript(
                    SCRIPTS.websocketTest,
                    'WebSocket Tests',
                    180000 // 3 minutes
                );
            } catch (error) {
                console.error(`❌ WebSocket test error: ${error.message}`);
                this.results.websocketTest = { success: false, error: error.message };
            }

            // Run analysis only if we have some test data
            if (this.results.apiTest && this.results.apiTest.success) {
                console.log('\n📊 Phase 3: Response Analysis');
                try {
                    this.results.analysis = await this.runScript(
                        SCRIPTS.analyzer,
                        'Response Analysis',
                        60000 // 1 minute
                    );
                } catch (error) {
                    console.error(`❌ Analysis error: ${error.message}`);
                    this.results.analysis = { success: false, error: error.message };
                }
            } else {
                console.log('\n⏭️  Skipping analysis - no test data available');
            }

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        } finally {
            this.displaySummary();
        }
    }
}

// Command line options
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        skipWebSocket: false,
        skipAnalysis: false,
        apiOnly: false,
        websocketOnly: false,
        analysisOnly: false
    };

    args.forEach(arg => {
        switch (arg) {
            case '--skip-websocket':
                options.skipWebSocket = true;
                break;
            case '--skip-analysis':
                options.skipAnalysis = true;
                break;
            case '--api-only':
                options.apiOnly = true;
                break;
            case '--websocket-only':
                options.websocketOnly = true;
                break;
            case '--analysis-only':
                options.analysisOnly = true;
                break;
            case '--help':
                console.log('AI Model Playground Test Suite');
                console.log('');
                console.log('Usage: node run-all-tests.js [options]');
                console.log('');
                console.log('Options:');
                console.log('  --api-only         Run only API tests');
                console.log('  --websocket-only   Run only WebSocket tests');
                console.log('  --analysis-only    Run only response analysis');
                console.log('  --skip-websocket   Skip WebSocket tests');
                console.log('  --skip-analysis    Skip response analysis');
                console.log('  --help             Show this help message');
                console.log('');
                console.log('Examples:');
                console.log('  node run-all-tests.js                 # Run all tests');
                console.log('  node run-all-tests.js --api-only      # API tests only');
                console.log('  node run-all-tests.js --skip-websocket # Skip WebSocket tests');
                process.exit(0);
                break;
        }
    });

    return options;
}

// Custom test runner for specific tests
class CustomTestRunner extends TestRunner {
    constructor(options) {
        super();
        this.options = options;
    }

    async runTests() {
        console.log('🎮 AI Model Playground - Custom Test Run');
        console.log('══════════════════════════════════════════════════════════════');

        if (!(await this.checkPrerequisites())) {
            process.exit(1);
        }

        try {
            if (this.options.apiOnly || (!this.options.websocketOnly && !this.options.analysisOnly)) {
                this.results.apiTest = await this.runScript(SCRIPTS.apiTest, 'API Tests');
                if (!this.options.apiOnly) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            if ((this.options.websocketOnly || (!this.options.apiOnly && !this.options.analysisOnly)) && !this.options.skipWebSocket) {
                this.results.websocketTest = await this.runScript(SCRIPTS.websocketTest, 'WebSocket Tests');
                if (!this.options.websocketOnly) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            if ((this.options.analysisOnly || (!this.options.apiOnly && !this.options.websocketOnly)) && !this.options.skipAnalysis) {
                this.results.analysis = await this.runScript(SCRIPTS.analyzer, 'Response Analysis');
            }

        } catch (error) {
            console.error('❌ Custom test run failed:', error.message);
        } finally {
            this.displaySummary();
        }
    }
}

// Main execution
async function main() {
    const options = parseArgs();
    
    if (options.apiOnly || options.websocketOnly || options.analysisOnly || options.skipWebSocket || options.skipAnalysis) {
        const customRunner = new CustomTestRunner(options);
        await customRunner.runTests();
    } else {
        const runner = new TestRunner();
        await runner.runAllTests();
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Test suite interrupted by user');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test suite terminated');
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = { TestRunner, CustomTestRunner }; 