use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum PackageType {
    #[default]
    KiroAgent,
    McpServer,
    Context,
    Skill,
    KiroPowers,
    KiroSteering,
    AgentsMd,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SourceType {
    Npm,
    Pypi,
    Git,
    McpRegistry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageSource {
    #[serde(rename = "type")]
    pub source_type: SourceType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registry: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository: Option<String>,
    #[serde(rename = "ref", skip_serializing_if = "Option::is_none")]
    pub git_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subfolder: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub install_command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub executable: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preferred: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ARAManifest {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub tags: Vec<String>,
    #[serde(default, rename = "type")]
    pub r#type: PackageType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub files: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository: Option<String>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub dependencies: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sources: Option<Vec<PackageSource>>,
}

impl Default for ARAManifest {
    fn default() -> Self {
        Self {
            name: String::new(),
            version: String::new(),
            description: String::new(),
            author: String::new(),
            tags: Vec::new(),
            r#type: PackageType::default(),
            files: None,
            license: None,
            homepage: None,
            repository: None,
            dependencies: HashMap::new(),
            sources: None,
        }
    }
}
