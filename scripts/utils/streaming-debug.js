#!/usr/bin/env node

const { io } = require('socket.io-client');
const axios = require('axios');

const WS_URL = 'http://localhost:3000';
const BASE_URL = 'http://localhost:3000';

async function debugStreamingCall() {
    console.log('🔍 DEBUGGING: Testing if streaming method is called...\n');
    
    try {
        // Create session with non-OpenAI models
        const selectedModels = ['anthropic-claude35-haiku'];
        
        const response = await axios.post(`${BASE_URL}/sessions`, {
            selectedModels: selectedModels
        });
        
        const sessionId = response.data.sessionId;
        console.log(`✅ Session created: ${sessionId}`);
        
        // Connect to WebSocket
        const socket = io(WS_URL);
        
        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            
            // Join session
            socket.emit('join_session', { sessionId });
            
            // Submit prompt via WebSocket (should trigger streaming method)
            console.log('💭 Submitting prompt via WebSocket...');
            console.log('🔍 WATCH SERVER LOGS for: "🔥🔥🔥 STREAMING METHOD CALLED!" message\n');
            
            socket.emit('submit_prompt', {
                sessionId,
                prompt: 'Say hello in exactly 3 words.'
            });
        });
        
        socket.on('comparison_complete', (data) => {
            console.log('✅ Response received');
            socket.disconnect();
            process.exit(0);
        });
        
        socket.on('prompt_error', (error) => {
            console.error('❌ Error:', error);
            socket.disconnect();
            process.exit(1);
        });
        
        // Timeout
        setTimeout(() => {
            console.log('⏰ Timeout reached');
            socket.disconnect();
            process.exit(0);
        }, 15000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

debugStreamingCall(); 