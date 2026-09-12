#!/usr/bin/env python3
"""
Test runner for CORVUS test suite.
Supports pytest if installed, or falls back to unittest.
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

def run_tests():
    try:
        import pytest
        print("Running tests with pytest...")
        sys.exit(pytest.main([os.path.join(root_dir, "tests")]))
    except ImportError:
        import unittest
        print("pytest not installed globally. Running tests with unittest...")
        loader = unittest.TestLoader()
        suite = loader.discover(os.path.join(root_dir, "tests"))
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        sys.exit(0 if result.wasSuccessful() else 1)

if __name__ == "__main__":
    run_tests()
