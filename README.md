# Node.js and Python LLM API

This project is a combination of a Node.js API and a Python LLM that allows users to query the LLM and receive responses based on previous conversations.

## Prerequisites

- Docker and Docker Compose installed on your system

## Getting Started

1. **Clone the repository**:

```bash
git clone https://github.com/kchaitanya954/LLM-ChatBot
cd LLM-ChatBot
```

2. **Build and run the Docker containers**:
```bash
docker-compose up --build
```
This command will build the Docker images and start the containers.

3. **The Node.js API will be accessible at http://localhost:3000.**

## API Endpoints
### POST /query
API to send queries.
Request Body:
```json
{
  "model_choice": "llama", //model name either mistral or llama
  "query": "what is a dragon?", // any query can be asked
  "conversation_id": 1 // to continue conversation the conversation_id must be the same. If its changed, new conversation begings with the bot
}
```
Response:
```json
{
    "response": "Based on popular culture, a dragon is a legendary creature that is often depicted as a large, fire-breathing reptile or bird with wings. In some cultures, dragons are seen as symbols of power and strength, while in others they are feared as monsters to be avoided."
}
```

### GET /conversations
API to fetch the latest 10 previous conversations from all chats sorted by time
Response:
```json
[
    {
        "id": 3,
        "conversation_id": 2,
        "timestamp": "2024-08-07 01:48:06",
        "user_content": "what is the composition of water?",
        "ai_content": "Water is composed of two hydrogen atoms and one oxygen atom (in terms of elemental composition). Chemically speaking, it's H2O."
    },
    {
        "id": 2,
        "conversation_id": 1,
        "timestamp": "2024-08-07 01:44:31",
        "user_content": "can you give some examples from cartoons?",
        "ai_content": "Of course! Many cartoons feature dragons as central characters or supporting characters. Here are a few examples: Dragon Tales, The Dragon Pri"
    },
    {
        "id": 1,
        "conversation_id": 1,
        "timestamp": "2024-08-07 01:42:54",
        "user_content": "what is a dragon?",
        "ai_content": "Based on popular culture, a dragon is a legendary creature that is often depicted as a large, fire-breathing reptile or bird with wings. In some cultures, dragons are seen as symbols of power and strength, while in others they are feared as monsters to be avoided."
    }
]
```
### GET /conversations/{conversation_id}
API to fetch all the previous conversations from a particular conversation_id sorted by time
Response:
```json
[
    {
        "user_content": "what is a dragon?",
        "ai_content": "Based on popular culture, a dragon is a legendary creature that is often depicted as a large, fire-breathing reptile or bird with wings. In some cultures, dragons are seen as symbols of power and strength, while in others they are feared as monsters to be avoided.",
        "timestamp": "2024-08-07 01:42:54"
    },
    {
        "user_content": "can you give some examples from cartoons?",
        "ai_content": "Of course! Many cartoons feature dragons as central characters or supporting characters. Here are a few examples: Dragon Tales, The Dragon Pri",
        "timestamp": "2024-08-07 01:44:31"
    }
]
```


