// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { withSentry } from '@sentry/nextjs'
import { NextApiRequest, NextApiResponse } from 'next'
import {getTokenOwnerRecord, getTokenOwnerRecordAddress} from "@solana/spl-governance";
import {DEFAULT_GOVERNANCE_PROGRAM_ID} from "@solana/governance-program-library";
import {Connection, PublicKey} from "@solana/web3.js";
import {MAINNET_RPC} from "@constants/endpoints";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!MAINNET_RPC)
  return res.status(500).json('BACKEND_MAINNET_RPC not provided in env')
  const conn = new Connection(MAINNET_RPC, 'recent')
  const pk = req.query['public_key'] ?? 0;
  if (pk === 0) {
    res.status(400).json({
      err: "Invalid Public Key Provided",
    });
    return;
  }
  try{
    const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'), new PublicKey('BiLhzxXqUX1ckdQGjZRNSd3Fha36XwVJhJFS4x1NePeR'), new PublicKey('AGdNv9jWvmsZ2qr3D6PVF8zTbV1NRnS7yMys8HqAJDg5'), new PublicKey(pk))
    const tokenOwnerRecord = await getTokenOwnerRecord(conn,new PublicKey(tokenOwnerRecordAddress));
    tokenOwnerRecord.account['depositAmount'] = parseInt(tokenOwnerRecord.account.governingTokenDepositAmount.toString())/1e8;
    console.log(tokenOwnerRecord);
    return res.status(200).json(tokenOwnerRecord)
  }catch (e) {
    return res.status(400).json({
      err: "Invalid Public Key Provided",
    });
  }

}

export default withSentry(handler)
