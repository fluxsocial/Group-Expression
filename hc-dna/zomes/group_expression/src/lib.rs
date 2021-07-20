use chrono::{DateTime, Utc};
use hdk::prelude::*;

mod inputs;
mod methods;
mod outputs;
mod utils;
mod impls;
mod errors;

use inputs::*;
use outputs::*;

/// Expression data this DNA is "hosting"
#[hdk_entry(id = "group_expression", visibility = "public")]
#[derive(Clone)]
pub struct GroupExpression {
    data: GroupExpressionData,
    author: String,
    timestamp: DateTime<Utc>,
    proof: ExpressionProof,
}

#[derive(Serialize, Deserialize, Clone, SerializedBytes, Debug)]
pub struct GroupExpressionData {
    name: String,
    description: String,
}

pub struct ExpressionDNA();

entry_defs![
    GroupExpression::entry_def(),
    Path::entry_def()
];

// Zome functions

/// Run function where zome is init'd by agent. This adds open cap grant for recv_private_expression function
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

/// Create an expression and link it to yourself publicly
#[hdk_extern]
pub fn create_public_expression(create_data: CreateExpression) -> ExternResult<ExpressionResponse> {
    Ok(ExpressionDNA::create_public_expression(create_data).map_err(|err| WasmError::Host(err.to_string()))?)
}

/// Get expressions authored by a given Agent/Identity
#[hdk_extern]
pub fn get_by_author(get_data: GetByAuthor) -> ExternResult<ManyExpressionResponse> {
    Ok(ManyExpressionResponse(ExpressionDNA::get_by_author(
        get_data.author,
        get_data.from,
        get_data.until,
    ).map_err(|err| WasmError::Host(err.to_string()))?))
}

#[hdk_extern]
pub fn get_expression_by_address(address: AnyDhtHash) -> ExternResult<MaybeExpression> {
    Ok(MaybeExpression(ExpressionDNA::get_expression_by_address(
        address,
    ).map_err(|err| WasmError::Host(err.to_string()))?))
}

/// Allows for describing what other DNA's should be installed in addition to this one
/// This is useful if the implementing expression DNA wishes to create some dependency on another DNA
/// Example could be a storage DNA
#[hdk_extern]
pub fn required_dnas(_: ()) -> ExternResult<ManyDhtHash> {
    Ok(ManyDhtHash(vec![]))
}

// Validation functions
