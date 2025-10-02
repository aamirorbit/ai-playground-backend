# AI Model Playground - Test Scripts

This folder contains comprehensive testing and analysis scripts for the AI Model Playground backend.

## 📁 Folder Structure

```
scripts/
├── start-server.sh           # Server startup script
├── run-all-tests.js          # Main test runner
├── tests/
│   ├── api-test.js           # API endpoint testing
│   └── websocket-test.js     # WebSocket functionality testing
├── utils/
│   └── quick-test.js         # Quick development test
├── analysis/
│   ├── response-analyzer.js  # AI response analysis
│   └── results/              # Test results storage
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Start the Server
```bash
# Make script executable (macOS/Linux)
chmod +x scripts/start-server.sh

# Start server with all checks
./scripts/start-server.sh

# Or manually
npm run start:dev
```

### 2. Quick Test
```bash
# Run a quick test to verify everything works
node scripts/utils/quick-test.js
```

### 3. Full Test Suite
```bash
# Run all tests with analysis
node scripts/run-all-tests.js
```

## 📝 Available Scripts

### Server Management

#### `start-server.sh`
Comprehensive server startup script that:
- Checks for `.env` file
- Verifies MongoDB connection
- Installs dependencies if needed
- Builds and starts the server

**Usage:**
```bash
./scripts/start-server.sh
```

### Testing Scripts

#### `run-all-tests.js`
Main test runner that executes all test suites in sequence.

**Usage:**
```bash
# Run all tests
node scripts/run-all-tests.js

# Run only API tests
node scripts/run-all-tests.js --api-only

# Run only WebSocket tests
node scripts/run-all-tests.js --websocket-only

# Run only analysis
node scripts/run-all-tests.js --analysis-only

# Skip WebSocket tests
node scripts/run-all-tests.js --skip-websocket

# Skip analysis
node scripts/run-all-tests.js --skip-analysis

# Show help
node scripts/run-all-tests.js --help
```

#### `tests/api-test.js`
Comprehensive API testing script that:
- Tests all REST endpoints
- Validates session management
- Tests prompt submission with multiple AI models
- Measures performance and costs
- Generates detailed reports

**Features:**
- Creates test sessions
- Submits various prompt types (creative, technical, problem-solving, etc.)
- Parallel model testing
- Cost and performance analysis
- Detailed reporting with JSON output

#### `tests/websocket-test.js`
**✅ TESTED & CONFIRMED** - Real-time streaming WebSocket functionality:
- Tests real-time individual model response streaming  
- Validates session joining/leaving via WebSocket
- Tests prompt submission with live progress tracking (1/3, 2/3, 3/3)
- Demonstrates model completion order (e.g., 575ms → 2761ms → 12947ms)
- Shows real-time cost updates and graceful error handling
- Compares WebSocket vs REST API performance

#### `utils/quick-test.js`
Fast development testing script for:
- Quick server health check
- Basic functionality verification
- Rapid development feedback

### Analysis Scripts

#### `analysis/response-analyzer.js`
Advanced response analysis tool that provides:
- **Quality Analysis**: Response length, word count, readability
- **Performance Analysis**: Speed ranking, reliability metrics
- **Cost Analysis**: Cost efficiency comparisons
- **Prompt Type Analysis**: Performance by prompt category
- **Recommendations**: Best model for different use cases

**Sample Output:**
```
🔬 AI Model Response Analysis Report
═══════════════════════════════════════════════════════════════

🔍 RESPONSE QUALITY ANALYSIS
🤖 OPENAI-GPT4O:
   📝 Average response length: 485 characters
   📖 Average words per response: 87
   📄 Average sentences per response: 4.2
   📚 Average words per sentence: 20.7

⚡ PERFORMANCE ANALYSIS
🏆 Reliability Ranking (by success rate):
   🥇 OPENAI-GPT4O: 100.0%
   🥈 ANTHROPIC-CLAUDE3: 100.0%
   🥉 XAI-GROK: 80.0%

💰 COST ANALYSIS
💳 Cost Ranking (total cost):
   💚 OPENAI-GPT4O: $0.001580 total
   💛 ANTHROPIC-CLAUDE3: $0.002295 total

🎯 RECOMMENDATIONS
   ⚡ For speed: Use OPENAI-GPT4O (2340ms average)
   🛡️  For reliability: Use OPENAI-GPT4O (100.0% success rate)
   💰 For cost efficiency: Use OPENAI-GPT4O (lowest total cost)
```

## 📊 Test Scenarios

The test suite covers various scenarios:

### Prompt Types
1. **Creative Writing**: Tests creative capabilities
2. **Technical Explanation**: Tests technical knowledge
3. **Problem Solving**: Tests reasoning abilities
4. **Code Generation**: Tests programming assistance
5. **Analysis Tasks**: Tests analytical thinking

### API Coverage
- ✅ Session creation and management
- ✅ Model selection validation
- ✅ Prompt submission and validation
- ✅ Parallel model processing
- ✅ Error handling and recovery
- ✅ History retrieval
- ✅ WebSocket real-time communication

### Performance Metrics
- Response time per model
- Token usage and costs
- Success/failure rates
- Words per second generation
- Cost per successful response

## 🔧 Configuration

### Environment Variables
Make sure your `.env` file contains:
```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
XAI_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/ai-playground
```

### Test Configuration
You can modify test parameters in the script files:
- `BASE_URL`: Server URL (default: http://localhost:3000)
- `TEST_PROMPTS`: Array of test prompts in api-test.js
- `TIMEOUT`: Request timeout values

## 📁 Results

Test results are stored in `scripts/analysis/results/`:
- `test-report-{timestamp}.json`: Detailed test results
- Includes all response data, performance metrics, and analysis

## 🔍 Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   ❌ Server is not running. Please start the server first
   ```
   **Solution:** Run `./scripts/start-server.sh` or `npm run start:dev`

2. **Missing API keys**
   ```bash
   ❌ API error: Invalid API key
   ```
   **Solution:** Check your `.env` file and API key validity

3. **MongoDB connection error**
   ```bash
   ❌ MongoDB connection failed
   ```
   **Solution:** Ensure MongoDB is running: `mongod` or use cloud MongoDB

4. **Script permission denied**
   ```bash
   chmod +x scripts/start-server.sh
   ```

### Debug Mode
Add debug logging by setting environment variable:
```bash
DEBUG=* node scripts/run-all-tests.js
```

## 🚀 Integration

### CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Run AI Playground Tests
  run: |
    npm install
    node scripts/run-all-tests.js --skip-websocket
```

### Development Workflow
1. Make code changes
2. Run quick test: `node scripts/utils/quick-test.js`
3. If passing, run full suite: `node scripts/run-all-tests.js`
4. Review analysis report for performance insights

## 📈 Extending Tests

### Adding New Test Scenarios
1. Add new prompts to `TEST_PROMPTS` array in `api-test.js`
2. Include prompt type and description
3. Update analysis categories if needed

### Adding New Models
1. Update model arrays in test scripts
2. Add cost estimation logic
3. Update analysis to include new models

### Custom Analysis
Extend `response-analyzer.js` to add:
- Custom quality metrics
- Industry-specific analysis
- Comparative benchmarking

## 🎯 Best Practices

1. **Run tests regularly** during development
2. **Monitor costs** especially when testing with real API keys
3. **Review analysis reports** for optimization opportunities
4. **Keep test data** for historical comparison
5. **Use quick test** for rapid iteration
6. **Full test suite** before releases

## 📞 Support

If you encounter issues:
1. Check server logs: `npm run start:dev`
2. Verify API keys are valid and have sufficient credits
3. Ensure MongoDB is accessible
4. Review network connectivity
5. Check the main README.md for additional troubleshooting 