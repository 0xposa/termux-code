import os
import shutil
from typing import List, Dict, Any, Optional

IGNORE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".cache",
    ".android",
    ".cargo",
    ".npm",
    "dist",
    "build",
    ".idea"
}

def get_file_type(name: str) -> str:
    ext = os.path.splitext(name)[1].lower()
    mapping = {
        ".js": "javascript",
        ".mjs": "javascript",
        ".cjs": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".jsx": "javascript",
        ".py": "python",
        ".sh": "bash",
        ".bash": "bash",
        ".zsh": "bash",
        ".json": "json",
        ".html": "html",
        ".htm": "html",
        ".css": "css",
        ".scss": "css",
        ".md": "markdown",
        ".markdown": "markdown",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".toml": "toml",
        ".rs": "rust",
        ".c": "c",
        ".h": "c",
        ".cpp": "cpp",
        ".hpp": "cpp",
        ".go": "go",
        ".java": "java",
        ".kt": "kotlin",
        ".kts": "kotlin",
        ".txt": "text",
        ".xml": "xml",
        ".svg": "xml",
        ".sql": "sql",
        ".env": "text"
    }
    return mapping.get(ext, "text")

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def list_directory(base_dir: str, depth: int = 1, current_depth: int = 0) -> List[Dict[str, Any]]:
    if not os.path.exists(base_dir) or not os.path.isdir(base_dir):
        return []

    items = []
    try:
        entries = sorted(os.scandir(base_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            name = entry.name
            if name.startswith(".") and name in IGNORE_DIRS:
                continue
            if name in IGNORE_DIRS:
                continue

            try:
                is_dir = entry.is_dir(follow_symlinks=False)
                size_str = ""
                mtime = 0
                try:
                    stat = entry.stat(follow_symlinks=False)
                    mtime = int(stat.st_mtime)
                    if not is_dir:
                        size_str = format_size(stat.st_size)
                except Exception:
                    pass

                item = {
                    "name": name,
                    "path": entry.path,
                    "isDir": is_dir,
                    "type": "folder" if is_dir else get_file_type(name),
                    "size": size_str,
                    "mtime": mtime
                }

                if is_dir and current_depth < depth:
                    item["children"] = list_directory(entry.path, depth, current_depth + 1)
                elif is_dir:
                    item["hasChildren"] = True

                items.append(item)
            except (PermissionError, OSError):
                continue
    except (PermissionError, OSError):
        pass

    return items

def read_file(path: str, max_size_bytes: int = 5 * 1024 * 1024) -> Dict[str, Any]:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"File not found: {path}")

    size = os.path.getsize(path)
    if size > max_size_bytes:
        raise ValueError(f"File too large ({size} bytes). Limit is {max_size_bytes} bytes.")

    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {
            "path": path,
            "name": os.path.basename(path),
            "content": content,
            "size": size,
            "type": get_file_type(path)
        }
    except Exception as e:
        raise IOError(f"Error reading file {path}: {str(e)}")

def write_file(path: str, content: str) -> bool:
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)

    temp_path = path + ".tmp.tc"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(temp_path, path)
        return True
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise IOError(f"Error writing file {path}: {str(e)}")

def create_entry(path: str, is_dir: bool = False) -> bool:
    if os.path.exists(path):
        raise FileExistsError(f"Target already exists: {path}")

    parent = os.path.dirname(path)
    if parent and not os.path.exists(parent):
        os.makedirs(parent, exist_ok=True)

    if is_dir:
        os.makedirs(path, exist_ok=True)
    else:
        with open(path, "w", encoding="utf-8") as f:
            pass
    return True

def delete_entry(path: str) -> bool:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Path not found: {path}")

    if os.path.isdir(path):
        shutil.rmtree(path)
    else:
        os.remove(path)
    return True

def rename_entry(src_path: str, dst_path: str) -> bool:
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source not found: {src_path}")
    if os.path.exists(dst_path):
        raise FileExistsError(f"Destination already exists: {dst_path}")

    parent = os.path.dirname(dst_path)
    if parent and not os.path.exists(parent):
        os.makedirs(parent, exist_ok=True)

    os.rename(src_path, dst_path)
    return True

def duplicate_entry(path: str) -> str:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Path not found: {path}")
    dirname = os.path.dirname(path)
    base = os.path.basename(path)
    name, ext = os.path.splitext(base)
    copy_name = f"{name}_copy{ext}"
    dst = os.path.join(dirname, copy_name)
    counter = 1
    while os.path.exists(dst):
        copy_name = f"{name}_copy_{counter}{ext}"
        dst = os.path.join(dirname, copy_name)
        counter += 1

    if os.path.isdir(path):
        shutil.copytree(path, dst)
    else:
        shutil.copy2(path, dst)
    return dst

