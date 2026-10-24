"""Shared test environment configuration."""

import os

os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
