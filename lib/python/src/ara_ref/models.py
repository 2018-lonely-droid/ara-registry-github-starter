import re
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, AnyUrl, field_validator, model_validator

# Semantic versioning pattern from the JSON schema
SEMVER_PATTERN = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)"
    r"(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?"
    r"(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
)

# Tag pattern from the JSON schema
TAG_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


class PackageType(str, Enum):
    KIRO_AGENT = "kiro-agent"
    MCPSERVER = "mcp-server"
    CONTEXT = "context"
    SKILL = "skill"
    KIRO_POWERS = "kiro-powers"
    KIRO_STEERING = "kiro-steering"
    AGENTS_MD = "agents-md"


class SourceType(str, Enum):
    NPM = "npm"
    PYPI = "pypi"
    GIT = "git"
    MCP_REGISTRY = "mcp-registry"


class PackageSource(BaseModel):
    type: SourceType
    package: Optional[str] = None
    version: Optional[str] = None
    registry: Optional[AnyUrl] = None
    repository: Optional[AnyUrl] = None
    ref: Optional[str] = None
    subfolder: Optional[str] = None
    install_command: Optional[str] = Field(None, alias="installCommand")
    executable: Optional[str] = None
    preferred: Optional[bool] = None

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def validate_conditional_fields(self):
        """Validate conditionally required fields based on source type."""
        if self.type in (SourceType.NPM, SourceType.PYPI, SourceType.MCP_REGISTRY):
            if self.package is None:
                raise ValueError(f"'package' is required for {self.type.value} source type")
        elif self.type == SourceType.GIT:
            if self.repository is None:
                raise ValueError("'repository' is required for git source type")
        return self


class ARAManifest(BaseModel):
    name: str = Field(..., pattern=r"^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$", min_length=3, max_length=200)
    version: str
    description: str = Field(..., min_length=1, max_length=500)
    author: EmailStr
    tags: list[str] = Field(..., min_length=1)
    type: PackageType = PackageType.KIRO_AGENT
    files: Optional[list[str]] = None
    license: Optional[str] = Field(None, max_length=100)
    homepage: Optional[AnyUrl] = None
    repository: Optional[AnyUrl] = None
    dependencies: Optional[dict[str, str]] = None
    externalDependencies: Optional[list[dict]] = None
    sources: Optional[list[PackageSource]] = None

    model_config = {"populate_by_name": True}

    @field_validator("version")
    @classmethod
    def validate_version(cls, v):
        if not SEMVER_PATTERN.match(v):
            raise ValueError(f"version must be a valid semantic version (e.g., '1.0.0'), got: {v}")
        return v

    @field_validator("sources")
    @classmethod
    def sources_only_for_mcpserver(cls, v, info):
        if v is not None and info.data.get("type") != PackageType.MCPSERVER:
            raise ValueError("sources field is only allowed for mcp-server type")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        for tag in v:
            if not tag or len(tag) > 50:
                raise ValueError(f"Invalid tag length: '{tag}' (must be 1-50 characters)")
            if not TAG_PATTERN.match(tag):
                raise ValueError(f"Invalid tag format: '{tag}' (must match ^[a-zA-Z0-9_-]+$)")
        return v
