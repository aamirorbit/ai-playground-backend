#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ResponseAnalyzer {
    constructor() {
        this.resultsDir = path.join(__dirname, 'results');
        this.metrics = {
            quality: {},
            performance: {},
            cost: {},
            reliability: {}
        };
    }

    loadLatestReport() {
        if (!fs.existsSync(this.resultsDir)) {
            throw new Error('No results directory found. Run tests first.');
        }

        const files = fs.readdirSync(this.resultsDir)
            .filter(file => file.startsWith('test-report-') && file.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length === 0) {
            throw new Error('No test reports found. Run tests first.');
        }

        const latestFile = path.join(this.resultsDir, files[0]);
        const data = fs.readFileSync(latestFile, 'utf8');
        return JSON.parse(data);
    }

    analyzeResponseQuality(results) {
        console.log('\n🔍 RESPONSE QUALITY ANALYSIS');
        console.log('════════════════════════════════════════════════════════');

        const qualityMetrics = {};

        results.forEach(result => {
            Object.entries(result.models).forEach(([model, modelResult]) => {
                if (modelResult.status === 'success' && modelResult.response) {
                    if (!qualityMetrics[model]) {
                        qualityMetrics[model] = {
                            totalResponses: 0,
                            avgLength: 0,
                            totalLength: 0,
                            wordsPerResponse: [],
                            sentencesPerResponse: [],
                            readabilityScores: []
                        };
                    }

                    const metrics = qualityMetrics[model];
                    const response = modelResult.response;
                    
                    metrics.totalResponses++;
                    metrics.totalLength += response.length;
                    
                    // Count words and sentences
                    const words = response.split(/\s+/).length;
                    const sentences = response.split(/[.!?]+/).length - 1;
                    
                    metrics.wordsPerResponse.push(words);
                    metrics.sentencesPerResponse.push(sentences);
                    
                    // Simple readability score (words per sentence)
                    const readability = sentences > 0 ? words / sentences : 0;
                    metrics.readabilityScores.push(readability);
                }
            });
        });

        // Calculate averages and display
        Object.entries(qualityMetrics).forEach(([model, metrics]) => {
            metrics.avgLength = metrics.totalLength / metrics.totalResponses;
            metrics.avgWords = metrics.wordsPerResponse.reduce((a, b) => a + b, 0) / metrics.wordsPerResponse.length;
            metrics.avgSentences = metrics.sentencesPerResponse.reduce((a, b) => a + b, 0) / metrics.sentencesPerResponse.length;
            metrics.avgReadability = metrics.readabilityScores.reduce((a, b) => a + b, 0) / metrics.readabilityScores.length;

            console.log(`\n🤖 ${model.toUpperCase()}:`);
            console.log(`   📝 Average response length: ${metrics.avgLength.toFixed(0)} characters`);
            console.log(`   📖 Average words per response: ${metrics.avgWords.toFixed(0)}`);
            console.log(`   📄 Average sentences per response: ${metrics.avgSentences.toFixed(1)}`);
            console.log(`   📚 Average words per sentence: ${metrics.avgReadability.toFixed(1)}`);
        });

        return qualityMetrics;
    }

    analyzePerformance(aggregateStats) {
        console.log('\n⚡ PERFORMANCE ANALYSIS');
        console.log('════════════════════════════════════════════════════════');

        const models = Object.entries(aggregateStats.byModel);
        
        // Sort by success rate
        const bySuccessRate = [...models].sort((a, b) => b[1].successRate - a[1].successRate);
        console.log('\n🏆 Reliability Ranking (by success rate):');
        bySuccessRate.forEach(([model, stats], index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            console.log(`   ${medal} ${model.toUpperCase()}: ${stats.successRate.toFixed(1)}%`);
        });

        // Sort by response time
        const bySpeed = [...models]
            .filter(([_, stats]) => stats.averageResponseTime > 0)
            .sort((a, b) => a[1].averageResponseTime - b[1].averageResponseTime);
        
        console.log('\n⚡ Speed Ranking (by avg response time):');
        bySpeed.forEach(([model, stats], index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            console.log(`   ${medal} ${model.toUpperCase()}: ${stats.averageResponseTime.toFixed(0)}ms`);
        });

        // Performance insights
        console.log('\n💡 Performance Insights:');
        
        const fastest = bySpeed[0];
        const slowest = bySpeed[bySpeed.length - 1];
        if (fastest && slowest) {
            const speedDiff = slowest[1].averageResponseTime - fastest[1].averageResponseTime;
            console.log(`   🏃 ${fastest[0].toUpperCase()} is the fastest (${speedDiff.toFixed(0)}ms faster than ${slowest[0].toUpperCase()})`);
        }

        const mostReliable = bySuccessRate[0];
        console.log(`   🛡️  ${mostReliable[0].toUpperCase()} is the most reliable (${mostReliable[1].successRate.toFixed(1)}% success rate)`);

        return { bySuccessRate, bySpeed };
    }

    analyzeCostEfficiency(aggregateStats) {
        console.log('\n💰 COST ANALYSIS');
        console.log('════════════════════════════════════════════════════════');

        const models = Object.entries(aggregateStats.byModel)
            .filter(([_, stats]) => stats.totalCost > 0)
            .sort((a, b) => a[1].totalCost - b[1].totalCost);

        console.log('\n💳 Cost Ranking (total cost):');
        models.forEach(([model, stats], index) => {
            const medal = index === 0 ? '💚' : index === 1 ? '💛' : '💸';
            const avgCostPerToken = stats.totalTokens > 0 ? (stats.totalCost / stats.totalTokens) * 1000 : 0;
            console.log(`   ${medal} ${model.toUpperCase()}: $${stats.totalCost.toFixed(6)} total ($${avgCostPerToken.toFixed(6)} per 1K tokens)`);
        });

        // Cost efficiency (value for money)
        console.log('\n📊 Cost Efficiency Analysis:');
        models.forEach(([model, stats]) => {
            if (stats.successes > 0) {
                const costPerSuccess = stats.totalCost / stats.successes;
                const tokensPerDollar = stats.totalCost > 0 ? stats.totalTokens / stats.totalCost : 0;
                console.log(`   💡 ${model.toUpperCase()}:`);
                console.log(`      Cost per successful response: $${costPerSuccess.toFixed(6)}`);
                console.log(`      Tokens per dollar: ${tokensPerDollar.toFixed(0)}`);
            }
        });

        return models;
    }

    analyzeByPromptType(results) {
        console.log('\n🎯 ANALYSIS BY PROMPT TYPE');
        console.log('════════════════════════════════════════════════════════');

        const promptTypes = {};

        results.forEach(result => {
            const promptName = result.promptName;
            if (!promptTypes[promptName]) {
                promptTypes[promptName] = {
                    models: {},
                    totalSuccesses: 0,
                    totalFailures: 0
                };
            }

            Object.entries(result.models).forEach(([model, modelResult]) => {
                if (!promptTypes[promptName].models[model]) {
                    promptTypes[promptName].models[model] = {
                        successes: 0,
                        failures: 0,
                        avgTime: 0,
                        totalTime: 0
                    };
                }

                const modelStats = promptTypes[promptName].models[model];
                
                if (modelResult.status === 'success') {
                    modelStats.successes++;
                    promptTypes[promptName].totalSuccesses++;
                    modelStats.totalTime += modelResult.timeTaken;
                } else {
                    modelStats.failures++;
                    promptTypes[promptName].totalFailures++;
                }
            });
        });

        // Calculate averages and display
        Object.entries(promptTypes).forEach(([promptName, data]) => {
            console.log(`\n📝 ${promptName.replace(/_/g, ' ').toUpperCase()}:`);
            
            Object.entries(data.models).forEach(([model, stats]) => {
                if (stats.successes > 0) {
                    stats.avgTime = stats.totalTime / stats.successes;
                }
                const successRate = ((stats.successes / (stats.successes + stats.failures)) * 100).toFixed(1);
                console.log(`   🤖 ${model}: ${successRate}% success, ${stats.avgTime.toFixed(0)}ms avg`);
            });
        });

        return promptTypes;
    }

    generateRecommendations(qualityMetrics, performanceRanking, costRanking) {
        console.log('\n🎯 RECOMMENDATIONS');
        console.log('════════════════════════════════════════════════════════');

        // Find best overall model
        const models = Object.keys(qualityMetrics);
        const recommendations = [];

        // Speed recommendation
        if (performanceRanking.bySpeed.length > 0) {
            const fastest = performanceRanking.bySpeed[0];
            recommendations.push(`⚡ For speed: Use ${fastest[0].toUpperCase()} (${fastest[1].averageResponseTime.toFixed(0)}ms average)`);
        }

        // Reliability recommendation
        if (performanceRanking.bySuccessRate.length > 0) {
            const mostReliable = performanceRanking.bySuccessRate[0];
            recommendations.push(`🛡️  For reliability: Use ${mostReliable[0].toUpperCase()} (${mostReliable[1].successRate.toFixed(1)}% success rate)`);
        }

        // Cost recommendation
        if (costRanking.length > 0) {
            const cheapest = costRanking[0];
            recommendations.push(`💰 For cost efficiency: Use ${cheapest[0].toUpperCase()} (lowest total cost)`);
        }

        // Quality recommendation (longest responses)
        const qualityRanking = Object.entries(qualityMetrics)
            .sort((a, b) => b[1].avgWords - a[1].avgWords);
        
        if (qualityRanking.length > 0) {
            const mostDetailed = qualityRanking[0];
            recommendations.push(`📖 For detailed responses: Use ${mostDetailed[0].toUpperCase()} (${mostDetailed[1].avgWords.toFixed(0)} words average)`);
        }

        recommendations.forEach(rec => console.log(`   ${rec}`));

        console.log('\n💡 General Recommendations:');
        console.log('   • Use multiple models for critical tasks to ensure reliability');
        console.log('   • Monitor costs regularly, especially for high-volume usage');
        console.log('   • Consider response time requirements vs. quality trade-offs');
        console.log('   • Test different models for specific use cases');

        return recommendations;
    }

    analyze() {
        try {
            console.log('🔬 AI Model Response Analysis Report');
            console.log('═══════════════════════════════════════════════════════════════');

            const report = this.loadLatestReport();
            
            console.log(`📊 Report generated: ${report.timestamp}`);
            console.log(`🎯 Total tests: ${report.totalTests}`);
            console.log(`⏱️  Total duration: ${(report.totalDuration / 1000).toFixed(1)}s`);

            // Run all analyses
            const qualityMetrics = this.analyzeResponseQuality(report.results);
            const performanceRanking = this.analyzePerformance(report.aggregateStats);
            const costRanking = this.analyzeCostEfficiency(report.aggregateStats);
            const promptAnalysis = this.analyzeByPromptType(report.results);
            
            // Generate recommendations
            this.generateRecommendations(qualityMetrics, performanceRanking, costRanking);

            console.log('\n📋 Analysis Complete!');
            console.log('═══════════════════════════════════════════════════════════════');

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            console.log('💡 Make sure to run the API tests first to generate data.');
        }
    }
}

// Main execution
if (require.main === module) {
    const analyzer = new ResponseAnalyzer();
    analyzer.analyze();
}

module.exports = ResponseAnalyzer; 