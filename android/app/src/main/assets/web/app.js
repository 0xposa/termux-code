// Termux Code - Core App Logic
(function() {
  // DOM Elements - Core Layout
  const appContainer = document.getElementById("app");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = connectionStatus.querySelector(".status-text");

  // Mode Navigation
  const btnNavHome = document.getElementById("btn-nav-home");
  const btnNavWorkspace = document.getElementById("btn-nav-workspace");

  // Home Fullscreen Explorer Elements
  const homeView = document.getElementById("home-view");
  const homeBreadcrumbs = document.getElementById("home-breadcrumbs");
  const homeExplorerList = document.getElementById("home-explorer-list");
  const homeSearchInput = document.getElementById("home-search-input");
  const btnHomeUp = document.getElementById("btn-home-up");
  const btnHomeNewFile = document.getElementById("btn-home-new-file");
  const btnHomeNewFolder = document.getElementById("btn-home-new-folder");
  const btnHomeOpenTerm = document.getElementById("btn-home-open-term");
  const btnHomeOpenProject = document.getElementById("btn-home-open-project");
  const btnHomeRefresh = document.getElementById("btn-home-refresh");

  // Workspace Elements
  const fileSidebar = document.getElementById("file-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const fileTreeContainer = document.getElementById("file-tree");
  const editorTabsContainer = document.getElementById("editor-tabs");
  const cmEditorContainer = document.getElementById("cm-editor");
  const placeholderEl = document.getElementById("empty-editor-placeholder");
  const btnSaveFile = document.getElementById("btn-save-file");
  const btnRefreshTree = document.getElementById("btn-refresh-tree");

  // Workspace Scope Switcher & Project Banner Elements
  const btnScopeProject = document.getElementById("btn-scope-project");
  const btnScopeRoot = document.getElementById("btn-scope-root");
  const sidebarRootInfo = document.getElementById("sidebar-root-info");
  const sidebarRootIcon = document.getElementById("sidebar-root-icon");
  const sidebarRootName = document.getElementById("sidebar-root-name");
  const sidebarRootBadge = document.getElementById("sidebar-root-badge");
  const btnSwitchProject = document.getElementById("btn-switch-project");

  // Project Picker Modal Elements
  const projectPickerBackdrop = document.getElementById("project-picker-backdrop");
  const projectPickerModal = document.getElementById("project-picker-modal");
  const projectPickerList = document.getElementById("project-picker-list");
  const btnCloseProjectPicker = document.getElementById("btn-close-project-picker");
  const btnPickCustomPath = document.getElementById("btn-pick-custom-path");
  const btnBrowseInHome = document.getElementById("btn-browse-in-home");

  // Floating Unsaved Changes Dock (Bottom Center of Code Editor)
  const editorUnsavedDock = document.getElementById("editor-unsaved-dock");
  const btnDockSave = document.getElementById("btn-dock-save");
  const btnDockDiscard = document.getElementById("btn-dock-discard");
  const btnDockDiff = document.getElementById("btn-dock-diff");

  // Diff Viewer Modal Elements
  const diffModal = document.getElementById("diff-modal");
  const diffModalBackdrop = document.getElementById("diff-modal-backdrop");
  const diffModalTitle = document.getElementById("diff-modal-title");
  const diffContentEl = document.getElementById("diff-content");
  const btnCloseDiffModal = document.getElementById("btn-close-diff-modal");
  const btnDiffDiscard = document.getElementById("btn-diff-discard");
  const btnDiffSave = document.getElementById("btn-diff-save");
  const btnNewFile = document.getElementById("btn-new-file");
  const btnNewFolder = document.getElementById("btn-new-folder");

  // Layout View Controls
  const btnViewEditor = document.getElementById("btn-view-editor");
  const btnViewSplit = document.getElementById("btn-view-split");
  const btnViewTerminal = document.getElementById("btn-view-terminal");

  // Terminal Elements
  const terminalTabsContainer = document.getElementById("terminal-tabs");
  const btnNewTerminal = document.getElementById("btn-new-terminal");
  const terminalWrapper = document.getElementById("terminal-wrapper");
  const btnTermClear = document.getElementById("btn-term-clear");
  const btnTermReconnect = document.getElementById("btn-term-reconnect");
  const btnTermFocus = document.getElementById("btn-term-focus");
  const vkeyBar = document.getElementById("virtual-keyboard-bar");
  const terminalCmdInput = document.getElementById("terminal-cmd-input");
  const btnSendCmd = document.getElementById("btn-send-cmd");
  const btnAttachFile = document.getElementById("btn-attach-file");
  const terminalFileInput = document.getElementById("terminal-file-input");
  const attachDropdownMenu = document.getElementById("attach-dropdown-menu");
  const attachOptDevice = document.getElementById("attach-opt-device");
  const attachOptWorkspace = document.getElementById("attach-opt-workspace");
  const workspacePickerBackdrop = document.getElementById("workspace-picker-backdrop");
  const workspacePickerModal = document.getElementById("workspace-picker-modal");
  const workspacePickerList = document.getElementById("workspace-picker-list");
  const workspacePickerSearch = document.getElementById("workspace-picker-search");
  const btnCloseWorkspacePicker = document.getElementById("btn-close-workspace-picker");

  // Context Menu Modal & Toast
  const itemContextMenu = document.getElementById("item-context-menu");
  const ctxBackdrop = document.getElementById("ctx-backdrop");
  const ctxItemIcon = document.getElementById("ctx-item-icon");
  const ctxItemName = document.getElementById("ctx-item-name");
  const appToast = document.getElementById("app-toast");

  // Icons
  const SVG_TERM_TAB = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#98c379" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;

  // Application State
  const state = {
    homeRoot: "/data/data/com.termux/files/home",
    projectRoot: "/data/data/com.termux/files/home/projects/termux-code",
    projectName: "termux-code",
    explorerScope: localStorage.getItem("termux_code_explorer_scope") || "project", // Default to 'project'!
    workspaceRoot: "/data/data/com.termux/files/home/projects/termux-code",
    homePath: "/data/data/com.termux/files/home",
    homeItems: [],
    activePage: "home", // Default to fullscreen Home Explorer on root
    treeData: [],
    openFiles: new Map(), // path -> { name, content, originalContent, isDirty, doc }
    activeFilePath: null,
    cmView: null,
    terminalSessions: new Map(), // id -> { id, title, cwd, term, fitAddon, socket, containerEl, connected }
    activeTerminalId: null,
    terminalIdCounter: 0,
    ctrlActive: false,
    altActive: false,
    viewMode: "view-split",
    contextItem: null,
    detectedProjects: [],
    workspaceFileList: []
  };

  // --- 1. Toast Notification Helper ---
  function showToast(message) {
    if (!appToast) return;
    appToast.textContent = message;
    appToast.style.display = "block";
    clearTimeout(appToast._timer);
    appToast._timer = setTimeout(() => {
      appToast.style.display = "none";
    }, 2200);
  }

  // --- 2. Page Mode Switcher (Home vs Workspace) ---
  function setPageMode(mode) {
    if (state.activePage === mode) return;
    state.activePage = mode;
    appContainer.classList.remove("mode-home", "mode-workspace");
    appContainer.classList.add(`mode-${mode}`);

    btnNavHome.classList.toggle("active", mode === "home");
    btnNavWorkspace.classList.toggle("active", mode === "workspace");

    if (mode === "workspace") {
      setTimeout(() => {
        handleTerminalResize();
        focusTerminal();
      }, 280);
    } else if (mode === "home") {
      navigateToHomeDirectory(state.homePath || state.homeRoot);
    }
  }

  // --- 2. Scope & Project Management ---
  function setExplorerScope(scope, refresh = true) {
    state.explorerScope = scope;
    localStorage.setItem("termux_code_explorer_scope", scope);

    const isProject = (scope === "project");
    state.workspaceRoot = isProject ? state.projectRoot : state.homeRoot;

    // Update buttons
    if (btnScopeProject) btnScopeProject.classList.toggle("active", isProject);
    if (btnScopeRoot) btnScopeRoot.classList.toggle("active", !isProject);

    // Update Root Info in Sidebar
    if (sidebarRootName) {
      sidebarRootName.textContent = isProject ? state.projectName : "~ (Home Root)";
    }
    if (sidebarRootBadge) {
      sidebarRootBadge.textContent = isProject ? "Project" : "Root (~)";
      sidebarRootBadge.className = `sidebar-root-badge ${isProject ? "" : "badge-root"}`;
    }
    if (sidebarRootInfo) {
      sidebarRootInfo.title = isProject ? `Project: ${state.projectRoot}` : `Root: ${state.homeRoot}`;
    }
    if (sidebarRootIcon) {
      if (isProject) {
        sidebarRootIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#e5c07b"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
      } else {
        sidebarRootIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
      }
    }

    if (refresh) {
      fetchTree();
    }
  }

  function setProjectRoot(targetPath, name = null, openTerminal = false) {
    if (!targetPath) return;
    state.projectRoot = targetPath;
    state.projectName = name || targetPath.split("/").filter(Boolean).pop() || "project";
    localStorage.setItem("termux_code_project_path", targetPath);
    localStorage.setItem("termux_code_project_name", state.projectName);

    setExplorerScope("project", true);

    if (openTerminal) {
      createTerminalSession({
        cwd: targetPath,
        title: state.projectName
      });
      if (state.viewMode === "view-editor") {
        setViewMode(isMobile() ? "view-terminal" : "view-split");
      }
      setTimeout(() => {
        focusTerminal();
      }, 150);
      showToast(`Project aktif: ${state.projectName} (Sesi terminal baru dibuka)`);
    } else {
      showToast(`Project aktif: ${state.projectName}`);
    }
  }

  function openProjectPicker() {
    if (!projectPickerModal) return;
    projectPickerBackdrop.style.display = "block";
    projectPickerModal.style.display = "flex";

    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        state.detectedProjects = data.projects || [];
        renderProjectPickerList();
      })
      .catch(err => {
        console.error("Error fetching projects:", err);
        renderProjectPickerList();
      });
  }

  function closeProjectPicker() {
    if (!projectPickerModal) return;
    projectPickerBackdrop.style.display = "none";
    projectPickerModal.style.display = "none";
  }

  function renderProjectPickerList() {
    if (!projectPickerList) return;
    projectPickerList.innerHTML = "";

    const projects = (state.detectedProjects && state.detectedProjects.length > 0)
      ? state.detectedProjects
      : [{ name: state.projectName, path: state.projectRoot, isCurrent: true }];

    projects.forEach(p => {
      const isCurrent = (p.path === state.projectRoot);
      const item = document.createElement("button");
      item.type = "button";
      item.className = `project-picker-item ${isCurrent ? "active" : ""}`;
      item.innerHTML = `
        <div class="project-picker-item-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isCurrent ? '#61afef' : '#e5c07b'}">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <div style="overflow:hidden; text-align:left;">
            <div class="project-picker-item-name">${p.name}</div>
            <div class="project-picker-item-path">${p.path}</div>
          </div>
        </div>
        ${isCurrent ? '<span class="project-picker-item-badge">Active</span>' : ''}
      `;

      item.onclick = () => {
        closeProjectPicker();
        setProjectRoot(p.path, p.name, true);
        setPageMode("workspace");
      };

      projectPickerList.appendChild(item);
    });
  }

  // --- 3. Home Fullscreen Explorer Logic ---
  function navigateToHomeDirectory(targetPath) {
    state.homePath = targetPath;
    renderBreadcrumbs(targetPath);
    fetch(`/api/files/tree?path=${encodeURIComponent(targetPath)}&depth=1`)
      .then(res => res.json())
      .then(data => {
        state.homeItems = data.items || [];
        renderHomeExplorer(state.homeItems);
      })
      .catch(err => {
        console.error("Error fetching home directory:", err);
      });
  }

  function renderBreadcrumbs(currentPath) {
    homeBreadcrumbs.innerHTML = "";
    if (!currentPath) return;

    const root = state.homeRoot || "/data/data/com.termux/files/home";
    let relative = currentPath.startsWith(root) ? currentPath.slice(root.length) : currentPath;
    if (relative.startsWith("/")) relative = relative.slice(1);

    const parts = relative ? relative.split("/") : [];

    // Root breadcrumb
    const rootItem = document.createElement("span");
    rootItem.className = "breadcrumb-item";
    rootItem.textContent = "~ (root)";
    rootItem.onclick = () => navigateToHomeDirectory(root);
    homeBreadcrumbs.appendChild(rootItem);

    let accumulated = root;
    parts.forEach((part) => {
      const sep = document.createElement("span");
      sep.className = "breadcrumb-separator";
      sep.textContent = "/";
      homeBreadcrumbs.appendChild(sep);

      accumulated += "/" + part;
      const target = accumulated;

      const item = document.createElement("span");
      item.className = "breadcrumb-item";
      item.textContent = part;
      item.onclick = () => navigateToHomeDirectory(target);
      homeBreadcrumbs.appendChild(item);
    });
  }

  function renderHomeExplorer(items) {
    homeExplorerList.innerHTML = "";
    const filter = (homeSearchInput.value || "").trim().toLowerCase();
    const filtered = filter ? items.filter(i => i.name.toLowerCase().includes(filter)) : items;

    if (filtered.length === 0) {
      homeExplorerList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">
          <div style="margin-bottom: 12px; display: flex; justify-content: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5c6370" stroke-width="1.3">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="9" y1="13" x2="15" y2="13"></line>
            </svg>
          </div>
          <div>${filter ? "Tidak ada berkas yang cocok dengan pencarian" : "Folder ini kosong"}</div>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = `home-item-card ${item.isDir ? "is-dir" : ""}`;
      card.title = item.path;

      const icon = document.createElement("div");
      icon.className = "home-item-icon";
      icon.innerHTML = getFileIconSvg(item.type, item.isDir);

      const info = document.createElement("div");
      info.className = "home-item-info";

      const name = document.createElement("div");
      name.className = "home-item-name";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "home-item-meta";
      meta.textContent = item.isDir ? "Folder" : (item.size || item.type);

      info.appendChild(name);
      info.appendChild(meta);

      const moreBtn = document.createElement("button");
      moreBtn.className = "btn-item-more";
      moreBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      `;
      moreBtn.title = "Opsi menu";
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        openContextMenu(item, e);
      };

      card.appendChild(icon);
      card.appendChild(info);
      card.appendChild(moreBtn);

      card.onclick = () => {
        if (item.isDir) {
          navigateToHomeDirectory(item.path);
        } else {
          openFile(item.path);
          setPageMode("workspace");
        }
      };

      homeExplorerList.appendChild(card);
    });
  }

  function goHomeUp() {
    const root = state.homeRoot || "/data/data/com.termux/files/home";
    if (state.homePath === root) return;

    const parent = state.homePath.substring(0, state.homePath.lastIndexOf("/"));
    if (parent && parent.length >= root.length) {
      navigateToHomeDirectory(parent);
    } else {
      navigateToHomeDirectory(root);
    }
  }

  // --- 4. Context Menu Actions ---
  function openContextMenu(item, e) {
    state.contextItem = item;
    ctxItemName.textContent = item.name;
    ctxItemIcon.innerHTML = getFileIconSvg(item.type, item.isDir);

    const isFolder = item.isDir;
    // Show/hide relevant options
    const optOpenProject = document.getElementById("ctx-opt-open-project");
    if (optOpenProject) optOpenProject.style.display = isFolder ? "flex" : "none";
    document.getElementById("ctx-opt-open-term").style.display = isFolder ? "flex" : "none";
    document.getElementById("ctx-opt-run-agent").style.display = isFolder ? "flex" : "none";
    document.getElementById("ctx-opt-new-file").style.display = isFolder ? "flex" : "none";
    document.getElementById("ctx-opt-new-folder").style.display = isFolder ? "flex" : "none";

    document.getElementById("ctx-opt-open-editor").style.display = !isFolder ? "flex" : "none";

    itemContextMenu.style.display = "block";
    ctxBackdrop.style.display = "block";

    if (window.innerWidth <= 768) {
      itemContextMenu.style.left = "50%";
      itemContextMenu.style.top = "50%";
      itemContextMenu.style.transform = "translate(-50%, -50%)";
    } else {
      itemContextMenu.style.transform = "none";
      const x = Math.min(e.clientX, window.innerWidth - 290);
      const y = Math.min(e.clientY, window.innerHeight - 380);
      itemContextMenu.style.left = `${Math.max(10, x)}px`;
      itemContextMenu.style.top = `${Math.max(10, y)}px`;
    }
  }

  function closeContextMenu() {
    itemContextMenu.style.display = "none";
    ctxBackdrop.style.display = "none";
    state.contextItem = null;
  }

  function setupContextMenuActions() {
    ctxBackdrop.onclick = closeContextMenu;

    itemContextMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".ctx-item");
      if (!btn || !state.contextItem) return;

      const action = btn.getAttribute("data-action");
      const item = state.contextItem;

      if (action === "open-as-project") {
        closeContextMenu();
        setProjectRoot(item.path, item.name, true);
        setPageMode("workspace");
        return;
      } else if (action === "open-term") {
        closeContextMenu();
        createTerminalSession({ cwd: item.path, title: item.name });
        setPageMode("workspace");
        setViewMode("view-terminal");
        showToast(`Sesi Terminal baru: ${item.name}`);
      } else if (action === "run-agent") {
        closeContextMenu();
        const agentCmd = prompt("Ketik nama CLI Agent yang ingin dijalankan (misal: claude, antigravity-cli, aider):", "claude");
        if (agentCmd) {
          createTerminalSession({ cwd: item.path, title: agentCmd, initialCmd: agentCmd });
          setPageMode("workspace");
          setViewMode("view-terminal");
        }
      } else if (action === "open-editor") {
        closeContextMenu();
        if (state.viewMode === "view-terminal") {
          setViewMode(isMobile() ? "view-editor" : "view-split");
        }
        setPageMode("workspace");
        openFile(item.path);
      } else if (action === "new-file-inside") {
        closeContextMenu();
        const name = prompt(`Buat file baru di dalam "${item.name}":`);
        if (name) {
          const target = item.path + "/" + name;
          fetch("/api/files/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: target, isDir: false })
          })
          .then(r => r.json())
          .then(() => {
            showToast("File berhasil dibuat!");
            navigateToHomeDirectory(state.homePath);
            fetchTree();
            openFile(target);
            setPageMode("workspace");
          })
          .catch(err => alert("Error: " + err.message));
        }
      } else if (action === "new-folder-inside") {
        closeContextMenu();
        const name = prompt(`Buat folder baru di dalam "${item.name}":`);
        if (name) {
          const target = item.path + "/" + name;
          fetch("/api/files/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: target, isDir: true })
          })
          .then(r => r.json())
          .then(() => {
            showToast("Folder berhasil dibuat!");
            navigateToHomeDirectory(state.homePath);
            fetchTree();
          })
          .catch(err => alert("Error: " + err.message));
        }
      } else if (action === "rename") {
        closeContextMenu();
        const newName = prompt("Ubah nama menjadi:", item.name);
        if (newName && newName !== item.name) {
          const parent = item.path.substring(0, item.path.lastIndexOf("/"));
          const dst = parent + "/" + newName;
          fetch("/api/files/rename", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ srcPath: item.path, dstPath: dst })
          })
          .then(r => r.json())
          .then(() => {
            showToast(`Berhasil diubah ke: ${newName}`);
            navigateToHomeDirectory(state.homePath);
            fetchTree();
          })
          .catch(err => alert("Error: " + err.message));
        }
      } else if (action === "duplicate") {
        closeContextMenu();
        fetch("/api/files/duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: item.path })
        })
        .then(r => r.json())
        .then(() => {
          showToast(`Berhasil digandakan!`);
          navigateToHomeDirectory(state.homePath);
          fetchTree();
        })
        .catch(err => alert("Error: " + err.message));
      } else if (action === "copy-path") {
        closeContextMenu();
        navigator.clipboard.writeText(item.path)
          .then(() => showToast("Path disalin ke clipboard!"))
          .catch(() => alert(item.path));
      } else if (action === "delete") {
        closeContextMenu();
        if (confirm(`Yakin ingin menghapus "${item.name}" secara permanen?`)) {
          fetch("/api/files/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: item.path })
          })
          .then(r => r.json())
          .then(() => {
            showToast(`"${item.name}" telah dihapus`);
            navigateToHomeDirectory(state.homePath);
            fetchTree();
            if (state.openFiles.has(item.path)) {
              closeFile(item.path);
            }
          })
          .catch(err => alert("Error: " + err.message));
        }
      }
    });
  }

  // --- 5. Multi-Session Terminal (xterm.js + WebSocket) ---
  function getActiveTerminalSession() {
    if (!state.activeTerminalId) return null;
    return state.terminalSessions.get(state.activeTerminalId) || null;
  }

  function formatTitleFromCwd(cwd) {
    if (!cwd) return "home";
    if (cwd === "/" || cwd.trim() === "/") {
      return "root";
    }
    const normHome = (state.homeRoot || "/data/data/com.termux/files/home").replace(/\/+$/, "");
    const normCwd = cwd.replace(/\/+$/, "");
    if (normCwd === normHome) {
      return "home";
    }
    const parts = normCwd.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "home";
  }

  function createTerminalSession(options = {}) {
    state.terminalIdCounter++;
    const id = `term-${state.terminalIdCounter}`;
    const defaultCwd = state.homeRoot || "/data/data/com.termux/files/home";
    const cwd = options.cwd || defaultCwd;
    const title = options.title || formatTitleFromCwd(cwd);

    // Create session DOM container inside terminal-wrapper
    const containerEl = document.createElement("div");
    containerEl.id = `xterm-session-${id}`;
    containerEl.className = "xterm-session-container";
    terminalWrapper.appendChild(containerEl);

    // Initialize xterm.js instance
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      convertEol: false,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e24',
        foreground: '#abb2bf',
        cursor: '#528bff',
        selectionBackground: 'rgba(97, 175, 239, 0.3)',
        black: '#282c34',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#be5046',
        brightGreen: '#98c379',
        brightYellow: '#d19a66',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
      }
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    if (window.WebLinksAddon) {
      term.loadAddon(new WebLinksAddon.WebLinksAddon());
    }

    term.open(containerEl);

    // On input directly into this terminal
    term.onData(data => {
      sendTerminalInput(data, id);
    });

    const session = {
      id: id,
      title: title,
      cwd: cwd,
      term: term,
      fitAddon: fitAddon,
      containerEl: containerEl,
      socket: null,
      connected: false
    };

    state.terminalSessions.set(id, session);

    // Connect WebSocket
    connectSessionWebSocket(session);

    // Activate this terminal tab
    setActiveTerminalSession(id);

    // Initial command execution if requested (e.g. Launch Agent CLI)
    if (options.initialCmd) {
      setTimeout(() => {
        sendTerminalInput(options.initialCmd + "\r", id);
      }, 500);
    }

    return session;
  }

  function connectSessionWebSocket(session, isRestart = false) {
    if (session.socket) {
      const oldSocket = session.socket;
      // Detach listeners from old socket so closing it doesn't trigger onclose messages
      oldSocket.onopen = null;
      oldSocket.onmessage = null;
      oldSocket.onerror = null;
      oldSocket.onclose = null;
      try { oldSocket.close(); } catch(e) {}
      session.socket = null;
    }

    if (isRestart && session.term) {
      session.term.write("\r\n\x1b[36m[Menyambungkan ulang sesi terminal...]\x1b[0m\r\n");
    }

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    let url = `${proto}//${location.host}/ws/terminal`;
    if (session.cwd) {
      url += `?cwd=${encodeURIComponent(session.cwd)}`;
    }

    setConnectionStatus("connecting", "Connecting...");
    const socket = new WebSocket(url);
    session.socket = socket;

    socket.onopen = () => {
      if (session.socket !== socket) return;
      session.connected = true;
      if (state.activeTerminalId === session.id) {
        setConnectionStatus("connected", "Connected");
        handleTerminalResize();
        setTimeout(focusTerminal, 120);
      }
      // Request initial cwd from backend
      try {
        socket.send(JSON.stringify({ type: "get_cwd" }));
      } catch(e) {}
      renderTerminalTabs();
    };

    socket.onmessage = (event) => {
      if (session.socket !== socket) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "output" && msg.data) {
          session.term.write(msg.data);
        } else if (msg.type === "cwd" && msg.cwd) {
          session.cwd = msg.cwd;
          const newTitle = formatTitleFromCwd(msg.cwd);
          if (session.title !== newTitle) {
            session.title = newTitle;
            updateSessionTabTitle(session);
          }
        }
      } catch(e) {
        session.term.write(event.data);
      }
    };

    socket.onclose = () => {
      if (session.socket !== socket) return;
      session.connected = false;
      if (state.activeTerminalId === session.id) {
        setConnectionStatus("disconnected", "Disconnected");
      }
      session.term.write("\r\n\x1b[33m[Session disconnected. Tap × to close or reconnect button to restart]\x1b[0m\r\n");
      renderTerminalTabs();
    };

    socket.onerror = (err) => {
      if (session.socket !== socket) return;
      console.warn(`Terminal WebSocket error (${session.id}):`, err);
      session.connected = false;
      if (state.activeTerminalId === session.id) {
        setConnectionStatus("disconnected", "Error");
      }
    };
  }

  function setActiveTerminalSession(id) {
    if (!state.terminalSessions.has(id)) return;
    state.activeTerminalId = id;

    // Toggle DOM visibility
    state.terminalSessions.forEach((session, sId) => {
      const isActive = (sId === id);
      session.containerEl.classList.toggle("active", isActive);
    });

    const activeSession = state.terminalSessions.get(id);
    if (activeSession) {
      setConnectionStatus(activeSession.connected ? "connected" : "disconnected", activeSession.connected ? "Connected" : "Disconnected");
      renderTerminalTabs();
      setTimeout(() => {
        try {
          activeSession.fitAddon.fit();
          activeSession.term.focus();
        } catch(e) {}
      }, 50);
    }
  }

  function closeTerminalSession(id, event) {
    if (event) event.stopPropagation();

    const session = state.terminalSessions.get(id);
    if (!session) return;

    const name = session.title || "Terminal";
    if (!confirm(`Apakah Anda yakin ingin menutup sesi terminal "${name}"?`)) {
      return;
    }

    if (session.socket) {
      const s = session.socket;
      s.onopen = null;
      s.onmessage = null;
      s.onerror = null;
      s.onclose = null;
      try { s.close(); } catch(e) {}
      session.socket = null;
    }

    try { session.term.dispose(); } catch(e) {}

    if (session.containerEl && session.containerEl.parentNode) {
      session.containerEl.remove();
    }

    state.terminalSessions.delete(id);

    if (state.activeTerminalId === id) {
      const remainingIds = Array.from(state.terminalSessions.keys());
      if (remainingIds.length > 0) {
        setActiveTerminalSession(remainingIds[remainingIds.length - 1]);
      } else {
        createTerminalSession({ cwd: state.homeRoot || "/data/data/com.termux/files/home", title: "home" });
      }
    } else {
      renderTerminalTabs();
    }

    showToast(`Sesi terminal "${name}" ditutup`);
  }

  function updateSessionTabTitle(session) {
    if (!session || !terminalTabsContainer) return;
    const tabEl = terminalTabsContainer.querySelector(`.terminal-tab[data-session-id="${session.id}"]`);
    if (tabEl) {
      tabEl.title = `${session.title} (${session.cwd || "Termux"})`;
      const titleSpan = tabEl.querySelector(".terminal-tab-title");
      if (titleSpan) {
        titleSpan.textContent = session.title;
      }
    } else {
      renderTerminalTabs();
    }
  }

  function renderTerminalTabs() {
    if (!terminalTabsContainer) return;
    terminalTabsContainer.innerHTML = "";

    state.terminalSessions.forEach((session, id) => {
      const tab = document.createElement("div");
      tab.className = `terminal-tab ${id === state.activeTerminalId ? "active" : ""}`;
      tab.dataset.sessionId = id;
      tab.title = `${session.title} (${session.cwd || "Termux"})`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "terminal-tab-icon";
      iconSpan.innerHTML = SVG_TERM_TAB;
      tab.appendChild(iconSpan);

      const titleSpan = document.createElement("span");
      titleSpan.className = "terminal-tab-title";
      titleSpan.textContent = session.title;
      tab.appendChild(titleSpan);

      const closeBtn = document.createElement("span");
      closeBtn.className = "tab-close";
      closeBtn.textContent = "×";
      closeBtn.title = "Tutup sesi terminal";
      closeBtn.onclick = (e) => closeTerminalSession(id, e);
      tab.appendChild(closeBtn);

      tab.onclick = () => setActiveTerminalSession(id);
      terminalTabsContainer.appendChild(tab);
    });
  }

  function focusTerminal() {
    const session = getActiveTerminalSession();
    if (session && session.term) {
      session.term.focus();
      const helper = session.containerEl.querySelector(".xterm-helper-textarea");
      if (helper) {
        helper.focus();
      }
    }
  }

  function handleTerminalResize() {
    const session = getActiveTerminalSession();
    if (!session || !session.fitAddon || !session.term) return;
    try {
      session.fitAddon.fit();
      if (session.socket && session.socket.readyState === WebSocket.OPEN) {
        session.socket.send(JSON.stringify({
          type: "resize",
          cols: session.term.cols,
          rows: session.term.rows
        }));
      }
    } catch(e) {
      console.warn("Resize error:", e);
    }
  }

  function sendTerminalInput(data, targetSessionId = null) {
    const session = targetSessionId ? state.terminalSessions.get(targetSessionId) : getActiveTerminalSession();
    if (!session) {
      console.warn("No terminal session available to send input");
      return;
    }

    if (!session.socket || session.socket.readyState !== WebSocket.OPEN) {
      console.warn("Terminal socket not open, attempting reconnection...");
      connectSessionWebSocket(session, true);
      return;
    }

    let payload = data;
    if (state.ctrlActive && data.length === 1) {
      const code = data.toUpperCase().charCodeAt(0);
      if (code >= 64 && code <= 95) {
        payload = String.fromCharCode(code - 64);
      }
      setCtrlModifier(false);
    } else if (state.altActive && data.length === 1) {
      payload = "\x1b" + data;
      setAltModifier(false);
    }

    session.socket.send(JSON.stringify({
      type: "input",
      data: payload
    }));

    if (payload.includes("\r") || payload.includes("\n")) {
      setTimeout(() => {
        if (session.socket && session.socket.readyState === WebSocket.OPEN) {
          session.socket.send(JSON.stringify({ type: "get_cwd" }));
        }
      }, 60);
      setTimeout(() => {
        if (session.socket && session.socket.readyState === WebSocket.OPEN) {
          session.socket.send(JSON.stringify({ type: "get_cwd" }));
        }
      }, 250);
    }
  }

  function initTerminalSystem() {
    if (terminalWrapper) {
      terminalWrapper.addEventListener("click", () => focusTerminal());
      terminalWrapper.addEventListener("touchend", () => focusTerminal());
    }

    if (btnNewTerminal) {
      btnNewTerminal.onclick = () => {
        const rootCwd = state.homeRoot || "/data/data/com.termux/files/home";
        createTerminalSession({ cwd: rootCwd, title: "home" });
        showToast("Sesi terminal baru di: home (root)");
      };
    }

    window.addEventListener("resize", () => {
      if (state.activePage === "workspace" && state.viewMode !== "view-editor") {
        setTimeout(handleTerminalResize, 100);
      }
    });
  }

  function setCtrlModifier(active) {
    state.ctrlActive = active;
    const btn = vkeyBar.querySelector('[data-key="CTRL"]');
    if (btn) btn.classList.toggle("active", active);
  }

  function setAltModifier(active) {
    state.altActive = active;
    const btn = vkeyBar.querySelector('[data-key="ALT"]');
    if (btn) btn.classList.toggle("active", active);
  }

  // --- 6. Mobile Virtual Keys ---
  function setupVirtualKeys() {
    vkeyBar.addEventListener("click", (e) => {
      const target = e.target.closest(".vkey");
      if (!target) return;

      const key = target.getAttribute("data-key");
      const action = target.getAttribute("data-action");
      const char = target.getAttribute("data-char");

      if (key === "CTRL") {
        setCtrlModifier(!state.ctrlActive);
        return;
      }
      if (key === "ALT") {
        setAltModifier(!state.altActive);
        return;
      }
      if (key === "ENTER") {
        sendTerminalInput("\r");
        return;
      }
      if (key === "BACKSPACE") {
        sendTerminalInput("\x7f");
        return;
      }
      if (key === "ESC") {
        sendTerminalInput("\x1b");
        return;
      }
      if (key === "TAB") {
        sendTerminalInput("\t");
        return;
      }
      if (key === "UP") {
        sendTerminalInput("\x1b[A");
        return;
      }
      if (key === "DOWN") {
        sendTerminalInput("\x1b[B");
        return;
      }
      if (key === "RIGHT") {
        sendTerminalInput("\x1b[C");
        return;
      }
      if (key === "LEFT") {
        sendTerminalInput("\x1b[D");
        return;
      }
      if (action === "ctrl-c") {
        sendTerminalInput("\x03");
        return;
      }
      if (action === "ctrl-d") {
        sendTerminalInput("\x04");
        return;
      }
      if (char) {
        sendTerminalInput(char);
        return;
      }
    });
  }

  // --- 7. CodeMirror 6 Editor ---
  function getLanguageExtension(filename) {
    const cm = window.CodeMirror6;
    if (!cm || !cm.languages) return [];
    
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "js":
      case "mjs":
      case "cjs":
      case "ts":
      case "tsx":
      case "jsx":
        return cm.languages.javascript ? [cm.languages.javascript()] : [];
      case "py":
        return cm.languages.python ? [cm.languages.python()] : [];
      case "html":
      case "htm":
        return cm.languages.html ? [cm.languages.html()] : [];
      case "css":
      case "scss":
        return cm.languages.css ? [cm.languages.css()] : [];
      case "json":
        return cm.languages.json ? [cm.languages.json()] : [];
      case "md":
      case "markdown":
        return cm.languages.markdown ? [cm.languages.markdown()] : [];
      default:
        return [];
    }
  }

  function initEditorForFile(filePath, content) {
    const cm = window.CodeMirror6;
    if (!cm) {
      console.error("CodeMirror6 bundle not loaded");
      return;
    }

    if (placeholderEl) {
      placeholderEl.style.display = "none";
    }

    if (state.cmView) {
      state.cmView.destroy();
      state.cmView = null;
    }

    const langExt = getLanguageExtension(filePath);

    const updateListener = cm.EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const file = state.openFiles.get(state.activeFilePath);
        if (file) {
          const currentContent = update.state.doc.toString();
          file.content = currentContent;
          file.isDirty = (currentContent !== file.originalContent);
          updateTabUI(state.activeFilePath);
        }
      }
    });

    const keymaps = cm.keymap.of([
      {
        key: "Mod-s",
        run: () => {
          const file = state.openFiles.get(state.activeFilePath);
          if (file && file.isDirty) {
            saveActiveFile();
          }
          return true;
        }
      },
      ...cm.defaultKeymap,
      ...cm.historyKeymap
    ]);

    const startState = cm.EditorState.create({
      doc: content,
      extensions: [
        cm.basicSetup,
        cm.oneDark,
        keymaps,
        updateListener,
        ...langExt
      ]
    });

    state.cmView = new cm.EditorView({
      state: startState,
      parent: cmEditorContainer
    });
  }

  function openFile(filePath) {
    if (state.viewMode === "view-terminal") {
      setViewMode(isMobile() ? "view-editor" : "view-split");
    }

    if (state.activePage !== "workspace") {
      setPageMode("workspace");
    }

    if (isMobile()) {
      closeSidebar();
    }

    if (state.openFiles.has(filePath)) {
      setActiveFile(filePath);
      return;
    }

    fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`)
      .then(res => {
        if (!res.ok) throw new Error("Could not read file");
        return res.json();
      })
      .then(data => {
        state.openFiles.set(filePath, {
          name: data.name,
          content: data.content,
          originalContent: data.content,
          isDirty: false
        });
        renderTabs();
        setActiveFile(filePath);
      })
      .catch(err => {
        alert("Failed to open file: " + err.message);
      });
  }

  function setActiveFile(filePath) {
    if (state.viewMode === "view-terminal") {
      setViewMode(isMobile() ? "view-editor" : "view-split");
    }

    state.activeFilePath = filePath;
    const file = state.openFiles.get(filePath);
    if (!file) return;

    initEditorForFile(filePath, file.content);
    renderTabs();
    highlightTreeItem(filePath);
    updateSaveButtonState();
  }

  function closeFile(filePath, e) {
    if (e) e.stopPropagation();

    const file = state.openFiles.get(filePath);
    if (file && file.isDirty) {
      if (!confirm(`File "${file.name}" has unsaved changes. Discard changes?`)) {
        return;
      }
    }

    state.openFiles.delete(filePath);

    if (state.activeFilePath === filePath) {
      const keys = Array.from(state.openFiles.keys());
      if (keys.length > 0) {
        setActiveFile(keys[keys.length - 1]);
      } else {
        state.activeFilePath = null;
        if (state.cmView) {
          state.cmView.destroy();
          state.cmView = null;
        }
        if (placeholderEl) {
          placeholderEl.style.display = "flex";
        }
        updateSaveButtonState();
      }
    }

    renderTabs();
  }

  function updateSaveButtonState() {
    const file = state.activeFilePath ? state.openFiles.get(state.activeFilePath) : null;
    const isDirty = Boolean(file && file.isDirty);

    // Floating unsaved dock at bottom center of code editor
    if (editorUnsavedDock) {
      editorUnsavedDock.style.display = isDirty ? "flex" : "none";
    }

    if (btnSaveFile) {
      btnSaveFile.disabled = !isDirty;
      btnSaveFile.title = isDirty ? "Simpan perubahan berkas (Ctrl+S)" : "Tidak ada perubahan";
    }
  }

  function saveActiveFile() {
    if (!state.activeFilePath) return;
    const file = state.openFiles.get(state.activeFilePath);
    if (!file || !file.isDirty) return;

    const contentToSave = state.cmView ? state.cmView.state.doc.toString() : file.content;

    if (btnDockSave) {
      btnDockSave.disabled = true;
      btnDockSave.textContent = "Saving...";
    }
    if (btnDiffSave) {
      btnDiffSave.disabled = true;
      btnDiffSave.textContent = "Saving...";
    }
    if (btnSaveFile) {
      btnSaveFile.disabled = true;
      const saveSpan = btnSaveFile.querySelector("span");
      if (saveSpan) saveSpan.textContent = "Saving...";
    }

    fetch("/api/files/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: state.activeFilePath, content: contentToSave })
    })
      .then(res => res.json())
      .then(res => {
        file.originalContent = contentToSave;
        file.content = contentToSave;
        file.isDirty = false;
        updateTabUI(state.activeFilePath);
        closeDiffModal();

        if (btnDockSave) {
          btnDockSave.textContent = "Saved!";
          setTimeout(() => {
            btnDockSave.textContent = "Save";
            btnDockSave.disabled = false;
          }, 800);
        }
        if (btnDiffSave) {
          btnDiffSave.textContent = "Save Changes";
          btnDiffSave.disabled = false;
        }
        if (btnSaveFile) {
          const saveSpan = btnSaveFile.querySelector("span");
          if (saveSpan) saveSpan.textContent = "Saved!";
          setTimeout(() => {
            if (saveSpan) saveSpan.textContent = "Save";
          }, 800);
        }
        showToast(`Tersimpan: ${file.name}`);
      })
      .catch(err => {
        alert("Save error: " + err.message);
        if (btnDockSave) {
          btnDockSave.textContent = "Save";
          btnDockSave.disabled = false;
        }
        if (btnDiffSave) {
          btnDiffSave.textContent = "Save Changes";
          btnDiffSave.disabled = false;
        }
        if (btnSaveFile) {
          const saveSpan = btnSaveFile.querySelector("span");
          if (saveSpan) saveSpan.textContent = "Save";
        }
        updateSaveButtonState();
      });
  }

  function discardActiveFileChanges() {
    if (!state.activeFilePath) return;
    const file = state.openFiles.get(state.activeFilePath);
    if (!file || !file.isDirty) return;

    if (state.cmView) {
      state.cmView.dispatch({
        changes: {
          from: 0,
          to: state.cmView.state.doc.length,
          insert: file.originalContent
        }
      });
    }
    file.content = file.originalContent;
    file.isDirty = false;
    updateTabUI(state.activeFilePath);
    closeDiffModal();
    showToast("Perubahan dibatalkan");
  }

  function computeLineDiff(oldText, newText) {
    if (oldText === newText) return [];
    const a = oldText.split("\n");
    const b = newText.split("\n");
    const N = a.length;
    const M = b.length;

    if (N > 1200 || M > 1200) {
      return [{ type: "info", text: "Berkas terlalu besar untuk visual diff inline." }];
    }

    const dp = Array.from({ length: N + 1 }, () => new Int32Array(M + 1));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        if (a[i] === b[j]) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    const diff = [];
    let i = N, j = M;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        diff.unshift({ type: "same", oldNum: i, newNum: j, text: a[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: "add", newNum: j, text: b[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diff.unshift({ type: "del", oldNum: i, text: a[i - 1] });
        i--;
      }
    }
    return diff;
  }

  function renderDiffView(oldContent, newContent) {
    if (!diffContentEl) return;
    diffContentEl.innerHTML = "";
    const diff = computeLineDiff(oldContent, newContent);
    if (diff.length === 0) {
      diffContentEl.innerHTML = `<div class="diff-info">Tidak ada perbedaan dengan versi tersimpan.</div>`;
      return;
    }

    diff.forEach(item => {
      const row = document.createElement("div");
      row.className = `diff-line diff-${item.type}`;

      const numCol = document.createElement("span");
      numCol.className = "diff-line-num";
      if (item.type === "del") numCol.textContent = `-${item.oldNum}`;
      else if (item.type === "add") numCol.textContent = `+${item.newNum}`;
      else if (item.type === "same") numCol.textContent = item.newNum;
      else numCol.textContent = "";

      const textCol = document.createElement("span");
      textCol.className = "diff-line-text";
      const prefix = item.type === "del" ? "- " : (item.type === "add" ? "+ " : "  ");
      textCol.textContent = prefix + item.text;

      row.appendChild(numCol);
      row.appendChild(textCol);
      diffContentEl.appendChild(row);
    });
  }

  function openDiffModal() {
    if (!state.activeFilePath) return;
    const file = state.openFiles.get(state.activeFilePath);
    if (!file) return;

    const currentContent = state.cmView ? state.cmView.state.doc.toString() : file.content;
    if (diffModalTitle) diffModalTitle.textContent = `Perubahan: ${file.name}`;
    renderDiffView(file.originalContent, currentContent);
    if (diffModal) diffModal.style.display = "flex";
    if (diffModalBackdrop) diffModalBackdrop.style.display = "block";
  }

  function closeDiffModal() {
    if (diffModal) diffModal.style.display = "none";
    if (diffModalBackdrop) diffModalBackdrop.style.display = "none";
  }

  function renderTabs() {
    editorTabsContainer.innerHTML = "";
    state.openFiles.forEach((file, path) => {
      const tab = document.createElement("div");
      tab.className = `editor-tab ${path === state.activeFilePath ? "active" : ""}`;
      tab.title = path;

      const titleSpan = document.createElement("span");
      titleSpan.textContent = file.name;
      tab.appendChild(titleSpan);

      if (file.isDirty) {
        const dirtyDot = document.createElement("span");
        dirtyDot.className = "tab-dirty-indicator";
        tab.appendChild(dirtyDot);
      }

      const closeBtn = document.createElement("span");
      closeBtn.className = "tab-close";
      closeBtn.textContent = "×";
      closeBtn.onclick = (e) => closeFile(path, e);
      tab.appendChild(closeBtn);

      tab.onclick = () => setActiveFile(path);
      editorTabsContainer.appendChild(tab);
    });
  }

  function updateTabUI(filePath) {
    renderTabs();
    updateSaveButtonState();
  }

  // --- 8. Sidebar File Manager (Tree View) ---
  function fetchTree(path = null) {
    const targetPath = path || state.workspaceRoot;
    const url = `/api/files/tree?path=${encodeURIComponent(targetPath)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!path) {
          state.workspaceRoot = data.currentPath;
          state.treeData = data.items;
          renderTree(fileTreeContainer, data.items);
        }
      })
      .catch(err => {
        console.error("Error fetching file tree:", err);
      });
  }

  function getFileIconSvg(type, isDir, isOpen = false) {
    if (isDir) {
      if (isOpen) {
        return `<svg class="file-icon icon-folder-open" width="18" height="18" viewBox="0 0 24 24" fill="#e5c07b"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/><path d="M4 10h16v8H4z" fill="#f4cf8c"/></svg>`;
      }
      return `<svg class="file-icon icon-folder" width="18" height="18" viewBox="0 0 24 24" fill="#e5c07b"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
    }

    switch (type) {
      case "javascript":
        return `<svg class="file-icon icon-js" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#F7DF1E"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="10.5" font-weight="900" fill="#000" text-anchor="middle">JS</text></svg>`;
      case "typescript":
        return `<svg class="file-icon icon-ts" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#3178C6"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="10.5" font-weight="900" fill="#fff" text-anchor="middle">TS</text></svg>`;
      case "python":
        return `<svg class="file-icon icon-python" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11.9 2C8.7 2 7 3.3 7 5.2V7h5v1H5.5C3.6 8 2 9.6 2 11.5c0 2 1.6 3.5 3.5 3.5H7v-1.7C7 11.8 8.2 10.5 9.7 10.5h4.6c1.2 0 2.2-1 2.2-2.2V5.2C16.5 3.3 14.8 2 11.9 2zm-1.6 2c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#3776AB"/><path d="M12.1 22c3.2 0 4.9-1.3 4.9-3.2V17h-5v-1h6.5c1.9 0 3.5-1.6 3.5-3.5 0-2-1.6-3.5-3.5-3.5H17v1.7c0 1.5-1.2 2.8-2.7 2.8H9.7c-1.2 0-2.2 1-2.2 2.2v3.1c0 1.9 1.7 3.2 4.6 3.2zm1.6-2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" fill="#FFD438"/></svg>`;
      case "html":
        return `<svg class="file-icon icon-html" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 3l1.8 15.5L12 21l6.2-2.5L20 3H4z" fill="#E44D26"/><path d="M12 4.8v14.4l4.8-1.9 1.4-12.5H12z" fill="#F16529"/><path d="M8 8.5h8M8 12h7M9.5 15.5l2.5.7 2.5-.7" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case "css":
        return `<svg class="file-icon icon-css" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 3l1.8 15.5L12 21l6.2-2.5L20 3H4z" fill="#1572B6"/><path d="M12 4.8v14.4l4.8-1.9 1.4-12.5H12z" fill="#33A9DC"/><path d="M8 8.5h8M8 12h7M9.5 15.5l2.5.7 2.5-.7" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case "json":
        return `<svg class="file-icon icon-json" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#282c34" stroke="#d19a66" stroke-width="1.5"/><path d="M14 2v6h6" stroke="#d19a66" stroke-width="1.5"/><text x="12" y="16.5" font-family="monospace" font-size="8.5" font-weight="bold" fill="#d19a66" text-anchor="middle">{ }</text></svg>`;
      case "markdown":
        return `<svg class="file-icon icon-md" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#21252b" stroke="#61afef" stroke-width="1.5"/><path d="M6 15V9l2.5 3 2.5-3v6" stroke="#61afef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 12l-2 2.5h1.2V9h1.6v5.5H18L16 12z" fill="#61afef"/></svg>`;
      case "bash":
        return `<svg class="file-icon icon-bash" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="3" fill="#21252b" stroke="#98c379" stroke-width="1.5"/><path d="M6 9l3 3-3 3" stroke="#98c379" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="11" y1="15" x2="16" y2="15" stroke="#98c379" stroke-width="2" stroke-linecap="round"/></svg>`;
      case "rust":
        return `<svg class="file-icon icon-rust" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#dea584"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="10" font-weight="900" fill="#181a1f" text-anchor="middle">RS</text></svg>`;
      case "go":
        return `<svg class="file-icon icon-go" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#00ADD8"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">GO</text></svg>`;
      case "c":
      case "cpp":
        return `<svg class="file-icon icon-cpp" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#00599C"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">C++</text></svg>`;
      case "java":
      case "kotlin":
        return `<svg class="file-icon icon-kt" width="18" height="18" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="3" fill="#7F52FF"/><text x="12" y="15.5" font-family="monospace, sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">KT</text></svg>`;
      case "yaml":
      case "toml":
        return `<svg class="file-icon icon-cfg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#282c34" stroke="#e5c07b" stroke-width="1.5"/><path d="M14 2v6h6" stroke="#e5c07b" stroke-width="1.5"/><circle cx="10" cy="14" r="1.5" fill="#e5c07b"/><line x1="12" y1="14" x2="16" y2="14" stroke="#e5c07b" stroke-width="1.5"/></svg>`;
      case "sql":
        return `<svg class="file-icon icon-sql" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="1.5"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>`;
      case "xml":
        return `<svg class="file-icon icon-xml" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#56b6c2" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
      default:
        return `<svg class="file-icon icon-file" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#abb2bf" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`;
    }
  }

  function renderTree(container, items) {
    container.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = `tree-item ${item.path === state.activeFilePath ? "active" : ""}`;
      row.dataset.path = item.path;

      const icon = document.createElement("span");
      icon.className = "tree-item-icon";
      icon.innerHTML = getFileIconSvg(item.type, item.isDir, false);

      const label = document.createElement("span");
      label.className = "tree-item-label";
      label.textContent = item.name;

      row.appendChild(icon);
      row.appendChild(label);

      // Add three dots more button to sidebar tree as well!
      const moreBtn = document.createElement("span");
      moreBtn.className = "tree-item-more";
      moreBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8"/>
          <circle cx="12" cy="12" r="1.8"/>
          <circle cx="12" cy="19" r="1.8"/>
        </svg>
      `;
      moreBtn.title = "Opsi";
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        openContextMenu(item, e);
      };
      row.appendChild(moreBtn);

      if (item.isDir) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "tree-children";
        childrenContainer.style.display = "none";

        row.onclick = () => {
          const isOpen = childrenContainer.style.display === "block";
          if (isOpen) {
            childrenContainer.style.display = "none";
            icon.innerHTML = getFileIconSvg(item.type, true, false);
          } else {
            childrenContainer.style.display = "block";
            icon.innerHTML = getFileIconSvg(item.type, true, true);
            if (!childrenContainer.hasChildNodes()) {
              fetch(`/api/files/tree?path=${encodeURIComponent(item.path)}`)
                .then(r => r.json())
                .then(res => {
                  renderTree(childrenContainer, res.items);
                });
            }
          }
        };

        container.appendChild(row);
        container.appendChild(childrenContainer);
      } else {
        row.onclick = () => openFile(item.path);
        container.appendChild(row);
      }
    });
  }

  function highlightTreeItem(filePath) {
    const prev = fileTreeContainer.querySelector(".tree-item.active");
    if (prev) prev.classList.remove("active");

    const current = fileTreeContainer.querySelector(`.tree-item[data-path="${CSS.escape(filePath)}"]`);
    if (current) current.classList.add("active");
  }

  // --- 9. UI Helpers & Actions ---
  function setConnectionStatus(statusClass, label) {
    connectionStatus.className = `status-badge status-${statusClass}`;
    statusText.textContent = label;
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    appContainer.classList.remove("view-split", "view-editor", "view-terminal");
    appContainer.classList.add(mode);

    btnViewEditor.classList.toggle("active", mode === "view-editor");
    btnViewSplit.classList.toggle("active", mode === "view-split");
    btnViewTerminal.classList.toggle("active", mode === "view-terminal");

    if (mode !== "view-editor") {
      setTimeout(handleTerminalResize, 100);
    }

    if (mode !== "view-terminal" && state.cmView) {
      setTimeout(() => {
        try {
          state.cmView.requestMeasure();
          state.cmView.focus();
        } catch(e) {}
      }, 80);
    }
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function toggleSidebar() {
    if (isMobile()) {
      if (fileSidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    } else {
      fileSidebar.classList.toggle("collapsed");
      setTimeout(handleTerminalResize, 240);
    }
  }

  function openSidebar() {
    if (isMobile()) {
      fileSidebar.classList.add("open");
      sidebarBackdrop.classList.add("open");
    } else {
      fileSidebar.classList.remove("collapsed");
      setTimeout(handleTerminalResize, 240);
    }
  }

  function closeSidebar() {
    if (isMobile()) {
      fileSidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("open");
    } else {
      fileSidebar.classList.add("collapsed");
      setTimeout(handleTerminalResize, 240);
    }
  }

  function setupEventHandlers() {
    // Mode Switchers
    btnNavHome.onclick = () => setPageMode("home");
    btnNavWorkspace.onclick = () => setPageMode("workspace");

    // Home View Toolbar Handlers
    btnHomeUp.onclick = goHomeUp;
    btnHomeRefresh.onclick = () => navigateToHomeDirectory(state.homePath);
    homeSearchInput.oninput = () => renderHomeExplorer(state.homeItems);

    btnHomeOpenTerm.onclick = () => {
      const folderName = state.homePath === state.homeRoot ? "home" : (state.homePath.split("/").pop() || "Termux");
      createTerminalSession({ cwd: state.homePath, title: folderName });
      setPageMode("workspace");
      setViewMode("view-terminal");
      showToast(`Sesi Terminal baru di: ${folderName}`);
    };

    if (btnHomeOpenProject) {
      btnHomeOpenProject.onclick = () => {
        const folderName = state.homePath.split("/").filter(Boolean).pop() || "project";
        setProjectRoot(state.homePath, folderName, true);
        setPageMode("workspace");
      };
    }

    btnHomeNewFile.onclick = () => {
      const name = prompt("Nama file baru (e.g. index.js, script.py):");
      if (!name) return;
      const target = state.homePath + "/" + name;
      fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: target, isDir: false })
      })
      .then(r => r.json())
      .then(() => {
        showToast("File berhasil dibuat!");
        navigateToHomeDirectory(state.homePath);
        fetchTree();
        openFile(target);
        setPageMode("workspace");
      })
      .catch(err => alert("Error: " + err.message));
    };

    btnHomeNewFolder.onclick = () => {
      const name = prompt("Nama folder baru:");
      if (!name) return;
      const target = state.homePath + "/" + name;
      fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: target, isDir: true })
      })
      .then(r => r.json())
      .then(() => {
        showToast("Folder berhasil dibuat!");
        navigateToHomeDirectory(state.homePath);
        fetchTree();
      })
      .catch(err => alert("Error: " + err.message));
    };

    // Sidebar & Workspace Handlers
    btnToggleSidebar.onclick = toggleSidebar;
    if (btnCloseSidebar) btnCloseSidebar.onclick = closeSidebar;
    sidebarBackdrop.onclick = closeSidebar;

    // Scope Switcher Handlers
    if (btnScopeProject) {
      btnScopeProject.onclick = () => {
        setExplorerScope("project");
        showToast(`Mode Project: ${state.projectName}`);
      };
    }
    if (btnScopeRoot) {
      btnScopeRoot.onclick = () => {
        setExplorerScope("root");
        showToast("Mode Root: Menampilkan semua folder (~)");
      };
    }

    if (btnSwitchProject) btnSwitchProject.onclick = openProjectPicker;
    if (sidebarRootInfo) sidebarRootInfo.onclick = openProjectPicker;
    if (btnCloseProjectPicker) btnCloseProjectPicker.onclick = closeProjectPicker;
    if (projectPickerBackdrop) projectPickerBackdrop.onclick = closeProjectPicker;

    if (btnPickCustomPath) {
      btnPickCustomPath.onclick = () => {
        closeProjectPicker();
        const p = prompt("Masukkan path absolut folder project:", state.projectRoot);
        if (p && p.trim()) {
          setProjectRoot(p.trim(), null, true);
          setPageMode("workspace");
        }
      };
    }

    if (btnBrowseInHome) {
      btnBrowseInHome.onclick = () => {
        closeProjectPicker();
        setPageMode("home");
        navigateToHomeDirectory(state.projectRoot);
        showToast("Pilih folder lalu gunakan 'Set as Project' atau menu '...'");
      };
    }

    btnViewEditor.onclick = () => setViewMode("view-editor");
    btnViewSplit.onclick = () => setViewMode("view-split");
    btnViewTerminal.onclick = () => setViewMode("view-terminal");

    if (btnSaveFile) btnSaveFile.onclick = saveActiveFile;
    if (btnDockSave) btnDockSave.onclick = saveActiveFile;
    if (btnDockDiscard) btnDockDiscard.onclick = discardActiveFileChanges;
    if (btnDockDiff) btnDockDiff.onclick = openDiffModal;
    if (btnCloseDiffModal) btnCloseDiffModal.onclick = closeDiffModal;
    if (diffModalBackdrop) diffModalBackdrop.onclick = closeDiffModal;
    if (btnDiffDiscard) btnDiffDiscard.onclick = discardActiveFileChanges;
    if (btnDiffSave) btnDiffSave.onclick = saveActiveFile;
    btnRefreshTree.onclick = () => fetchTree();

    btnNewFile.onclick = () => {
      const name = prompt(`Nama file baru (${state.explorerScope === "project" ? state.projectName : "root"}):`);
      if (!name) return;
      const targetPath = (state.workspaceRoot || "") + "/" + name;
      fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, isDir: false })
      })
      .then(r => r.json())
      .then(() => {
        fetchTree();
        openFile(targetPath);
      })
      .catch(err => alert("Error: " + err.message));
    };

    btnNewFolder.onclick = () => {
      const name = prompt(`Nama folder baru (${state.explorerScope === "project" ? state.projectName : "root"}):`);
      if (!name) return;
      const targetPath = (state.workspaceRoot || "") + "/" + name;
      fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, isDir: true })
      })
      .then(r => r.json())
      .then(() => fetchTree())
      .catch(err => alert("Error: " + err.message));
    };

    btnTermClear.onclick = () => {
      const session = getActiveTerminalSession();
      if (session) {
        session.term.clear();
        sendTerminalInput("clear\r");
      }
    };

    btnTermReconnect.onclick = () => {
      const session = getActiveTerminalSession();
      if (session) {
        connectSessionWebSocket(session, true);
        showToast(`Menyambungkan ulang: ${session.title}`);
      }
    };
  }

  // --- 10. Horizontal Panel Resizer (Left-Right Split) ---
  function setupResizer() {
    const resizer = document.getElementById("panel-resizer");
    const editor = document.getElementById("editor-section");
    const container = document.querySelector(".content-panel");
    if (!resizer || !editor || !container) return;

    let isDragging = false;

    function onPointerDown(e) {
      isDragging = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = container.getBoundingClientRect();
      const offset = clientX - rect.left;
      const totalWidth = rect.width;
      const percent = Math.min(Math.max((offset / totalWidth) * 100, 15), 85);
      editor.style.flex = "none";
      editor.style.width = `${percent}%`;
      handleTerminalResize();
    }

    function onPointerUp() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        handleTerminalResize();
      }
    }

    resizer.addEventListener("mousedown", onPointerDown);
    resizer.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);
  }

  // --- 11. Quick Command Input Bar & Attach File ---
  function autoResizeTerminalCmd() {
    if (!terminalCmdInput) return;
    terminalCmdInput.style.height = "auto";
    const minH = 34;
    const maxH = 140;
    const scrollH = terminalCmdInput.scrollHeight;
    const targetH = Math.min(Math.max(scrollH, minH), maxH);
    terminalCmdInput.style.height = `${targetH}px`;
    terminalCmdInput.style.overflowY = scrollH > maxH ? "auto" : "hidden";
  }

  function insertTextIntoCmdInput(textToInsert) {
    if (!terminalCmdInput) return;
    const current = terminalCmdInput.value;
    if (!current) {
      terminalCmdInput.value = textToInsert;
    } else if (current.endsWith(" ") || current.endsWith("\n")) {
      terminalCmdInput.value = current + textToInsert;
    } else {
      terminalCmdInput.value = current + " " + textToInsert;
    }
    terminalCmdInput.focus();
    autoResizeTerminalCmd();
  }

  function toggleAttachMenu(show = null) {
    if (!attachDropdownMenu) return;
    const isVisible = attachDropdownMenu.style.display === "flex";
    const nextState = (show !== null) ? show : !isVisible;
    attachDropdownMenu.style.display = nextState ? "flex" : "none";
  }

  function handleDeviceFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const activeSession = getActiveTerminalSession();
    const targetDir = activeSession ? activeSession.cwd : state.workspaceRoot;

    const formData = new FormData();
    formData.append("targetDir", targetDir);
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    showToast("Mengupload berkas ke terminal...");

    fetch("/api/files/upload", {
      method: "POST",
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(data => {
      const uploaded = data.uploaded || [];
      if (uploaded.length > 0) {
        const paths = uploaded.map(u => {
          const fname = u.name;
          return fname.includes(" ") ? `"${fname}"` : fname;
        }).join(" ");

        insertTextIntoCmdInput(paths);
        showToast(`Berhasil attach ${uploaded.length} berkas! Path disisipkan.`);
        fetchTree();
      }
    })
    .catch(err => {
      console.error("Error uploading file:", err);
      showToast(`Gagal upload: ${err.message}`);
    })
    .finally(() => {
      if (terminalFileInput) terminalFileInput.value = "";
    });
  }

  function openWorkspaceFilePicker() {
    toggleAttachMenu(false);
    if (!workspacePickerModal) return;
    workspacePickerBackdrop.style.display = "block";
    workspacePickerModal.style.display = "flex";
    if (workspacePickerSearch) {
      workspacePickerSearch.value = "";
      setTimeout(() => workspacePickerSearch.focus(), 100);
    }

    const root = state.workspaceRoot || state.projectRoot;
    fetch(`/api/files/tree?path=${encodeURIComponent(root)}&depth=3`)
      .then(res => res.json())
      .then(data => {
        state.workspaceFileList = [];
        collectFilesRecursively(data.items || [], root);
        renderWorkspaceFileList();
      })
      .catch(err => {
        console.error("Error fetching workspace files:", err);
      });
  }

  function collectFilesRecursively(items, baseDir) {
    items.forEach(item => {
      if (item.isDir) {
        if (item.children && Array.isArray(item.children)) {
          collectFilesRecursively(item.children, baseDir);
        }
      } else {
        let relative = item.path;
        if (relative.startsWith(baseDir)) {
          relative = relative.slice(baseDir.length);
          if (relative.startsWith("/")) relative = relative.slice(1);
        }
        state.workspaceFileList.push({
          name: item.name,
          path: item.path,
          relativePath: relative,
          type: item.type
        });
      }
    });
  }

  function closeWorkspaceFilePicker() {
    if (!workspacePickerModal) return;
    workspacePickerBackdrop.style.display = "none";
    workspacePickerModal.style.display = "none";
  }

  function renderWorkspaceFileList() {
    if (!workspacePickerList) return;
    workspacePickerList.innerHTML = "";

    const query = (workspacePickerSearch ? workspacePickerSearch.value : "").trim().toLowerCase();
    const list = state.workspaceFileList || [];
    const filtered = query
      ? list.filter(f => f.name.toLowerCase().includes(query) || f.relativePath.toLowerCase().includes(query))
      : list;

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "text-align: center; color: var(--text-muted); padding: 24px 10px; font-size: 12px;";
      empty.textContent = query ? "Tidak ada berkas yang cocok" : "Tidak ada berkas di workspace";
      workspacePickerList.appendChild(empty);
      return;
    }

    filtered.forEach(file => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "project-picker-item";
      btn.innerHTML = `
        <div class="project-picker-item-left">
          ${getFileIconSvg(file.type, false)}
          <div style="overflow: hidden; text-align: left;">
            <div class="project-picker-item-name">${file.name}</div>
            <div class="project-picker-item-path">${file.relativePath}</div>
          </div>
        </div>
      `;

      btn.onclick = () => {
        closeWorkspaceFilePicker();
        const formattedPath = file.relativePath.includes(" ") ? `"${file.relativePath}"` : file.relativePath;
        insertTextIntoCmdInput(formattedPath);
        showToast(`Path disisipkan: ${file.name}`);
      };

      workspacePickerList.appendChild(btn);
    });
  }

  function setupCommandInput() {
    if (btnTermFocus) {
      btnTermFocus.onclick = () => {
        focusTerminal();
        if (terminalCmdInput) terminalCmdInput.focus();
      };
    }

    function sendCurrentCommand() {
      if (!terminalCmdInput) return;
      const text = terminalCmdInput.value;
      if (!text) {
        sendTerminalInput("\r");
        return;
      }

      const trimmed = text.trimEnd();
      const hasNewlines = trimmed.includes("\n") || trimmed.includes("\r");

      if (hasNewlines) {
        // Normalize newlines to \n for clean multiline payload
        const normalized = trimmed.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        // Wrap with bracketed paste escape sequences (\x1b[200~ ... \x1b[201~)
        // so that the entire multiline block is received simultaneously by the CLI
        // (like agy, claude, bash, python) without executing line-by-line prematurely.
        const bracketedPayload = `\x1b[200~${normalized}\x1b[201~\r`;
        sendTerminalInput(bracketedPayload);
      } else {
        // Single line command: send with carriage return
        sendTerminalInput(trimmed + "\r");
      }

      terminalCmdInput.value = "";
      autoResizeTerminalCmd();
    }

    if (terminalCmdInput) {
      // Auto-resize textarea on input (typing, pasting, deleting, etc.)
      terminalCmdInput.addEventListener("input", autoResizeTerminalCmd);

      terminalCmdInput.addEventListener("keydown", (e) => {
        // Ctrl + Enter or Cmd + Enter: always sends command
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sendCurrentCommand();
          return;
        }

        // Shift + Enter: always inserts newline (multiline support), never sends
        if (e.key === "Enter" && e.shiftKey) {
          setTimeout(autoResizeTerminalCmd, 0);
          return;
        }

        // Enter key (without Shift / Ctrl / Meta):
        if (e.key === "Enter") {
          // Detect virtual keyboard or touch-primary mobile environment
          const isTouch = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
          const isVirtualKb = isTouch && (
            isMobile() || 
            !e.code || 
            e.code === "Unidentified" || 
            e.isComposing || 
            e.keyCode === 229 ||
            (window.matchMedia && !window.matchMedia("(pointer: fine)").matches)
          );

          if (isVirtualKb) {
            // In virtual keyboard, pressing newline key must NOT send the chat;
            // it inserts a newline just like standard chat apps.
            setTimeout(autoResizeTerminalCmd, 0);
            return;
          }

          // On physical keyboard (Desktop / external keyboard), Enter sends the chat
          e.preventDefault();
          sendCurrentCommand();
        }
      });

      // Initial size calculation
      autoResizeTerminalCmd();
    }

    if (btnSendCmd) {
      btnSendCmd.onclick = sendCurrentCommand;
    }

    // Attach File Handlers
    if (btnAttachFile) {
      btnAttachFile.onclick = (e) => {
        e.stopPropagation();
        toggleAttachMenu();
      };
    }

    if (attachOptDevice) {
      attachOptDevice.onclick = () => {
        toggleAttachMenu(false);
        if (terminalFileInput) terminalFileInput.click();
      };
    }

    if (attachOptWorkspace) {
      attachOptWorkspace.onclick = () => {
        toggleAttachMenu(false);
        openWorkspaceFilePicker();
      };
    }

    if (terminalFileInput) {
      terminalFileInput.onchange = handleDeviceFileUpload;
    }

    if (btnCloseWorkspacePicker) btnCloseWorkspacePicker.onclick = closeWorkspaceFilePicker;
    if (workspacePickerBackdrop) workspacePickerBackdrop.onclick = closeWorkspaceFilePicker;

    if (workspacePickerSearch) {
      workspacePickerSearch.oninput = renderWorkspaceFileList;
    }

    // Close attach menu when clicking outside
    document.addEventListener("click", (e) => {
      if (attachDropdownMenu && attachDropdownMenu.style.display === "flex") {
        if (!e.target.closest(".attach-wrapper")) {
          toggleAttachMenu(false);
        }
      }
    });
  }

  // --- 12. Bootstrap Initialization ---
  function init() {
    setupEventHandlers();
    setupContextMenuActions();
    setupResizer();
    setupCommandInput();
    setupVirtualKeys();
    initTerminalSystem();
    updateSaveButtonState();

    // Fetch initial status and root path
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        state.homeRoot = data.home || data.workspace || "/data/data/com.termux/files/home";
        state.defaultProjectRoot = data.project || "/data/data/com.termux/files/home/projects/termux-code";
        state.defaultProjectName = data.projectName || "termux-code";

        const savedProject = localStorage.getItem("termux_code_project_path");
        const savedProjectName = localStorage.getItem("termux_code_project_name");
        if (savedProject) {
          state.projectRoot = savedProject;
          state.projectName = savedProjectName || savedProject.split("/").filter(Boolean).pop() || "project";
        } else {
          state.projectRoot = state.defaultProjectRoot;
          state.projectName = state.defaultProjectName;
        }

        const savedScope = localStorage.getItem("termux_code_explorer_scope") || "project";
        setExplorerScope(savedScope, false);

        state.homePath = state.homeRoot;
        setPageMode("home"); // Open default at Home Fullscreen Explorer
        navigateToHomeDirectory(state.homePath);
        fetchTree();
        createTerminalSession({ cwd: state.homeRoot, title: "home" });
      })
      .catch(() => {
        const savedScope = localStorage.getItem("termux_code_explorer_scope") || "project";
        setExplorerScope(savedScope, false);
        setPageMode("home");
        navigateToHomeDirectory(state.homeRoot);
        fetchTree();
        createTerminalSession({ cwd: state.homeRoot, title: "home" });
      });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
