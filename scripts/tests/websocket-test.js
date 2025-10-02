#!/usr/bin/env node

const { io } = require('socket.io-client');
const axios = require('axios');

// Configuration
const WS_URL = 'http://localhost:3000'; // Updated to same port as HTTP server
const BASE_URL = 'http://localhost:3000';

class WebSocketTester {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.responses = [];
        this.connected = false;
        this.completedModels = []; // Added for real-time tracking
        this.totalModels = 0;      // Added for real-time tracking
        this.startTime = null;     // Added for real-time tracking
        this.modelStreams = {};    // 🔥 NEW: Track streaming text for each model
        this.modelStartTimes = {}; // 🔥 NEW: Track when each model starts typing
    }

    async createSession() {
        try {
            console.log('📡 Skipping OpenAI models due to API key issues...');
            
            // 🎯 Use xAI and Anthropic models instead of OpenAI
            const selectedModels = [
                'xai-grok3-beta',           // xAI Grok 3 Beta
                'xai-grok3-mini-beta',      // xAI Grok 3 Mini Beta  
                'anthropic-claude35-sonnet', // Anthropic Claude 3.5 Sonnet
                'anthropic-claude35-haiku'   // Anthropic Claude 3.5 Haiku
            ];
            
            console.log(`🎯 Using non-OpenAI models: ${selectedModels.join(', ')}`);
            
            const response = await axios.post(`${BASE_URL}/sessions`, {
                selectedModels: selectedModels
            });
            this.sessionId = response.data.sessionId;
            this.totalModels = response.data.selectedModels.length; // Set total models
            console.log(`✅ Session created: ${this.sessionId}`);
            console.log(`📊 Selected ${this.totalModels} models for streaming test (no OpenAI)`);
            return true;
        } catch (error) {
            console.error('❌ Failed to create session:', error.message);
            if (error.response?.data) {
                console.error('📄 Error details:', JSON.stringify(error.response.data, null, 2));
            }
            return false;
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to WebSocket...');
            
            this.socket = io(WS_URL, {
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected');
                this.connected = true;
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection failed:', error.message);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 WebSocket disconnected');
                this.connected = false;
            });

            this.setupEventListeners();

            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);
        });
    }

    setupEventListeners() {
        this.socket.on('joined_session', (data) => {
            console.log('🏠 Joined session:', data.sessionId);
        });

        this.socket.on('left_session', (data) => {
            console.log('🚪 Left session:', data.sessionId);
        });

        this.socket.on('prompt_received', (data) => {
            console.log('\n📨 PROMPT RECEIVED BY SERVER');
            console.log(`   Session: ${data.sessionId}`);
            console.log(`   Prompt: "${data.prompt.substring(0, 50)}..."`);
            console.log(`   Timestamp: ${data.timestamp}`);
            console.log('🔄 Processing started... waiting for real-time character streaming\n');
            this.startTime = Date.now(); // Start timer
            this.completedModels = []; // Reset completed models
            this.modelStreams = {}; // Reset model streams
            this.modelStartTimes = {}; // Reset start times
        });

        // 🔥 NEW: TYPING INDICATORS
        this.socket.on('model_typing', (data) => {
            const elapsed = this.startTime ? Date.now() - this.startTime : 0;
            this.modelStartTimes[data.model] = elapsed;
            
            console.log('💭 TYPING INDICATOR');
            console.log(`📝 Model: ${data.model}`);
            console.log(`⏱️  Started typing after: ${elapsed}ms`);
            console.log(`🔤 Status: ${data.isTyping ? 'Started typing...' : 'Stopped typing'}`);
            console.log('---');
            
            // Initialize empty stream for this model
            this.modelStreams[data.model] = '';
        });

        // 🔥 NEW: REAL-TIME CHARACTER STREAMING
        this.socket.on('model_stream', (data) => {
            // Accumulate the streaming text
            if (!this.modelStreams[data.model]) {
                this.modelStreams[data.model] = '';
            }
            this.modelStreams[data.model] += data.chunk;
            
            const elapsed = this.startTime ? Date.now() - this.startTime : 0;
            const currentLength = this.modelStreams[data.model].length;
            
            // Show live streaming (every 50 characters or significant chunks)
            // Show streaming progress every 100 characters or on sentence endings
            if (currentLength % 100 === 0 || data.chunk.includes('.') || data.chunk.includes('!')) {
                console.log(`🔥 LIVE STREAMING: ${data.model}`);
                console.log(`📝 Current text (${currentLength} chars):`);
                console.log(`"${this.modelStreams[data.model].substring(Math.max(0, currentLength - 200))}"`);
                console.log(`⏱️  Time: ${elapsed}ms since start`);
                console.log(`📊 Progress: ${data.progress?.current || 0}/${data.progress?.total || this.totalModels} models`);
                console.log('---');
            }
        });

        // 🔥 NEW: MODEL COMPLETION (with full response)
        this.socket.on('model_complete', (data) => {
            const elapsed = this.startTime ? Date.now() - this.startTime : 0;
            const startTime = this.modelStartTimes[data.model] || 0;
            const typingDuration = elapsed - startTime;
            
            this.completedModels.push({ 
                model: data.model, 
                time: elapsed,
                startTime,
                typingDuration,
                length: data.finalResponse?.length || 0
            });
            
            console.log('✅ MODEL COMPLETED STREAMING!');
            console.log(`🤖 Model: ${data.model}`);
            console.log(`⏱️  Total time: ${data.timeTakenMs}ms (${elapsed}ms since start)`);
            console.log(`⚡ Typing duration: ${typingDuration}ms`);
            console.log(`📝 Response length: ${data.finalResponse?.length || 0} characters`);
            console.log(`💰 Cost: $${data.costEstimateUsd}`);
            
            if (data.error) {
                console.log(`❌ Error: ${data.error}`);
            } else {
                console.log(`📄 FINAL RESPONSE (last 300 chars to show completion):`);
                console.log(`"...${data.finalResponse?.slice(-300)}"`);
                console.log(`📊 Tokens: ${JSON.stringify(data.tokens)}`);
                console.log(`🔍 Verify: Streamed ${this.modelStreams[data.model]?.length || 0} chars, Final ${data.finalResponse?.length || 0} chars`);
            }
            
            console.log('---\n');
        });

        // 🎉 FINAL COMPLETION (ALL MODELS DONE)
        this.socket.on('comparison_complete', (data) => {
            const totalElapsed = this.startTime ? Date.now() - this.startTime : 0;
            
            console.log('🎊 ALL MODELS COMPLETED STREAMING!');
            console.log(`⏰ Total streaming time: ${totalElapsed}ms`);
            console.log(`📊 Models completed: ${Object.keys(data.results).length}`);
            console.log(`🆕 Streaming mode: ${data.streamingComplete ? 'YES' : 'NO'}`);
            
            const totalCost = Object.values(data.results)
                .reduce((sum, result) => sum + (result.costEstimateUsd || 0), 0);
            console.log(`💰 Total cost: $${totalCost.toFixed(6)}`);
            
            console.log('\n📈 STREAMING COMPLETION ORDER:');
            this.completedModels
                .sort((a, b) => a.time - b.time)
                .forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.model}`);
                    console.log(`     🕐 Started typing: ${item.startTime}ms`);
                    console.log(`     ⚡ Typing duration: ${item.typingDuration}ms`);
                    console.log(`     📝 Response length: ${item.length} chars`);
                    console.log(`     ⏱️  Total time: ${item.time}ms`);
                });
            
            // Show character/second rates
            console.log('\n📊 STREAMING PERFORMANCE:');
            this.completedModels.forEach(item => {
                const charsPerSecond = item.typingDuration > 0 ? (item.length / (item.typingDuration / 1000)).toFixed(1) : 'N/A';
                console.log(`  ${item.model}: ${charsPerSecond} chars/sec`);
            });
            
            this.responses.push({
                timestamp: new Date(),
                data,
                totalTime: totalElapsed,
                order: this.completedModels,
                streamingMode: true
            });
            
            console.log('\n✅ Real-time character streaming test complete!\n');
        });

        // Keep compatibility with old events
        this.socket.on('model_update', (data) => {
            console.log('🔄 [LEGACY] Model update received:', data.model);
        });

        this.socket.on('prompt_error', (error) => {
            console.error('❌ Prompt error:', error);
        });
    }

    async joinSession() {
        if (!this.sessionId) {
            throw new Error('No session ID available');
        }

        return new Promise((resolve) => {
            this.socket.emit('join_session', { sessionId: this.sessionId }); // Fixed: pass as object
            
            this.socket.once('joined_session', () => {
                resolve();
            });

            setTimeout(resolve, 2000); // Fallback timeout
        });
    }

    async submitPrompt(prompt) {
        return new Promise((resolve) => {
            console.log(`\n💭 Submitting prompt for REAL-TIME CHARACTER STREAMING: "${prompt.substring(0, 50)}..."`);
            
            const startTime = Date.now();
            
            this.socket.emit('submit_prompt', {
                sessionId: this.sessionId,
                prompt
            });

            // Wait for final completion or timeout
            const responseHandler = (data) => {
                const duration = Date.now() - startTime;
                console.log(`⚡ WebSocket final streaming response received in ${duration}ms`);
                this.socket.off('comparison_complete', responseHandler);
                resolve(data);
            };

            this.socket.on('comparison_complete', responseHandler);

            // Timeout after 60 seconds (longer for streaming)
            setTimeout(() => {
                this.socket.off('comparison_complete', responseHandler);
                resolve({ timeout: true });
            }, 60000);
        });
    }

    async runTests() {
        const testPrompts = [
            'Write a step-by-step guide to building a REST API with Node.js and Express, including authentication and database integration.', // Longer prompt for better streaming
            'Explain the differences between React hooks and class components, with detailed examples and best practices.', // Another detailed prompt
            'Create a comprehensive comparison of cloud platforms (AWS vs Azure vs GCP) for modern web applications.' // Third detailed prompt
        ];

        console.log('🎮 Starting Real-Time Character Streaming Tests\n');

        try {
            if (!(await this.createSession())) {
                return;
            }

            await this.connect();
            await this.joinSession();
            console.log('🏠 Successfully joined session via WebSocket');

            for (let i = 0; i < testPrompts.length; i++) {
                const prompt = testPrompts[i];
                console.log(`\n📝 Streaming Test ${i + 1}/${testPrompts.length}`);
                console.log(`🎯 Prompt length: ${prompt.length} characters`);
                
                await this.submitPrompt(prompt);
                
                if (i < testPrompts.length - 1) {
                    console.log('⏳ Waiting before next streaming test...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            console.log(`\n✅ All real-time streaming tests completed!`);
            console.log(`📊 Total responses received: ${this.responses.length}`);

        } catch (error) {
            console.error('❌ Streaming test failed:', error.message);
        } finally {
            if (this.socket) {
                this.socket.disconnect();
            }
        }
    }

    async cleanup() {
        if (this.socket && this.connected) {
            this.socket.emit('leave_session', { sessionId: this.sessionId });
            this.socket.disconnect();
        }
    }
}

async function performanceTest() {
    console.log('\n🏃‍♂️ Running Character Streaming Performance Test...');
    
    const tester = new WebSocketTester();
    
    try {
        await tester.createSession();
        await tester.connect();
        await tester.joinSession();

        const startTime = Date.now();
        const prompt = 'Write a detailed explanation of how JavaScript promises work, including examples of async/await, error handling, and common patterns.';
        
        console.log('⏱️  Testing streaming response time...');
        console.log(`📝 Prompt: "${prompt.substring(0, 100)}..."`);
        
        await tester.submitPrompt(prompt);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        console.log(`⚡ Total streaming time: ${totalTime}ms`);
        
        console.log('🔄 Comparing with non-streaming REST API...');
        const restStartTime = Date.now();
        
        await axios.post(`${BASE_URL}/prompts/${tester.sessionId}`, { prompt });
        
        const restEndTime = Date.now();
        const restTime = restEndTime - restStartTime;
        
        console.log(`⚡ REST API time: ${restTime}ms`);
        console.log(`📈 Streaming provides real-time feedback vs waiting ${restTime}ms`);
        
    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
    } finally {
        await tester.cleanup();
    }
}

async function main() {
    try {
        await axios.get(`${BASE_URL}/sessions`);
    } catch (error) {
        console.error('❌ Server is not running. Please start the server first.');
        process.exit(1);
    }

    const tester = new WebSocketTester();
    
    try {
        await tester.runTests();
        await performanceTest();
    } catch (error) {
        console.error('❌ Streaming test suite failed:', error.message);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Real-time streaming test failed:', error.message);
        process.exit(1);
    });
}

module.exports = WebSocketTester; 