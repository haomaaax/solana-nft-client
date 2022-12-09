import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "COOL token"
const description = "COOL NFT"
const symbol = "KOO"
const sellerFeeBasisPoints = 100
const imageFile = "cool.png"

// create NFT
async function createNft(
  metaplex: Metaplex,
  uri: string
): Promise<NftWithToken> {
  const { nft } = await metaplex
    .nfts()
    .create({
      uri: uri,
      name: tokenName,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      symbol: symbol,
    })

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  return nft
}

async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  // get "NftWithToken" type from mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress })

  // omit any fields to keep unchanged
  await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      name: tokenName,
      symbol: symbol,
      uri: uri,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
    })

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )

  // file to buffer
  const buffer = fs.readFileSync("src/" + imageFile)

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, imageFile)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: tokenName,
      description: description,
      image: imageUri,
    })

  console.log("metadata uri:", uri)

  console.log("image uri:", imageUri)

  console.log("PublicKey:", user.publicKey.toBase58())

  // This is to create a new nft token
  // await createNft(metaplex, uri)

  // You can get this from the solana explorer URL
  const mintAddress = new PublicKey("J8pxwZeydm8BRMEjUpyDjABdnLxbjXwkBYDqS9pzCHAx")
  // This is to update existing nft token
  await updateNft(metaplex, uri, mintAddress)
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
