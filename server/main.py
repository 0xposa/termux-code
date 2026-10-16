import os
import sys
import shutil
import asyncio
import json
import logging
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .pty_manager import PtySession
from . import file_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("termux_code")

app = FastAPI(title="Termux Code Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workspace root default to HOME
BASE_WORKSPACE = os.environ.get("HOME", "/data/data/com.termux/files/home")
PROJECT_ROOT = os.environ.get(
    "PROJECT_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)

class SaveFileRequest(BaseModel):
    path: str
    content: str

class CreateEntryRequest(BaseModel):
    path: str
    isDir: bool = False

class DeleteEntryRequest(BaseModel):
    path: str

class RenameEntryRequest(BaseModel):
    srcPath: str
    dstPath: str

class DuplicateEntryRequest(BaseModel):
    path: str

@app.get("/api/status")
async def get_status():
    installed_agents = {}
    for agent in ["antigravity-cli", "claude", "opencode", "aider", "git"]:
        bin_path = shutil.which(agent)
        installed_agents[agent] = {
            "installed": bin_path is not None,
            "path": bin_path
        }
        
    return {
        "status": "online",
        "home": BASE_WORKSPACE,
        "workspace": BASE_WORKSPACE,
        "project": PROJECT_ROOT,
        "projectName": os.path.basename(PROJECT_ROOT),
        "agents": installed_agents,
        "python": sys.version.split()[0],
        "node": shutil.which("node") is not None
    }

@app.get("/api/projects")
async def list_projects():
    projects_dir = os.path.join(BASE_WORKSPACE, "projects")
    projects = []
    
    # Always include active project first
    projects.append({
        "name": os.path.basename(PROJECT_ROOT),
        "path": PROJECT_ROOT,
        "isCurrent": True
    })
    
    if os.path.exists(projects_dir) and os.path.isdir(projects_dir):
        try:
            for entry in sorted(os.scandir(projects_dir), key=lambda e: e.name.lower()):
                if entry.is_dir() and not entry.name.startswith("."):
                    if os.path.abspath(entry.path) != os.path.abspath(PROJECT_ROOT):
                        projects.append({
                            "name": entry.name,
                            "path": entry.path,
                            "isCurrent": False
                        })
        except Exception as e:
            logger.warning(f"Error scanning projects dir: {e}")
            
    return {"projects": projects, "current": PROJECT_ROOT}

@app.get("/api/files/tree")
async def get_tree(path: Optional[str] = None, depth: int = Query(default=1, ge=1, le=3)):
    default_root = PROJECT_ROOT if os.path.exists(PROJECT_ROOT) else BASE_WORKSPACE
    target_path = path if path and os.path.exists(path) else default_root
    depth_val = depth if isinstance(depth, int) else 1
    try:
        items = file_manager.list_directory(target_path, depth=depth_val)
        return {"currentPath": target_path, "items": items}
    except Exception as e:
        logger.error(f"Error listing tree: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/content")
async def get_content(path: str):
    if not path or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data = file_manager.read_file(path)
        return data
    except Exception as e:
        logger.error(f"Error reading file {path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/save")
async def save_content(req: SaveFileRequest):
    try:
        file_manager.write_file(req.path, req.content)
        return {"status": "ok", "path": req.path}
    except Exception as e:
        logger.error(f"Error saving file {req.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/create")
async def create_file_or_dir(req: CreateEntryRequest):
    try:
        file_manager.create_entry(req.path, req.isDir)
        return {"status": "ok", "path": req.path}
    except Exception as e:
        logger.error(f"Error creating entry {req.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/delete")
async def delete_file_or_dir(req: DeleteEntryRequest):
    try:
        file_manager.delete_entry(req.path)
        return {"status": "ok", "path": req.path}
    except Exception as e:
        logger.error(f"Error deleting entry {req.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/rename")
async def rename_file_or_dir(req: RenameEntryRequest):
    try:
        file_manager.rename_entry(req.srcPath, req.dstPath)
        return {"status": "ok", "srcPath": req.srcPath, "dstPath": req.dstPath}
    except Exception as e:
        logger.error(f"Error renaming {req.srcPath} to {req.dstPath}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/duplicate")
async def duplicate_file_or_dir(req: DuplicateEntryRequest):
    try:
        new_path = file_manager.duplicate_entry(req.path)
        return {"status": "ok", "newPath": new_path}
    except Exception as e:
        logger.error(f"Error duplicating {req.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/upload")
async def upload_files(
    targetDir: str = Form(...),
    files: List[UploadFile] = File(...)
):
    resolved_dir = targetDir.strip() if targetDir else ""
    if not resolved_dir or not os.path.isdir(resolved_dir):
        resolved_dir = PROJECT_ROOT if os.path.exists(PROJECT_ROOT) else BASE_WORKSPACE

    uploaded = []
    for f in files:
        safe_filename = os.path.basename(f.filename or "uploaded_file")
        destination = os.path.join(resolved_dir, safe_filename)
        try:
            content = await f.read()
            with open(destination, "wb") as out:
                out.write(content)
            uploaded.append({
                "name": safe_filename,
                "path": destination,
                "size": len(content)
            })
        except Exception as e:
            logger.error(f"Error saving uploaded file {safe_filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save {safe_filename}: {str(e)}")

    return {"status": "ok", "targetDir": resolved_dir, "uploaded": uploaded}

@app.websocket("/ws/terminal")
async def terminal_websocket(websocket: WebSocket, cwd: Optional[str] = None):
    await websocket.accept()
    
    # Initialize PTY session with specified cwd or BASE_WORKSPACE
    initial_cwd = cwd if (cwd and os.path.isdir(cwd)) else BASE_WORKSPACE
    pty_session = PtySession(cols=80, rows=24, cwd=initial_cwd)
    try:
        pty_session.start()
    except Exception as e:
        logger.error(f"Failed to start PTY session: {e}")
        await websocket.send_text(f"\r\n\x1b[31m[Error starting terminal shell: {e}]\x1b[0m\r\n")
        await websocket.close()
        return

    # Asynchronous task for reading from master_fd and forwarding to client
    import time
    last_reported_cwd = None
    send_lock = asyncio.Lock()

    async def safe_send(msg_dict: dict):
        async with send_lock:
            try:
                await websocket.send_text(json.dumps(msg_dict))
            except Exception:
                pass

    async def notify_cwd_if_changed(force: bool = False):
        nonlocal last_reported_cwd
        if not pty_session.alive:
            return
        current_cwd = pty_session.get_cwd()
        if current_cwd and (force or current_cwd != last_reported_cwd):
            last_reported_cwd = current_cwd
            await safe_send({"type": "cwd", "cwd": current_cwd})

    async def pty_read_loop():
        last_cwd_check = 0.0

        # Send initial cwd immediately
        await notify_cwd_if_changed(force=True)

        try:
            while pty_session.alive:
                now = time.monotonic()
                if now - last_cwd_check >= 0.15:
                    last_cwd_check = now
                    await notify_cwd_if_changed()

                # Non-blocking poll
                data = pty_session.read(4096)
                if data:
                    await safe_send({"type": "output", "data": data})
                else:
                    await asyncio.sleep(0.015)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in pty_read_loop: {e}")

    read_task = asyncio.create_task(pty_read_loop())

    async def delayed_cwd_check(delay: float):
        await asyncio.sleep(delay)
        await notify_cwd_if_changed()

    try:
        while True:
            message_raw = await websocket.receive_text()
            try:
                msg = json.loads(message_raw)
                msg_type = msg.get("type")
                if msg_type == "input":
                    input_data = msg.get("data", "")
                    pty_session.write(input_data)
                    # When Enter is pressed (e.g. cd command), schedule quick cwd checks
                    if "\r" in input_data or "\n" in input_data:
                        asyncio.create_task(delayed_cwd_check(0.05))
                        asyncio.create_task(delayed_cwd_check(0.20))
                elif msg_type == "resize":
                    cols = int(msg.get("cols", 80))
                    rows = int(msg.get("rows", 24))
                    pty_session.resize(cols, rows)
                elif msg_type == "get_cwd":
                    await notify_cwd_if_changed(force=True)
            except json.JSONDecodeError:
                # Direct raw text
                pty_session.write(message_raw)
                if "\r" in message_raw or "\n" in message_raw:
                    asyncio.create_task(delayed_cwd_check(0.05))
                    asyncio.create_task(delayed_cwd_check(0.20))
    except WebSocketDisconnect:
        logger.info("Terminal WebSocket disconnected")
    except Exception as e:
        logger.warning(f"Terminal WebSocket error: {e}")
    finally:
        read_task.cancel()
        pty_session.close()

# Mount frontend web assets
WEB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web"))
if os.path.exists(WEB_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")

def run(host: str = "0.0.0.0", port: int = 8088):
    import uvicorn
    print(f"\n=======================================================")
    print(f"🚀 Termux Code Server running at http://localhost:{port}")
    print(f"📁 Workspace: {BASE_WORKSPACE}")
    print(f"=======================================================\n")
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8088"))
    host = os.environ.get("HOST", "0.0.0.0")
    run(host=host, port=port)
