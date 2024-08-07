# Node.js and Python LLM API

This project is a combination of a Node.js API and a Python LLM that allows users to query the LLM and receive responses.

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

API Endpoints
Request Body:
```json
{
  "model_choice": "mistral",
  "query": "what is a dragon?",
  "conversation_id": 1
}
```
Response:
```json
{
    "response": "A dragon is a mythical creature that is often depicted as a large lizard or serpent, with some variations having a humanoid form. It is known for its ability to breathe fire and is often associated with great power, wisdom, and greed."
}
```



