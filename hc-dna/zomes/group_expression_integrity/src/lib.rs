use hdi::prelude::*;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone, SerializedBytes, Debug)]
pub struct ExpressionProof {
    pub signature: String,
    pub key: String,
}

#[derive(Serialize, Deserialize, Clone, SerializedBytes, Debug)]
pub struct GroupExpression {
    author: String,
    timestamp: DateTime<Utc>,    
    data: Group,
    proof: ExpressionProof,
}

app_entry!(GroupExpression);

#[derive(Serialize, Deserialize, Clone, SerializedBytes, Debug)]
pub struct Group {
    pub name: String,
    pub description: String,
    pub image_address: String,
    pub thumbnail_address: String
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(visibility = "public")]
    GroupExpression(GroupExpression)
}
