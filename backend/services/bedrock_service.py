from dotenv import load_dotenv
import boto3
import os
from pathlib import Path
from botocore.exceptions import BotoCoreError, ClientError

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
MODEL_ID: str = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")
TEXT_PLANNER_PROMPT = """
You are an experienced travel planner.

Create a practical, enjoyable travel itinerary based on the user's destination,
trip duration, budget, and travel style.

Your recommendation should include:
1. A short overview of the trip.
2. A day-by-day itinerary with morning, afternoon, and evening activities.
3. Recommended places to visit.
4. Local food recommendations, including must-try dishes and suitable restaurants or food areas.
5. Transportation recommendations.
6. Budget guidance in USD.
7. Useful travel tips for the destination.

Keep the plan realistic, well-paced, and suitable for the given travel style.
Avoid overly expensive suggestions unless the travel style or budget supports it.
Write the response in a clear and friendly tone. Give the answer with markdown format.
"""


def get_bedrock_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=AWS_REGION
    )


def build_travel_prompt(destination, days, budget, travel_style):
    return f"""
{TEXT_PLANNER_PROMPT}

User trip details:
- Destination: {destination}
- Days: {days}
- Budget: USD {budget}
- Travel Style: {travel_style}
"""


def get_ai_recomendation(destination, days, budget, travel_style):
    prompt = build_travel_prompt(destination, days, budget, travel_style)

    try:
        response = get_bedrock_client().converse(
            modelId=MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        )

        return response["output"]["message"]["content"][0]["text"]
    except (BotoCoreError, ClientError) as error:
        return (
            "AI recommendation is temporarily unavailable. "
            f"Bedrock error: {error.__class__.__name__}. "
            "Please refresh your AWS credentials or bearer token, then try again."
        )
    except KeyError:
        return (
            "AI recommendation is temporarily unavailable because Bedrock returned "
            "an unexpected response format."
        )


# Create the Bedrock Runtime client
client = get_bedrock_client()
