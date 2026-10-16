import os
import sys
import pty
import fcntl
import termios
import struct
import select
import asyncio
import subprocess
import logging

logger = logging.getLogger("pty_manager")

def get_default_shell():
    # Priority for Termux bash
    candidates = [
        os.environ.get("SHELL"),
        "/data/data/com.termux/files/usr/bin/bash",
        "/data/data/com.termux/files/usr/bin/sh",
        "/bin/bash",
        "/bin/sh",
        "/system/bin/sh"
    ]
    for c in candidates:
        if c and os.path.exists(c) and os.access(c, os.X_OK):
            return c
    return "/bin/sh"

class PtySession:
    def __init__(self, cols=80, rows=24, cwd=None):
        self.cols = cols
        self.rows = rows
        self.cwd = cwd or os.environ.get("HOME", "/data/data/com.termux/files/home")
        if not os.path.isdir(self.cwd):
            self.cwd = os.getcwd()
            
        self.master_fd = None
        self.slave_fd = None
        self.process = None
        self.alive = False

    def start(self):
        self.master_fd, self.slave_fd = pty.openpty()
        self.resize(self.cols, self.rows)
        
        # Set non-blocking master
        flags = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
        fcntl.fcntl(self.master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

        shell = get_default_shell()
        env = os.environ.copy()
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        if "HOME" not in env:
            env["HOME"] = "/data/data/com.termux/files/home"

        # Spawn child
        self.process = subprocess.Popen(
            [shell, "-l"],
            stdin=self.slave_fd,
            stdout=self.slave_fd,
            stderr=self.slave_fd,
            cwd=self.cwd,
            env=env,
            preexec_fn=os.setsid,
            close_fds=True
        )
        
        # Close slave in parent
        os.close(self.slave_fd)
        self.slave_fd = None
        self.alive = True
        logger.info(f"Spawned shell {shell} (PID: {self.process.pid})")

    def resize(self, cols, rows):
        self.cols = max(10, cols)
        self.rows = max(5, rows)
        fd = self.master_fd or self.slave_fd
        if fd is not None:
            try:
                winsize = struct.pack("HHHH", self.rows, self.cols, 0, 0)
                fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
            except Exception as e:
                logger.warning(f"Error resizing pty: {e}")

    def write(self, data: str):
        if self.master_fd is not None and self.alive:
            try:
                os.write(self.master_fd, data.encode("utf-8"))
            except Exception as e:
                logger.error(f"Error writing to pty: {e}")

    def read(self, max_bytes=4096) -> str:
        if self.master_fd is None or not self.alive:
            return ""
        try:
            r, _, _ = select.select([self.master_fd], [], [], 0)
            if r:
                raw = os.read(self.master_fd, max_bytes)
                if not raw:
                    self.alive = False
                    return ""
                return raw.decode("utf-8", errors="replace")
        except (BlockingIOError, InterruptedError):
            return ""
        except Exception as e:
            logger.debug(f"Pty read exception: {e}")
            self.alive = False
            return ""
        return ""

    def get_cwd(self):
        """Retrieve the current working directory of the spawned shell or foreground process."""
        if not self.alive or not self.process or not self.process.pid:
            return self.cwd

        # 1. Try foreground process group if master_fd is valid
        if self.master_fd is not None:
            try:
                fg_pgrp = os.tcgetpgrp(self.master_fd)
                if fg_pgrp > 0:
                    fg_cwd = os.readlink(f"/proc/{fg_pgrp}/cwd")
                    if os.path.isdir(fg_cwd):
                        self.cwd = fg_cwd
                        return fg_cwd
            except Exception:
                pass

        # 2. Try the shell process directly
        try:
            sh_cwd = os.readlink(f"/proc/{self.process.pid}/cwd")
            if os.path.isdir(sh_cwd):
                self.cwd = sh_cwd
                return sh_cwd
        except Exception:
            pass

        return self.cwd

    def close(self):
        self.alive = False
        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except Exception:
                pass
            self.master_fd = None
            
        if self.process is not None:
            try:
                self.process.terminate()
                self.process.wait(timeout=1.0)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            self.process = None
