# NeMo Guardrails (RepLock)

NVIDIA [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) is installed here so AI-generated product/marketing content can be safety-checked before it ships.

## Install / reinstall

```powershell
cd tools/nemo-guardrails
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\pip.exe install -r requirements.txt
# or from source:
# .\.venv\Scripts\pip.exe install "git+https://github.com/NVIDIA-NeMo/Guardrails.git"
```

## Quick check (no API key)

Regex rails always run locally:

```powershell
.\.venv\Scripts\python.exe check_text.py --mode output --text "Earn screen time with push-ups."
```

Exit code `0` = pass, `1` = blocked.

## Full LLM self-check (optional)

```powershell
$env:OPENAI_API_KEY = "sk-..."
.\.venv\Scripts\python.exe check_text.py --llm --mode output --file path\to\draft.md
```

## What this does / does not do

- **Does:** block common unsafe patterns (secrets, under-13 targeting, medical overclaims, jailbreak phrases) and optionally LLM self-check drafts.
- **Does not:** automatically wrap Cursor agents. Run `check_text.py` on drafts you care about, or ask the agent to run it after generating marketing/legal copy.

Config lives in `config/`.
