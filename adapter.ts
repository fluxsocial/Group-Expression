import type { Address, Expression, ExpressionAdapter, PublicSharing, HolochainLanguageDelegate, LanguageContext, AgentService } from "@perspect3vism/ad4m";
import type { IPFS } from "ipfs-core-types";
import { name } from "./index";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

class GenericExpressionPutAdapter implements PublicSharing {
  #agent: AgentService;
  #holochainDna: HolochainLanguageDelegate;
  #IPFS: IPFS;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#holochainDna = context.Holochain as HolochainLanguageDelegate;
    this.#IPFS = context.IPFS;
  }

  async createPublic(groupData: object): Promise<Address> {
    let expression = this.#agent.createSignedExpression(groupData);

    if (expression.data.image) {
      const ipfsAddress = await this.#IPFS.add({content: expression.data.image});

      // @ts-ignore
      const ipfsHash = ipfsAddress.cid.toString();

      expression.data.image_address = ipfsHash;
    }


    if (expression.data.thumbnail) {
      const ipfsAddress = await this.#IPFS.add({content: expression.data.thumbnail});

      // @ts-ignore
      const ipfsHash = ipfsAddress.cid.toString();

      expression.data.thumbnail_address = ipfsHash;
    }

    const res = await this.#holochainDna.call(
      name,
      "group_expression",
      "create_expression",
      {
        author: expression.author,
        data: {
          name: expression.data.name,
          description: expression.data.description,
          image_address: expression.data.image_address,
          thumbnail_address: expression.data.thumbnail_address
        },
        timestamp: expression.timestamp,
        proof: expression.proof,
      }
    );

    return res.toString("hex");
  }
}

export default class GenericExpressionAdapter implements ExpressionAdapter {
  #holochainDna: HolochainLanguageDelegate;
  #IPFS: IPFS;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#holochainDna = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new GenericExpressionPutAdapter(context);
    this.#IPFS = context.IPFS;
  }

  async get(address: Address): Promise<Expression> {
    const hash = Buffer.from(address, "hex");
    const expression = await this.#holochainDna.call(
      name,
      "group_expression",
      "get_expression_by_address",
      hash
    );
    if (expression != null) {
      let cloneRes = Object.assign({}, expression);

      let imageAddr = cloneRes.data.image_address
      if(imageAddr) {
        const chunks = [];

        const imageChunk = await this.#IPFS.cat(imageAddr);

        // @ts-ignore
        for await (const chunk of imageChunk) {
          chunks.push(chunk)
        }

        const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();

        cloneRes.data.image = fileString;
        delete cloneRes["image_address"]
      }

      let thumbnailAddr = cloneRes.data.thumbnail_address;
      if(thumbnailAddr) {
        const chunks = [];

        const thumbnailChunk = await this.#IPFS.cat(thumbnailAddr);

        // @ts-ignore
        for await (const chunk of thumbnailChunk) {
          chunks.push(chunk)
        }

        const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();

        cloneRes.data.thumbnail = fileString;
        delete cloneRes["thumbnail_address"]
      }

      const expressionSer = {
        author: cloneRes.author,
        data: {
          name: cloneRes.data.name,
          description: cloneRes.data.description,
          image: cloneRes.data.image,
          thumbnail: cloneRes.data.thumbnail
        },
        timestamp: cloneRes.timestamp,
        proof: cloneRes.proof,
      } as Expression;
      return expressionSer;
    } else {
      return null;
    }
  }
}