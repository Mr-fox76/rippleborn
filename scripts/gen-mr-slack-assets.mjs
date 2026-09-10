import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'public/cards/Mr-Slack')
const IMG_DIR = path.join(ROOT, 'public/sets/mr-slack/images')
const JSON_DIR = path.join(ROOT, 'public/sets/mr-slack/json')
const SET_NAME = 'Mr Slack'
const IMAGE_BASE = 'https://ledgerborn.app/sets/mr-slack/images'

// [name, slug, sourceFile, rarity, description]
const CARDS = [
  ['Tired Fox', 'tired-fox', 'tired-fox.jpg', 'Common', 'Rest is not surrender. Even the weariest heart wakes sharper when it finally lets itself pause.'],
  ['Graf Fox', 'graf-fox', 'Graf Fox.jpg', 'Common', 'Leave the world brighter than you found it. Every mark you make is a chance to say you were here.'],
  ['Scratch-head Fox', 'scratch-head-fox', 'scratch-head-fox.jpg', 'Common', 'Not knowing is the doorway to learning. Sit with the question and the answer will find you.'],
  ['Wasted Fox', 'wasted-fox', 'wasted-fox.jpg', 'Common', 'Even a rough night ends in morning. Be gentle with yourself and begin again.'],
  ['Freaked Fox', 'freaked-fox', 'freaked-fox.jpg', 'Common', 'Fear is only excitement holding its breath. Breathe out, and the moment shrinks back to size.'],
  ['The Gentleman', 'the-gentleman', 'The Gentleman.jpg', 'Common', 'Manners cost nothing and buy everything. Carry yourself with grace and doors quietly open.'],
  ['Bruce Lee Fox', 'bruce-lee-fox', 'Bruce Lee Fox.jpg', 'Rare', 'Be like water — patient, adaptable, unstoppable. Flow around what blocks you and wear it down.'],
  ['The Cowboy', 'the-cowboy', 'The Cowboy.jpg', 'Rare', 'Ride your own trail at your own pace. The horizon belongs to those brave enough to follow it.'],
  ['Vietnam Fox', 'vietnam-fox', 'vietnam-fox.jpg', 'Rare', 'You carry more than your scars; you carry the strength that survived them. Walk on, unbroken.'],
  ['Pot Head', 'pot-head', 'Pot Head.jpg', 'Rare', 'Slow down and notice the small wonders. Peace is usually hiding in the ordinary moment.'],
  ['Space Cadet', 'space-cadet', 'Space Cadet-1.jpg', 'Rare', 'Let your mind wander the stars. Big dreams need room to drift before they come home to build.'],
  ['Punk Fox', 'punk-fox', 'punk-fox-1.jpg', 'Epic', 'Refuse to shrink for anyone. The world needs your loud, unrepeatable spark exactly as it is.'],
  ['Crypto Fox', 'crypto-fox', 'crypto-fox.jpg', 'Epic', 'Believe in what others cannot yet see. Conviction, held long enough, becomes the future.'],
  ['Robo Fox', 'robo-fox', 'Robo- Fox.jpg', 'Epic', 'Precision has its own kind of heart. Do each thing well and let your work speak for you.'],
  ['Demon Fox', 'demon-fox', 'demon-fox.jpg', 'Legendary', 'Your shadows are not your enemies. Face them with courage and they become your fiercest power.'],
  ['Techno Fox', 'techno-fox', 'techno-fox.jpg', 'Legendary', 'Find the rhythm beneath the noise. When you move with the beat, chaos turns into a dance.'],
  ['Red-eye Fox', 'red-eye-fox', 'red-eye-fox.jpg', 'Legendary', 'The long night proves the dawn. Push through the tired hour and the reward will be yours alone.'],
  ['Ninja Fox', 'ninja-fox', 'ninja-fox.jpg', 'Mythic', 'Move quietly and let results announce you. The strongest presence rarely needs to be seen.'],
  ['Matrix Fox', 'matrix-fox', 'Matrix Fox.jpg', 'Mythic', 'Question the walls around you. The moment you see the pattern, you are already free of it.'],
  ['Zen Fox', 'zen-fox', 'Zen Fox.jpg', 'Mythic', 'Stillness is not empty; it is full of everything you were too busy to hear. Sit, and listen.'],
  ['Angel Fox', 'angel-fox', 'Angel-fox.jpg', 'Ultimate', 'Be the light that lifts others. Kindness given freely is the rarest treasure of all, and it returns tenfold.'],
]

// Legendary + Mythic sample previews that flank the sealed pack.
const SAMPLE_SLUGS = ['demon-fox', 'ninja-fox']

async function main() {
  await fs.mkdir(IMG_DIR, { recursive: true })
  await fs.mkdir(JSON_DIR, { recursive: true })

  let cardNumber = 0
  for (const [name, slug, source, rarity, description] of CARDS) {
    cardNumber += 1

    // Copy the uploaded art to its slugified destination.
    const srcPath = path.join(SRC_DIR, source)
    const destPath = path.join(IMG_DIR, `${slug}.jpg`)
    await fs.copyFile(srcPath, destPath)

    // Emit token metadata matching the other sets' schema.
    const metadata = {
      schema: 'https://api.xrpldata.com/api/v1/xls20-nft-metadata.json',
      nftType: 'collectible',
      name,
      description,
      image: `${IMAGE_BASE}/${slug}.jpg`,
      external_url: 'https://ledgerborn.app',
      attributes: [
        { trait_type: 'Set', value: SET_NAME },
        { trait_type: 'Rarity', value: rarity },
        { trait_type: 'Card Number', value: cardNumber },
      ],
    }
    await fs.writeFile(path.join(JSON_DIR, `${slug}.json`), `${JSON.stringify(metadata, null, 2)}\n`)
    console.log(`[v0] wrote ${slug} (#${cardNumber}, ${rarity})`)
  }

  // Lightweight WebP derivatives for the flanking sample cards (fast load).
  for (const slug of SAMPLE_SLUGS) {
    const out = path.join(IMG_DIR, `${slug}-sample.webp`)
    await sharp(path.join(IMG_DIR, `${slug}.jpg`))
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(out)
    const { size } = await fs.stat(out)
    console.log(`[v0] sample ${slug}-sample.webp ${Math.round(size / 1024)}KB`)
  }

  console.log('[v0] Mr Slack assets generated.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
