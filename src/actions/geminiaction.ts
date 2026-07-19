// src/actions/geminiAction.ts
'use server';
import { askGemini } from '@/lib/gemini';

export async function handleUserPrompt(prompt: string) {
  return await askGemini(prompt);
}