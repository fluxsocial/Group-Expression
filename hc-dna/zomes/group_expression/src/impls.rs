use hc_time_index::IndexableEntry;
use hdk::prelude::*;
use chrono::{Utc, DateTime};

use crate::GroupExpression;

impl IndexableEntry for GroupExpression {
    fn entry_time(&self) -> DateTime<Utc> {
        self.timestamp
    }
    
    fn hash(&self) -> ExternResult<EntryHash> {
        hash_entry(self)
    }
}