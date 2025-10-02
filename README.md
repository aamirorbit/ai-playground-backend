<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# AI Model Playground Server

A NestJS backend service that compares responses from multiple AI models (OpenAI GPT-4o, Anthropic Claude 3, and xAI Grok) in parallel. The service provides session management, real-time WebSocket updates, and comprehensive comparison analytics.

## Features

- **Session Management**: Create sessions with selected AI models
- **Parallel Model Comparison**: Submit prompts to multiple AI models simultaneously
- **Real-time Updates**: WebSocket support for live response streaming
- **Cost Analysis**: Token usage and cost estimation for each model
- **MongoDB Persistence**: Store sessions and comparison results
- **Comprehensive API**: RESTful endpoints for all operations
- **Error Handling**: Graceful handling of API failures with partial results

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- API keys for:
  - OpenAI (GPT-4o access)
  - Anthropic (Claude 3 access)
  - xAI (Grok access)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
XAI_API_KEY=your_xai_api_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/ai-playground

# Application
PORT=3000
NODE_ENV=development
```

3. **Start MongoDB:**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud service
```

4. **Run the application:**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000` with WebSocket support.

## API Documentation

### Session Management

#### Create Session
```http
POST /sessions
Content-Type: application/json

{
  "selectedModels": ["openai-gpt4o", "anthropic-claude3", "xai-grok"]
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "selectedModels": ["openai-gpt4o", "anthropic-claude3", "xai-grok"],
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

#### Get Session
```http
GET /sessions/{sessionId}
```

#### End Session
```http
DELETE /sessions/{sessionId}
```

#### Get Active Sessions
```http
GET /sessions
```

### Prompt Submission

#### Submit Prompt for Comparison
```http
POST /prompts/{sessionId}
Content-Type: application/json

{
  "prompt": "Explain quantum computing in simple terms"
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Explain quantum computing in simple terms",
  "results": {
    "openai": {
      "response": "Quantum computing is...",
      "tokens": {
        "prompt_tokens": 8,
        "completion_tokens": 150,
        "total_tokens": 158
      },
      "timeTakenMs": 2340,
      "costEstimateUsd": 0.00158
    },
    "anthropic": {
      "response": "Quantum computing represents...",
      "tokens": {
        "prompt_tokens": 8,
        "completion_tokens": 145,
        "total_tokens": 153
      },
      "timeTakenMs": 2890,
      "costEstimateUsd": 0.002295
    },
    "xai": {
      "error": "Rate limit exceeded"
    }
  },
  "createdAt": "2024-01-01T12:05:00.000Z"
}
```

### History

#### Get Global History
```http
GET /prompts/history?limit=10
```

#### Get Session History
```http
GET /prompts/sessions/{sessionId}/history?limit=20
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:3000`

### Client Events

#### Join Session
```javascript
socket.emit('join_session', { sessionId: 'your-session-id' });
```

#### Submit Prompt (Alternative to REST API)
```javascript
socket.emit('submit_prompt', { 
  sessionId: 'your-session-id', 
  prompt: 'Your question here' 
});
```

#### Leave Session
```javascript
socket.emit('leave_session', { sessionId: 'your-session-id' });
```

### Server Events

#### Response Received
```javascript
socket.on('new_response', (data) => {
  console.log('Comparison result:', data);
});
```

#### Model Updates (Individual model completion)
```javascript
socket.on('model_update', (data) => {
  console.log('Model completed:', data.model, data);
});
```

#### Errors
```javascript
socket.on('prompt_error', (error) => {
  console.error('Prompt processing error:', error);
});
```

## Database Schema

### Session Schema
```javascript
{
  sessionId: String (UUID),
  selectedModels: [String], // Array of AIModel enum values
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Prompt Comparison Schema
```javascript
{
  sessionId: String,
  prompt: String,
  results: {
    openai?: {
      response?: String,
      error?: String,
      tokens?: {
        prompt_tokens: Number,
        completion_tokens: Number,
        total_tokens: Number
      },
      timeTakenMs: Number,
      costEstimateUsd: Number
    },
    anthropic?: { /* same structure */ },
    xai?: { /* same structure */ }
  },
  modelsUsed: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## 🤖 Available AI Models

Access comprehensive model information via the `/models` API endpoint. All models are available for session-based comparison.

### 🚀 OpenAI Models

| Model ID | Name | Cost (per 1K tokens) | Context Window | Capabilities |
|----------|------|---------------------|----------------|--------------|
| `openai-gpt4o` | GPT-4o | $0.010 | 128K | Text, Vision, Function Calling |
| `openai-gpt4o-mini` | GPT-4o Mini | $0.00015 | 128K | Text, Vision, Function Calling |


### 🧠 Anthropic Models

| Model ID | Name | Cost (per 1K tokens) | Context Window | Capabilities |
|----------|------|---------------------|----------------|--------------|
| `anthropic-claude35-sonnet` | Claude 3.5 Sonnet | $0.003 | 200K | Text, Vision, Analysis |
| `anthropic-claude35-haiku` | Claude 3.5 Haiku | $0.00025 | 200K | Text, Vision, Fast Responses |
| `anthropic-claude37-sonnet` | Claude 3.7 Sonnet | $0.004 | 200K | Text, Vision, Extended Thinking |
| `anthropic-claude4-sonnet` | Claude 4 Sonnet | $0.005 | 200K | Text, Vision, Advanced Reasoning |
| `anthropic-claude4-opus` | Claude 4 Opus | $0.015 | 200K | Text, Vision, Complex Analysis |

### 🚀 xAI Models

| Model ID | Name | Cost (per 1K tokens) | Context Window | Capabilities |
|----------|------|---------------------|----------------|--------------|
| `xai-grok2` | Grok 2 | $0.002 | 131K | Text, Real-time Info |
| `xai-grok3-beta` | Grok 3 Beta | $0.002 | 131K | Reasoning, Mathematics, Coding |
| `xai-grok3-mini-beta` | Grok 3 Mini Beta | $0.0002 | 131K | Real-time, Cost Efficient |
| `xai-grok4` | Grok 4 | $0.002 | 256K | Advanced Reasoning, Tool Use |

### 📊 Model Selection Guide

**For Cost Efficiency:**
- `openai-gpt4o-mini` - Best overall value
- `anthropic-claude35-haiku` - Fastest responses
- `xai-grok3-mini-beta` - Most economical

**For Advanced Reasoning:**

- `anthropic-claude4-opus` - Deep analysis
- `xai-grok4` - Latest reasoning capabilities

**For Speed:**
- `anthropic-claude35-haiku` - Ultra-fast responses
- `openai-gpt4o-mini` - Quick and reliable
- `xai-grok3-mini-beta` - Real-time responses

### 🔍 Model Discovery API

Explore available models programmatically:

```bash
# Get all models
curl http://localhost:3000/models

# Get models grouped by provider
curl http://localhost:3000/models/grouped

# Get model statistics
curl http://localhost:3000/models/stats

# Get models by capability
curl http://localhost:3000/models/capabilities
```

### Error Handling

The service implements graceful error handling:
- Individual model failures don't block other models
- Partial results are returned when some models fail
- Detailed error messages for troubleshooting
- Automatic retry logic for transient failures

## Testing

### Automated Testing

We provide comprehensive test scripts in the `scripts/` folder:

#### Quick Test
```bash
# Quick health check and basic functionality test
npm run test:playground:quick
```

#### Full Test Suite
```bash
# Run all tests (API, WebSocket, Analysis)
npm run test:playground

# Run only API tests
npm run test:playground:api

# Run only WebSocket tests
npm run test:playground:ws

# Analyze previous test results
npm run analyze
```

#### Manual API Testing

1. **Create a session:**
```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"selectedModels": ["openai-gpt4o", "anthropic-claude3"]}'
```

2. **Submit a prompt:**
```bash
curl -X POST http://localhost:3000/prompts/YOUR_SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the meaning of life?"}'
```

3. **Check history:**
```bash
curl http://localhost:3000/prompts/history?limit=5
```

### WebSocket Testing

Use a WebSocket client or browser console:
```javascript
const socket = io('http://localhost:3000');

socket.emit('join_session', { sessionId: 'your-session-id' });

socket.on('new_response', (data) => {
  console.log('Response received:', data);
});

socket.emit('submit_prompt', { 
  sessionId: 'your-session-id', 
  prompt: 'Hello, AI models!' 
});
```

## Architecture

```
src/
├── config/           # Configuration management
├── common/
│   └── dto/         # Data Transfer Objects and validation
├── database/
│   └── schemas/     # MongoDB schemas
├── sessions/        # Session management module
├── prompts/         # Prompt comparison module
├── models/          # AI service integrations
│   ├── openai.service.ts
│   ├── anthropic.service.ts
│   └── xai.service.ts
├── websocket/       # Real-time communication
└── main.ts          # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `XAI_API_KEY` | xAI API key | Required |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ai-playground` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

## Development

### Available Scripts

### Development Scripts
```bash
# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Lint code
npm run lint
```

### Testing Scripts
```bash
# Quick functionality test
npm run test:playground:quick

# Full AI playground test suite
npm run test:playground

# API tests only
npm run test:playground:api

# WebSocket tests only
npm run test:playground:ws

# Analyze test results
npm run analyze

# Traditional unit tests
npm run test

# End-to-end tests
npm run test:e2e
```

## 🧪 Test Scripts and Analysis

The `scripts/` folder contains comprehensive testing and analysis tools:

### 📊 What the Tests Cover
- **API Functionality**: Session management, prompt submission, history retrieval
- **AI Model Integration**: OpenAI GPT-4o, Anthropic Claude 3, xAI Grok testing
- **WebSocket Communication**: Real-time prompt submission and response streaming  
- **Performance Analysis**: Response time, token usage, cost estimation
- **Quality Metrics**: Response length, readability, success rates
- **Error Handling**: API failures, timeout handling, partial results

### 🎯 Test Scenarios
The automated tests include diverse prompt types:
- **Creative Writing**: Story generation, creative tasks
- **Technical Explanation**: Complex concept explanations
- **Problem Solving**: Logic and reasoning challenges  
- **Code Generation**: Programming assistance tests
- **Analysis Tasks**: Comparative analysis, research tasks

### 📈 Analysis Reports
After running tests, you get detailed analysis including:
- Model performance rankings (speed, reliability, cost)
- Quality metrics (response length, words per minute)
- Cost efficiency analysis ($/response, tokens per dollar)
- Recommendations for different use cases
- Historical performance tracking

### 🚀 Getting Started with Tests
```bash
# 1. Start the server
npm run start:dev

# 2. Run quick test to verify setup
npm run test:playground:quick

# 3. Run full test suite (requires valid API keys)
npm run test:playground

# 4. Analyze results
npm run analyze
```

For detailed documentation on all test scripts, see [`scripts/README.md`](scripts/README.md).

### Adding New AI Models

1. Create a new service in `src/models/`
2. Add the model to `AIModel` enum in `session.schema.ts`
3. Update the prompts service to include the new model
4. Add cost estimation for the new model

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` environment variable
   - Verify network connectivity

2. **API Key Errors**
   - Verify all API keys are correctly set
   - Check API key permissions and quotas
   - Ensure keys are not expired

3. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify WebSocket client compatibility
   - Check firewall settings

4. **Rate Limiting**
   - Monitor API usage quotas
   - Implement exponential backoff
   - Consider upgrading API plans

### Logs

The application provides detailed logging:
- Session creation/management
- Prompt processing progress
- API call timing and costs
- Error details and stack traces

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
