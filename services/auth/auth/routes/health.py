from fastapi import APIRouter

router = APIRouter()


@router.get("/auth/health")
def health():
    return {"status": "ok"}
