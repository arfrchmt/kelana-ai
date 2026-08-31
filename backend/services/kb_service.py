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


def build_grounded_prompt(question: str, retrieved_texts: list[str]) -> str:
    context = "\n\n---\n\n".join(retrieved_texts)
    return f"""
You are a travel assistant. Answer the user's question using only the context
retrieved from the Knowledge Base.

If the context does not contain enough information, say that you do not have
enough information in the Knowledge Base to answer confidently.

Return only valid JSON with this shape:
{{
  "answer": "your grounded answer",
  "confidence_score": 0
}}

Set confidence_score from 0 to 100 based on how completely the retrieved
Knowledge Base context supports your answer.

Context:
{context}

Question:
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


def ask_knowledge_base(question: str):
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
                            "text": build_grounded_prompt(question, retrieved_texts),
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
