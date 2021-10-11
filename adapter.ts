import type { Address, Agent, ExpressionProof, Expression, ExpressionAdapter, PublicSharing, HolochainLanguageDelegate, LanguageContext, AgentService, IPFSNode } from "@perspect3vism/ad4m";;
import { DNA_NICK } from "./dna";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

class GroupExpPutAdapter implements PublicSharing {
  #agent: AgentService;
  #hcDna: HolochainLanguageDelegate;
  #IPFS: IPFSNode;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#hcDna = context.Holochain as HolochainLanguageDelegate;
    this.#IPFS = context.IPFS;
  }

  async createPublic(obj: object): Promise<Address> {
    const expression = this.#agent.createSignedExpression(obj);

    if (expression.data.image) {
      const ipfsAddress = await this.#IPFS.add({content: expression.data.image});

      // @ts-ignore
      const ipfsHash = ipfsAddress.cid.toString();

      expression.data.image = ipfsHash;
    }


    if (expression.data.thumbnail) {
      const ipfsAddress = await this.#IPFS.add({content: expression.data.thumbnail});

      // @ts-ignore
      const ipfsHash = ipfsAddress.cid.toString();

      expression.data.thumbnail = ipfsHash;
    }

    const res = await this.#hcDna.call(
      DNA_NICK,
      "group-expression",
      "create_public_expression",
      {
        author: expression.author,
        data: JSON.stringify(expression.data),
        timestamp: expression.timestamp,
        proof: expression.proof,
      }
    );
    //TODO: add error handling here
    return res.holochain_data.element.signed_header.header.hash.toString("hex");
  }
}

export default class Adapter implements ExpressionAdapter {
  #hcDna: HolochainLanguageDelegate;
  #IPFS: IPFSNode;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#hcDna = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new GroupExpPutAdapter(context);
    this.#IPFS = context.IPFS;
  }

  async get(address: Address): Promise<Expression> {
    const hash = Buffer.from(address, "hex");
    const expression = await this.#hcDna.call(
      DNA_NICK,
      "group-expression",
      "get_expression_by_address",
      hash
    );
    if (expression != null) {
      let cloneRes = Object.assign({}, expression);

      if(cloneRes.expression_data["schema:image"]) {
        const chunks = [];

        const imageChunk = await this.#IPFS.cat(cloneRes.expression_data["schema:image"]);

        // @ts-ignore
        for (const chunk of imageChunk) {
          chunks.push(chunk)
        }

        const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();

        cloneRes.expression_data["schema:image"] = fileString;
      }

      if(cloneRes.expression_data["schema:thumbnail"]) {
        const chunks = [];

        const thumbnailChunk = await this.#IPFS.cat(cloneRes.expression_data["schema:thumbnail"]);

        // @ts-ignore
        for (const chunk of thumbnailChunk) {
          chunks.push(chunk)
        }

        const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();

        cloneRes.expression_data["schema:thumbnail"] = fileString;
      }

      const expressionSer = {
        author: cloneRes.expression_data["schema:agent"]["did:id"],
        data: {
          name: cloneRes.expression_data["foaf:name"],
          description: cloneRes.expression_data["schema:description"],
          image: cloneRes.expression_data["schema:image"],
          thumbnail: cloneRes.expression_data["schema:thumbnail"]
        },
        timestamp: cloneRes.expression_data["schema:dateCreated"]["@value"],
        proof: {
          signature:
          cloneRes.expression_data["sec:proof"]["sec:verificationMethod"],
          key: cloneRes.expression_data["sec:proof"]["sec:jws"],
        } as ExpressionProof,
      } as Expression;
      return expressionSer;
    } else {
      return null;
    }
  }
}
