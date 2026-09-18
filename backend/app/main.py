from fastapi import FastAPI

app = FastAPI(title="AM&POP API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "am-pop-api"}
