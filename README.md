# Timeboxing AI

A smart AI assistant that helps you create optimized daily schedules using timeboxing principles. Generate focused daily goals and structured time blocks based on your priorities, all powered by AI.

![Timeboxing AI Demo](timeboxing-ai.gif)

**[Live Demo: timeboxing-ai.vercel.app](https://timeboxing-ai.vercel.app)**

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/timeboxing-ai.git
cd timeboxing-ai
```

2. Install dependencies:
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Configure your environment variables in the `.env` file:
```
# Required
OPENAI_API_KEY="sk-..."

# Optional - for rate limiting
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."
```

## Running the Project

Start the development server:

```bash
# Using bun (recommended)
bun dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

**Note:** This project is built with:
- Bun runtime 1.2.2
- Node.js v20.18.0

## Tech Stack

- **Framework**: Next.js 15.2.0
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Rate Limiting**: Upstash Redis
- **Calendar**: React Big Calendar
- **AI**: OpenAI models via Vercel AI SDK
- **Deployment**: Vercel

## Customization

The AI prompts that generate goals and schedules can be customized in the `src/app/actions.ts` file. The file contains server actions that interact with the AI model to generate:

1. Top daily goals based on your "North Star" and brain dump
2. Structured daily schedules following timeboxing principles

You can adjust the prompt templates and schemas to change the AI's behavior and output format.

## Contributing

Contributions are welcome! Feel free to:

1. Open issues for bugs or feature requests
2. Submit pull requests with improvements
3. Enhance the AI prompts for better results
4. Improve UI/UX or add new features

Please ensure your code follows the project's style guidelines before submitting a pull request.

## License

[MIT](LICENSE)
