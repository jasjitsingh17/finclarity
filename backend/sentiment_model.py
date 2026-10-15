from functools import lru_cache

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
)


MODEL_NAME = "ProsusAI/finbert"


@lru_cache(maxsize=1)
def get_finbert():
    """
    Load FinBERT once and reuse it across
    API requests.
    """

    tokenizer = (
        AutoTokenizer.from_pretrained(
            MODEL_NAME
        )
    )

    model = (
        AutoModelForSequenceClassification
        .from_pretrained(
            MODEL_NAME
        )
    )

    model.eval()

    return tokenizer, model


def score_headlines(
    headlines,
):
    """
    Score a batch of financial headlines.

    Returns:
    positive probability
    neutral probability
    negative probability
    signed sentiment score
    dominant label
    model confidence
    """

    if not headlines:
        return []

    tokenizer, model = (
        get_finbert()
    )

    encoded = tokenizer(
        headlines,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="pt",
    )

    with torch.no_grad():

        logits = model(
            **encoded
        ).logits

        probabilities = (
            torch.softmax(
                logits,
                dim=-1,
            )
            .cpu()
            .numpy()
        )

    id_to_label = {
        int(index):
            str(label).lower()

        for index, label
        in model.config.id2label.items()
    }

    results = []

    for row in probabilities:

        probability_map = {
            id_to_label[index]:
                float(probability)

            for index, probability
            in enumerate(row)
        }

        positive = probability_map.get(
            "positive",
            0.0,
        )

        neutral = probability_map.get(
            "neutral",
            0.0,
        )

        negative = probability_map.get(
            "negative",
            0.0,
        )

        sentiment_score = (
            positive
            - negative
        )

        dominant_label = max(
            probability_map,
            key=probability_map.get,
        )

        confidence = max(
            probability_map.values()
        )

        results.append(
            {
                "positive_probability":
                    round(
                        positive,
                        6,
                    ),

                "neutral_probability":
                    round(
                        neutral,
                        6,
                    ),

                "negative_probability":
                    round(
                        negative,
                        6,
                    ),

                "sentiment_score":
                    round(
                        sentiment_score,
                        6,
                    ),

                "dominant_label":
                    dominant_label,

                "model_confidence":
                    round(
                        confidence,
                        6,
                    ),
            }
        )

    return results
