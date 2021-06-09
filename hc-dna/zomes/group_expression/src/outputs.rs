use hdk::prelude::*;
use holo_hash::DnaHash;
use chrono::{DateTime, Utc};

use crate::{Agent, GroupExpression};

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct ContextSchema {
    pub schema: String,
    pub did: String,
    pub sec: String,
    pub foaf: String
}

impl Default for ContextSchema {
    fn default() -> Self {
        ContextSchema {
            schema: String::from("https://schema.org/"),
            did: String::from("https://www.w3.org/ns/did/v1/"),
            sec: String::from("https://w3id.org/security/v2/"),
            foaf: String::from("http://xmlns.com/foaf/0.1/"),
        }
    }
}

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct GroupExpressionResponse {
    #[serde(default)]
    #[serde(rename(serialize = "@context", deserialize = "@context"))]
    context: ContextSchema,
    #[serde(default = "default_type")]
    #[serde(rename(serialize = "@type", deserialize = "@type"))]
    r#type: String,
    #[serde(rename(serialize = "foaf:name", deserialize = "foaf:name"))]
    name: String,
    #[serde(rename(serialize = "schema:description", deserialize = "schema:description"))]
    description: String,
    #[serde(rename(serialize = "schema:dateCreated", deserialize = "schema:dateCreated"))]
    created: DateCreated,
    #[serde(rename(serialize = "schema:agent", deserialize = "schema:agent"))]
    agent: AgentResponse,
    #[serde(rename(serialize = "sec:proof", deserialize = "sec:proof"))]
    proof: ExpressionProofResponse
}

#[derive(Serialize, Deserialize, Clone, Debug, SerializedBytes)]
pub struct AgentResponse {
    #[serde(rename(serialize = "did:id"))]
    pub did: String,
    #[serde(rename(serialize = "schema:givenName"))]
    pub name: Option<String>,
    #[serde(rename(serialize = "schema:email"))]
    pub email: Option<String>,
}


#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct ExpressionProofResponse {
    #[serde(default = "default_proof_type")]
    #[serde(rename(serialize = "@type", deserialize = "@type"))]
    r#type: String,
    #[serde(rename(serialize = "sec:created", deserialize = "sec:created"))]
    created: DateTime<Utc>,
    #[serde(rename(serialize = "sec:verificationMethod", deserialize = "sec:verificationMethod"))]
    verification_method: String,
    #[serde(rename(serialize = "sec:proofPurpose", deserialize = "sec:proofPurpose"))]
    #[serde(default = "default_proof_purpose")]
    proof_purpose: String,
    #[serde(rename(serialize = "sec:jws", deserialize = "sec:jws"))]
    jws: String
}

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct DateCreated {
    #[serde(rename(serialize = "@type", deserialize = "@type"))]
    r#type: String,
    #[serde(rename(serialize = "@value", deserialize = "@value"))]
    value: DateTime<Utc>
}

fn default_type() -> String {
    String::from("foaf:group")
}

fn default_proof_type() -> String {
    String::from("sec:EcdsaSecp256k1Signature2019")
}

fn default_proof_purpose() -> String {
    String::from("authentification")
}

fn default_date_type() -> String {
    String::from("schema:DateTime")
}

impl From<GroupExpression> for GroupExpressionResponse {
    fn from(value: GroupExpression) -> Self {
        GroupExpressionResponse {
            context: ContextSchema::default(),
            r#type: default_type(),
            name: value.data.name,
            description: value.data.description,
            created: DateCreated {
                r#type: default_date_type(),
                value: value.timestamp
            },
            agent: AgentResponse::from(value.author),
            proof: ExpressionProofResponse {
                r#type: default_proof_type(),
                created: value.timestamp,
                verification_method: value.proof.key,
                proof_purpose: default_proof_purpose(),
                jws: value.proof.signature
            }
        }
    }
}

impl From<Agent> for AgentResponse {
    fn from(value: Agent) -> Self {
        AgentResponse {
            did: value.did,
            email: value.email,
            name: value.name
        }
    }
}

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct ExpressionResponse {
    pub expression_data: GroupExpressionResponse,
    pub holochain_data: HolochainData,
}

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct HolochainData {
    pub element: Element,
    pub expression_dna: DnaHash,
    pub creator: AgentPubKey,
    pub created_at: chrono::DateTime<chrono::Utc>,
}


#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct ManyExpressionResponse(pub Vec<ExpressionResponse>);

#[derive(SerializedBytes, Serialize, Deserialize, Debug)]
pub struct MaybeExpression(pub Option<ExpressionResponse>);

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct ManyDhtHash(pub Vec<DnaHash>);
