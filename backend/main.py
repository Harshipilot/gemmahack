import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

ROOT_PATH = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_PATH))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes import router
from backend.scheduler import shutdown_scheduler, start_scheduler
from data.seed import main as seed_main

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_main()
    scheduler = start_scheduler()
    app.state.scheduler = scheduler
    yield
    shutdown_scheduler(scheduler)


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")

dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")
else:
    logger.warning("Frontend dist directory not found at %s", dist_dir)
