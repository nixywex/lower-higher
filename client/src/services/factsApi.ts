import { API_URL } from '../config';
import type { Fact, FactSummary } from '../types';

interface SubmitResult {
  score: number;
  rightAnswers: Fact[];
}

function fetchWithTimeout(url: string, options?: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

export async function fetchRound(): Promise<FactSummary[]> {
  const response = await fetchWithTimeout(`${API_URL}/api/facts/round`);
  return parseResponse<FactSummary[]>(response);
}

export async function submitRound(ids: number[]): Promise<SubmitResult> {
  const response = await fetch(`${API_URL}/api/facts/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });

  return parseResponse<SubmitResult>(response);
}
