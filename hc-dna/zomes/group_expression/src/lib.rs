use hdk::prelude::*;
use group_expression_integrity::{EntryTypes, GroupExpression};

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
pub fn create_expression(input: GroupExpression) -> ExternResult<EntryHash> {
    let entry_hash = hash_entry(input.clone())?;
    create_entry(&EntryTypes::GroupExpression(input))?;
    Ok(entry_hash)
}

#[hdk_extern]
pub fn get_expression_by_address(input: EntryHash) -> ExternResult<Option<GroupExpression>> {
    let optional_element = get(input, GetOptions::default())?;
    if let Some(element) = optional_element {
        let expression: GroupExpression = element
            .entry()
            .to_app_option::<GroupExpression>()
            .map_err(|err| wasm_error!(WasmErrorInner::Host(err.to_string())))?
            .ok_or(wasm_error!(WasmErrorInner::Host(
                "Expected record to contain app data".to_string()
            )))?;

        return Ok(Some(expression));
    }

    Ok(None)
}
