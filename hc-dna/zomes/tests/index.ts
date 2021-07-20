import { Orchestrator, Config, InstallAgentsHapps } from '@holochain/tryorama'
import { TransportConfigType, ProxyAcceptConfig, ProxyConfigType } from '@holochain/tryorama'
import { HoloHash, InstallAppRequest } from '@holochain/conductor-api'
import path from 'path'

const network = {
    transport_pool: [{
      type: TransportConfigType.Proxy,
      sub_transport: {type: TransportConfigType.Quic},
      proxy_config: {
        type: ProxyConfigType.LocalProxyServer,
        proxy_accept_config: ProxyAcceptConfig.AcceptAll
      }
    }],
    bootstrap_service: "https://bootstrap.holo.host"
};
//const conductorConfig = Config.gen({network});
const conductorConfig = Config.gen();

// Construct proper paths for your DNAs
const shortForm = path.join(__dirname, '../../workdir/group-expression.dna')

// create an InstallAgentsHapps array with your DNAs to tell tryorama what
// to install into the conductor.
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [shortForm] // contains 1 dna, the "shortform" dna
  ]
]

const orchestrator = new Orchestrator()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

orchestrator.registerScenario("create and get public expression", async (s, t) => {
  const [alice, bob] = await s.players([conductorConfig, conductorConfig])
  const [[alice_happ]] = await alice.installAgentsHapps(installation)
  //const [[bob_happ]] = await bob.installAgentsHapps(installation)

  //Create a public expression from alice
  const create_exp = await alice_happ.cells[0].call("group-expression", "create_public_expression", 
    {data: JSON.stringify({description: "My group description", name: "My group"}), author: "did://alice", timestamp: new Date().toISOString(), proof: {key: "key", signature: "sig"}})
  console.log("Created expression", create_exp);
  t.notEqual(create_exp.expression_data, undefined);
  
  sleep(1000);
  //Create another time index
  var dateOffset = (24*60*60*1000) / 2; //12 hr ago
  var date = new Date();
  date.setTime(date.getTime() - dateOffset);

  let current = new Date().toISOString();
  console.log("Getting date", current);
  //Get agent alice expressions from bob
  const get_exps = await alice_happ.cells[0].call("group-expression", "get_by_author", {author: "did://alice", from: date.toISOString(), until: new Date().toISOString()})
  console.log("Got expressions for alice: ", get_exps);
  t.equal(get_exps.length, 1);

  //Try and get the expression by address
  const get_exp = await alice_happ.cells[0].call("group-expression", "get_expression_by_address", create_exp.holochain_data.element.signed_header.header.hash)
  console.log("Got exp by address", get_exp);
  t.notEqual(get_exp.expression_data, undefined);
  t.pass()
})


// Run all registered scenarios as a final step, and gather the report,
// if you set up a reporter
const report = orchestrator.run()

// Note: by default, there will be no report
console.log(report)