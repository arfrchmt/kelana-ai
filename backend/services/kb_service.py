from __future__ import annotations

import json
import os
from urllib.parse import urlparse
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
MODEL_ID = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")


def get_bedrock_agent_client():
    return boto3.client(
        service_name="bedrock-agent-runtime",
        region_name=AWS_REGION,
    )


def get_bedrock_runtime_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=AWS_REGION,
    )


def build_conversation_context(messages: list[dict]) -> str:
    if not messages:
        return "No previous conversation."

    formatted_messages = []
    for message in messages:
        role = str(message.get("role", "unknown")).upper()
        content = str(message.get("content", "")).strip()
        if content:
            formatted_messages.append(f"{role}: {content}")

    return "\n".join(formatted_messages) or "No previous conversation."


def build_grounded_prompt(
    question: str,
    retrieved_texts: list[str],
    conversation_history: list[dict] | None = None,
) -> str:
    context = "\n\n---\n\n".join(retrieved_texts)
    history = build_conversation_context(conversation_history or [])
    return f"""
You are a travel assistant. Answer the user's question using the context retrieved
from the Knowledge Base and the previous conversation history from the message database.

Important instructions:
1. Always utilize the previous conversation history to understand references, follow-up questions,
   pronouns (e.g., "di sana", "itu", "tersebut", "there"), and user preferences mentioned in earlier messages.
2. Ground your factual knowledge (places, rules, facts) strictly in the retrieved Knowledge Base context.
3. If the user asks a follow-up question, answer it in direct continuation of the previous conversation.
4. If the retrieved context does not contain enough information to answer, state clearly
   what is missing based on the available knowledge.

Return only valid JSON with this shape:
{{
  "answer": "your grounded answer",
  "confidence_score": 0
}}

Set confidence_score from 0 to 100 based on how completely the retrieved
Knowledge Base context supports your answer.

Retrieved Knowledge Base Context:
{context}

Previous Conversation History (from Message database):
{history}

Current Question:
{question}
"""


def extract_retrieved_texts(response: dict) -> list[str]:
    retrieved_texts = []

    for result in response.get("retrievalResults", []):
        text = result.get("content", {}).get("text")
        if text:
            retrieved_texts.append(text)

    return retrieved_texts


def get_source_name(uri: str) -> str:
    path = urlparse(uri).path
    return path.rsplit("/", 1)[-1] or uri


def extract_sources(response: dict) -> list[dict]:
    sources = []
    seen_uris = set()

    for result in response.get("retrievalResults", []):
        metadata = result.get("metadata", {})
        uri = (
            result.get("location", {})
            .get("s3Location", {})
            .get("uri")
            or metadata.get("_source_uri")
        )

        if not uri or uri in seen_uris:
            continue

        seen_uris.add(uri)
        sources.append(
            {
                "name": metadata.get("_document_title") or get_source_name(uri),
                "uri": uri,
                "score": result.get("score"),
            }
        )

    return sources


def parse_answer_payload(text: str) -> dict:
    cleaned_text = text.strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.strip("`")
        cleaned_text = cleaned_text.removeprefix("json").strip()

    try:
        payload = json.loads(cleaned_text)
    except json.JSONDecodeError:
        return {
            "answer": text,
            "confidence_score": None,
        }

    confidence_score = payload.get("confidence_score")
    if isinstance(confidence_score, (int, float)):
        confidence_score = max(0, min(100, round(confidence_score)))
    else:
        confidence_score = None

    return {
        "answer": str(payload.get("answer", text)),
        "confidence_score": confidence_score,
    }


def ask_knowledge_base(question: str, conversation_history: list[dict] | None = None):
    if not KNOWLEDGE_BASE_ID:
        return {
            "answer": (
                "Knowledge Base is not configured. Please set KNOWLEDGE_BASE_ID "
                "in backend/.env."
            ),
            "confidence_score": None,
            "sources": [],
        }

    try:
        # Determine retrieval query, augmenting with conversation context if it's a follow-up
        retrieval_query = question
        if conversation_history:
            recent_user_texts = [
                str(m.get("content", "")).strip()
                for m in conversation_history
                if str(m.get("role", "")).lower() == "user" and m.get("content")
            ]
            if recent_user_texts:
                last_user_context = recent_user_texts[-1][:120]
                followup_indicators = [
                    "di sana", "disana", "itu", "tersebut", "mereka", "biaya",
                    "hotel", "penginapan", "transportasi", "makanan", "kuliner",
                    "rekomendasi", "bagaimana", "berapa", "kapan", "ada apa",
                ]
                is_followup = (
                    len(question.split()) < 10
                    or any(w in question.lower() for w in followup_indicators)
                )
                if is_followup:
                    retrieval_query = f"{last_user_context} {question}"[:400]

        retrieval_response = get_bedrock_agent_client().retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={"text": retrieval_query},
        )

        retrieved_texts = extract_retrieved_texts(retrieval_response)
        # Fallback to pure question if augmented query returned no texts
        if not retrieved_texts and retrieval_query != question:
            retrieval_response = get_bedrock_agent_client().retrieve(
                knowledgeBaseId=KNOWLEDGE_BASE_ID,
                retrievalQuery={"text": question},
            )
            retrieved_texts = extract_retrieved_texts(retrieval_response)

        if not retrieved_texts:
            return {
                "answer": "No relevant Knowledge Base content was found for this question.",
                "confidence_score": 0,
                "sources": [],
            }

        response = get_bedrock_runtime_client().converse(
            modelId=MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": build_grounded_prompt(
                                question,
                                retrieved_texts,
                                conversation_history,
                            ),
                        }
                    ],
                }
            ],
        )

        answer_payload = parse_answer_payload(
            response["output"]["message"]["content"][0]["text"]
        )

        return {
            "answer": answer_payload["answer"],
            "confidence_score": answer_payload["confidence_score"],
            "sources": extract_sources(retrieval_response),
        }
    except (BotoCoreError, ClientError) as error:
        return {
            "answer": (
                "Knowledge Base answer is temporarily unavailable. "
                f"Bedrock error: {error.__class__.__name__}. "
                "Please refresh your AWS credentials or bearer token, then try again."
            ),
            "confidence_score": None,
            "sources": [],
        }
    except KeyError:
        return {
            "answer": (
                "Knowledge Base answer is temporarily unavailable because Bedrock "
                "returned an unexpected response format."
            ),
            "confidence_score": None,
            "sources": [],
        }
