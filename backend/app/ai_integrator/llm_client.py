"""
LogSetu — Cloud AI LLM Client
Primary: Google Gemini 3.6 Flash
Fallback: Groq (openai/gpt-oss-20b)
Provides unified text and JSON generation with automatic failover and detailed audit logging.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import (
    GEMINI_API_KEY,
    GROQ_API_KEY,
    GEMINI_MODEL,
    GROQ_MODEL,
    ANTHROPIC_API_KEY,
    OPENAI_API_KEY,
)

logger = logging.getLogger("logsetu.ai_llm_client")


def _validate_json(text: str) -> None:
    """Validate that text contains a parseable JSON object."""
    jm = re.search(r"\{[\s\S]*\}", text)
    if not jm:
        raise ValueError("Response did not contain a JSON object { ... }")
    raw = jm.group()
    try:
        json.loads(raw)
    except Exception:
        cleaned = re.sub(r',\s*([\]}])', r'\1', raw)
        json.loads(cleaned)


def call_cloud_llm(
    prompt: str,
    system_instruction: str = "",
    json_mode: bool = False,
    max_tokens: int = 2048,
    temperature: float = 0.2,
) -> tuple[str, str]:
    """
    Calls primary Cloud LLM (Gemini 3.6 Flash).
    Falls back to Groq (openai/gpt-oss-20b) if Gemini encounters an error, invalid JSON, or timeout.
    Returns: (generated_text, model_engine_label)
    """
    errors: list[str] = []

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Primary: Google Gemini 3.6 Flash
    # ─────────────────────────────────────────────────────────────────────────
    if GEMINI_API_KEY:
        try:
            logger.info("[Cloud AI: Primary] Requesting completion from Google Gemini (%s)...", GEMINI_MODEL)
            # Try google.genai client first
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=GEMINI_API_KEY)
                config = types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                if system_instruction:
                    config.system_instruction = system_instruction
                if json_mode:
                    config.response_mime_type = "application/json"

                resp = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=config,
                )
                raw_text = resp.text.strip() if resp.text else ""
                if raw_text:
                    if json_mode:
                        _validate_json(raw_text)
                    logger.info("[Cloud AI: Primary] Google Gemini (%s) responded successfully (%d chars).", GEMINI_MODEL, len(raw_text))
                    return raw_text, f"Cloud AI (Google Gemini {GEMINI_MODEL})"
            except Exception as client_err:
                logger.debug("[Cloud AI] google.genai failed, trying google.generativeai: %s", client_err)
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=GEMINI_API_KEY)
                full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                model = legacy_genai.GenerativeModel(GEMINI_MODEL)
                res = model.generate_content(full_prompt)
                raw_text = res.text.strip() if res.text else ""
                if raw_text:
                    if json_mode:
                        _validate_json(raw_text)
                    logger.info("[Cloud AI: Primary] Google Gemini (%s) responded successfully via legacy genai.", GEMINI_MODEL)
                    return raw_text, f"Cloud AI (Google Gemini {GEMINI_MODEL})"

        except Exception as e:
            err_msg = f"Gemini ({GEMINI_MODEL}) error: {str(e)}"
            logger.warning("[Cloud AI: Fallback Triggered] %s", err_msg)
            errors.append(err_msg)

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Fallback: Groq (openai/gpt-oss-20b)
    # ─────────────────────────────────────────────────────────────────────────
    if GROQ_API_KEY:
        try:
            logger.info("[Cloud AI: Fallback] Requesting completion from Groq (%s)...", GROQ_MODEL)
            from groq import Groq
            groq_client = Groq(api_key=GROQ_API_KEY)

            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"} if json_mode else None,
            )
            raw_text = completion.choices[0].message.content.strip()
            if raw_text:
                if json_mode:
                    _validate_json(raw_text)
                logger.info("[Cloud AI: Fallback] Groq (%s) responded successfully (%d chars).", GROQ_MODEL, len(raw_text))
                return raw_text, f"Cloud AI (Groq Fallback: {GROQ_MODEL})"
        except Exception as e:
            err_msg = f"Groq ({GROQ_MODEL}) error: {str(e)}"
            logger.warning("[Cloud AI] Groq fallback failed: %s", err_msg)
            errors.append(err_msg)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Fallback: OpenAI
    # ─────────────────────────────────────────────────────────────────────────
    if OPENAI_API_KEY:
        try:
            logger.info("[Cloud AI] Attempting OpenAI fallback (gpt-4o-mini)...")
            import openai
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            raw_text = completion.choices[0].message.content.strip()
            if raw_text:
                return raw_text, "Cloud AI (OpenAI gpt-4o-mini)"
        except Exception as e:
            errors.append(f"OpenAI error: {str(e)}")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Fallback: Anthropic
    # ─────────────────────────────────────────────────────────────────────────
    if ANTHROPIC_API_KEY:
        try:
            logger.info("[Cloud AI] Attempting Anthropic fallback...")
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            res = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=max_tokens,
                system=system_instruction or "",
                messages=[{"role": "user", "content": prompt}],
            )
            raw_text = res.content[0].text.strip()
            if raw_text:
                return raw_text, "Cloud AI (Anthropic Claude)"
        except Exception as e:
            errors.append(f"Anthropic error: {str(e)}")

    raise RuntimeError(f"All configured Cloud AI providers failed: {'; '.join(errors)}")
