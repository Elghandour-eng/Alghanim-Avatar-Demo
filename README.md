# Alghanim-Avatar-Demo

This project is a demonstration of an AI-powered avatar using Node.js, Express, and various AI services.

## Features

- **AI-Powered Chat**: Integrates with Dify for natural language conversations.
- **Streaming Avatar**: Uses HeyGen for a real-time avatar experience.
- **Text-to-Speech**: Leverages Azure Speech services for voice synthesis.
- **RESTful API**: Provides a comprehensive API for managing bots, labels, and other resources.
- **Swagger Documentation**: Includes interactive API documentation.
- **Docker Support**: Comes with a `Dockerfile` and `docker-compose.yml` for easy containerization.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Docker
- Docker Compose
- MongoDB

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/alghanim-avatar-demo.git
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the project and add the following environment variables:
    ```
    AZURE_SPEECH_KEY=
    AZURE_SPEECH_REGION=
    VOICE_ID=
    FALLBACK_VOICE_ID=
    AVATAR_ID=
    HEYGEN_API_KEY=
    DIFY_API_KEY=
    DIFY_WORKFLOW_API_KEY=
    DIFY_API_ENDPOINT=
    CRON_SCHEDULE=
    INACTIVITY_THRESHOLD_MINUTES=
    PORT=
    DB_URI=
    ```

### Running the Application

#### With Docker

To start the application with Docker, run the following command:

```bash
docker-compose up
```

#### Without Docker

To start the application without Docker, run the following command:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## API Documentation

The API documentation is generated using Swagger and is available at `http://localhost:3000/api-docs`.

## API Endpoints

The following are the main API endpoints:

- **Bots**: `/api/bots`
- **Labels**: `/api/labels`
- **Dify Chat**: `/api/dify-chat`
- **HeyGen**: `/api/heygen-*`
- **Azure Speech**: `/api/speech-*`

For more details on the available endpoints and their usage, please refer to the Swagger documentation.
