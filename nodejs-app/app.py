import sys
import json
import os
import sqlite3
from langchain.prompts import PromptTemplate
from langchain.llms import CTransformers

class LLMInteraction:
    def __init__(self, db_path='database.sqlite'):
        self.model = None
        self.db_path = db_path

    def connect_db(self):
        return sqlite3.connect(self.db_path)

    def select_model(self, model_choice):
        if model_choice == "llama":
            self.model = CTransformers(
                model='models/llama-2-7b-chat.ggmlv3.q2_K.bin',
                model_type='llama',
                config={'max_new_tokens': 100, 'temperature': 0.1}
            )
        elif model_choice == "mistral":
            self.model = CTransformers(
                model='models/mistral-7b-instruct-v0.2-code-ft.Q2_K.gguf',
                model_type='mistral',
                config={'max_new_tokens': 100, 'temperature': 0.1}
            )
        else:
            raise ValueError("Invalid model choice. Please choose llama or mistral.")
        sys.stderr.write("Model loaded successfully.\n")

    def get_conversation_history(self, conversation_id):
        with self.connect_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT conversation_id, user_content, ai_content FROM messages WHERE conversation_id = ? ORDER BY timestamp', (conversation_id,))
            rows = cursor.fetchall()
        history = [{"human": row[1], "ai": row[2]} for row in rows]
        return history

    def get_llm_response(self, input_text, conversation_history):
        context = "\n".join([f"Human: {msg['human']}\nAI: {msg['ai']}" for msg in conversation_history[-5:]])  # Limited to last 5 interactions
        template = f"""
        You are a helpful AI assistant. Your task is to respond directly and concisely to the human's current question, using the conversation history for context if necessary. Do not generate any follow-up questions, additional dialogue, or content beyond answering the current question.

        Conversation history (for context only):
        {context}

        Human: {input_text}
        AI: """

        prompt = PromptTemplate(input_variables=["input_text"], template=template)
        response = self.model(prompt.format(input_text=input_text))
        return self.clean_response(response)

    def clean_response(self, response):
        cleaned = response.split('\n')[0].strip() 
        cleaned = cleaned.lstrip('AI:').strip()  
        return cleaned

    def send_query(self, query, conversation_history):
        response = self.get_llm_response(query, conversation_history)
        conversation_history.append({"human": query, "ai": response})
        return response, conversation_history

    def process_json_input(self, json_input):
        try:
            data = json_input
            model_choice = data.get('model_choice')
            query = data.get('query')
            conversation_id = data.get('conversation_id')
            if not model_choice or not query or conversation_id is None:
                raise ValueError("JSON input must contain 'model_choice', 'query', and 'conversation_id' fields.")

            if not self.model or model_choice != getattr(self, 'current_model_choice', None):
                self.select_model(model_choice)
                self.current_model_choice = model_choice

            conversation_history = self.get_conversation_history(conversation_id)
            response, updated_history = self.send_query(query, conversation_history)

            return json.dumps({
                "response": response,
            })

        except json.JSONDecodeError:
            return json.dumps({"error": "Invalid JSON input"})
        except ValueError as e:
            return json.dumps({"error": str(e)})
        except Exception as e:
            return json.dumps({"error": f"An unexpected error occurred: {str(e)}"})

if __name__ == "__main__":
    llm_interaction = LLMInteraction()
    
    # Read JSON input from stdin
    input_data = sys.stdin.read()
    try:
        json_input = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)
    result = llm_interaction.process_json_input(json_input)
    print(result)  
