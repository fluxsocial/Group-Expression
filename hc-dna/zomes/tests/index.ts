import { Scenario, runScenario } from '@holochain/tryorama'
import path from 'path'
import test from "tape-promise/tape";

const dnas = [{ path: path.join("../../workdir/group-expression.dna") }];

//@ts-ignore
test("Create create and get agent expression", async (t) => {
  await runScenario(async (scenario: Scenario) => {
    const [alice] = await scenario.addPlayersWithHapps([dnas, dnas]);

    await scenario.shareAllAgents();
     
    let hash = await alice.cells[0].callZome({
      zome_name: "group_expression", 
      fn_name: "create_expression",  
      payload: {
        author: "did:key:zQ3shc5AcaZyRo6qP3wuXvYT8xtiyFFL25RjMEuT81WMHEibC",
        timestamp: new Date().toISOString(),
        data: {
          name: "Group name",
          description: "Group description",
          image_address: "imageAddr",
          thumbnail_address: "thumbnailAddr"
        },
        proof: {
          signature: "sig",
          key: "key",
          valid: true,
          invalid: false,
        },
      }
    })
    t.ok(hash);
    console.warn("Got hash", hash);
    
    let getResp = await alice.cells[0].callZome({
      zome_name: "group_expression", 
      fn_name: "get_expression_by_address", 
      payload: hash
    });
    console.warn("Got resp", getResp);
    t.ok(getResp);
    //@ts-ignore
    t.equal(getResp.data.name, "Group name");

    await scenario.cleanUp();
  })
})