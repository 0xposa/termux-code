import os
import sys
import unittest

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import file_manager
from server.pty_manager import PtySession

class TestTermuxCodeBackend(unittest.TestCase):

    def test_file_type_detection(self):
        self.assertEqual(file_manager.get_file_type("main.py"), "python")
        self.assertEqual(file_manager.get_file_type("app.js"), "javascript")
        self.assertEqual(file_manager.get_file_type("styles.css"), "css")
        self.assertEqual(file_manager.get_file_type("index.html"), "html")
        self.assertEqual(file_manager.get_file_type("README.md"), "markdown")

    def test_file_crud_operations(self):
        test_file = "/data/data/com.termux/files/home/projects/termux-code/test_sample.txt"
        
        # Write
        content = "Hello from Termux Code Test!"
        success = file_manager.write_file(test_file, content)
        self.assertTrue(success)
        self.assertTrue(os.path.exists(test_file))

        # Read
        data = file_manager.read_file(test_file)
        self.assertEqual(data["content"], content)
        self.assertEqual(data["name"], "test_sample.txt")

        # Delete
        file_manager.delete_entry(test_file)
        self.assertFalse(os.path.exists(test_file))

    def test_pty_session(self):
        session = PtySession(cols=80, rows=24)
        session.start()
        self.assertTrue(session.alive)
        self.assertIsNotNone(session.master_fd)

        initial_cwd = session.get_cwd()
        self.assertIsNotNone(initial_cwd)

        # Write command to shell
        session.write("echo 'PTY_TEST_OK'\n")
        
        import time
        output = ""
        for _ in range(20):
            time.sleep(0.05)
            chunk = session.read()
            if chunk:
                output += chunk
                if "PTY_TEST_OK" in output:
                    break

        # Test cd tracking
        session.write("cd /data/data/com.termux/files/home\n")
        for _ in range(10):
            time.sleep(0.05)
            session.read()
        home_cwd = session.get_cwd()
        self.assertEqual(home_cwd, "/data/data/com.termux/files/home")

        session.close()
        self.assertIn("PTY_TEST_OK", output)
        print("\n✅ PTY Spawn, Command Execution & CWD Tracking Verified Successfully!")

    def test_status_and_project_endpoints(self):
        import asyncio
        from server.main import get_status, list_projects, get_tree, PROJECT_ROOT, BASE_WORKSPACE

        # Test Status
        status = asyncio.run(get_status())
        self.assertEqual(status["status"], "online")
        self.assertEqual(status["project"], PROJECT_ROOT)
        self.assertEqual(status["home"], BASE_WORKSPACE)
        self.assertEqual(status["projectName"], os.path.basename(PROJECT_ROOT))

        # Test List Projects
        projects_data = asyncio.run(list_projects())
        self.assertIn("projects", projects_data)
        self.assertTrue(any(p["isCurrent"] for p in projects_data["projects"]))
        self.assertEqual(projects_data["current"], PROJECT_ROOT)

        # Test Tree for Project (Default)
        project_tree = asyncio.run(get_tree())
        self.assertEqual(project_tree["currentPath"], PROJECT_ROOT)
        item_names = [i["name"] for i in project_tree["items"]]
        self.assertIn("server", item_names)
        self.assertIn("web", item_names)
        self.assertIn("README.md", item_names)

        # Test Tree for Root (Home)
        root_tree = asyncio.run(get_tree(path=BASE_WORKSPACE))
        self.assertEqual(root_tree["currentPath"], BASE_WORKSPACE)
        root_item_names = [i["name"] for i in root_tree["items"]]
        self.assertIn("projects", root_item_names)

if __name__ == "__main__":
    unittest.main()
