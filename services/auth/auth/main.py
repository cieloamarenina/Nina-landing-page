import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.codes import cleanup_old_codes
from auth.config import get_settings
from auth.db import init_db
from auth.routes import auth as auth_routes
from auth.routes import health


async def _cleanup_loop(db_path: str):
    while True:
        try:
            cleanup_old_codes(db_path, older_than_seconds=3600)
        except Exception:
            pass
        await asyncio.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.sqlite_path)
    cleanup_task = asyncio.create_task(_cleanup_loop(settings.sqlite_path))
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="NLVC Chat Auth", lifespan=lifespan)


def _allowed_origin() -> str:
    try:
        return get_settings().allowed_origin
    except Exception:
        return "https://ninalearnsvibecoding.com"


app.add_middleware(
    CORSMiddleware,
    allow_origins=[_allowed_origin()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health.router)
app.include_router(auth_routes.router)
