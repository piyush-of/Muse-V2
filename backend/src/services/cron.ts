import cron from 'node-cron';
import prisma from './db';
import { generateOutfitReasoning } from './ai';

/**
 * Interface representing a compiled outfit proposal
 */
interface CompiledOutfit {
  itemIds: number[];
  reasoning: string;
}

/**
 * Compiles a capsule of 3 outfits for a given user ID
 */
export async function compileUserDailyCapsule(userId: number, dateStr: string): Promise<void> {
  // 1. Fetch closet items
  const items = await prisma.closetItem.findMany({
    where: { userId }
  });

  if (items.length === 0) {
    console.log(`User ${userId} has an empty closet. Skipping outfit compilation.`);
    return;
  }

  // 2. Weather & Calendar context stubs
  const weather = "Rainy and Cool (18°C)";
  const calendar = "Client Pitch Meeting";

  // Group items by category for easy combinatorial styling
  const outerwear = items.filter(i => i.category === 'Outerwear');
  const tops = items.filter(i => i.category === 'Tops');
  const bottoms = items.filter(i => i.category === 'Bottoms');
  const shoes = items.filter(i => i.category === 'Shoes');

  // Fallback to general list if specific categories are empty
  const getRand = (arr: typeof items) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

  const outfitsToCreate: CompiledOutfit[] = [];

  // Generate 3 distinct outfit combinations
  for (let optionIdx = 1; optionIdx <= 3; optionIdx++) {
    const selectedIds: number[] = [];
    const selectedItems: { name: string; category: string }[] = [];

    // Formulate a look based on category availability
    const top = getRand(tops) || getRand(items);
    const bottom = getRand(bottoms) || getRand(items);
    const shoe = getRand(shoes) || getRand(items);
    const outer = optionIdx % 2 === 0 ? getRand(outerwear) : null; // Outerwear optional depending on look

    if (top) { selectedIds.push(top.id); selectedItems.push({ name: top.name, category: 'Tops' }); }
    if (bottom) { selectedIds.push(bottom.id); selectedItems.push({ name: bottom.name, category: 'Bottoms' }); }
    if (shoe) { selectedIds.push(shoe.id); selectedItems.push({ name: shoe.name, category: 'Shoes' }); }
    if (outer) { selectedIds.push(outer.id); selectedItems.push({ name: outer.name, category: 'Outerwear' }); }

    if (selectedIds.length === 0) continue;

    // Generate reasoning via Anthropic AI or mock
    const reasoning = await generateOutfitReasoning(selectedItems, weather, calendar);

    outfitsToCreate.push({
      itemIds: selectedIds,
      reasoning: reasoning as string
    });
  }

  // 3. Clear any existing pending outfits for today and save new cached ones
  await prisma.outfit.deleteMany({
    where: {
      userId,
      date: dateStr,
      status: 'pending'
    }
  });

  for (const o of outfitsToCreate) {
    await prisma.outfit.create({
      data: {
        userId,
        date: dateStr,
        itemIds: o.itemIds,
        reasoning: o.reasoning,
        status: 'pending'
      }
    });
  }

  console.log(`Successfully cached ${outfitsToCreate.length} outfits for user ${userId} on ${dateStr}`);
}

/**
 * Scans all users and builds daily capsules
 */
export async function runDailyCapsuleGeneration(): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`[Cron] Starting daily outfit compilation for ${todayStr}...`);

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await compileUserDailyCapsule(user.id, todayStr);
    }
    console.log(`[Cron] Daily outfit compilation completed.`);
  } catch (error) {
    console.error(`[Cron] Error during capsule compilation:`, error);
  }
}

/**
 * Register Background Jobs
 * Runs daily at midnight server time (0 0 * * *)
 */
export function registerBackgroundJobs(): void {
  // Cron schedule: Every day at midnight
  cron.schedule('0 0 * * *', () => {
    runDailyCapsuleGeneration();
  });
  console.log('[Cron] Node-cron service registered (0 0 * * *).');
}
