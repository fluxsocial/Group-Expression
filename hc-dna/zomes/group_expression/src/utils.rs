use hdk::prelude::*;
use agent_store_integrity::LinkTypes;

pub (crate) fn err(reason: &str) -> WasmError {
    wasm_error!(WasmErrorInner::Host(String::from(reason)))
}
