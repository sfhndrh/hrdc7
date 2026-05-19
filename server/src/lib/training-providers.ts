import path from "node:path";
import { fileURLToPath } from "node:url";

export interface TrainingCourse {
  title: string;
  code: string;
  scheme: string;
  claimable: boolean;
  duration: string;
  fee: string;
  mode: string;
  category: string;
}

export interface TrainingProvider {
  name: string;
  registrationNo: string;
  status: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  state: string;
  description: string;
  courses: TrainingCourse[];
  detailUrl: string;
  scrapedAt: string;
}

export interface ProvidersDataStats {
  totalProviders: number;
  totalCourses: number;
  claimableCourses: number;
  providersWithClaimableCourses: number;
  providersWithEmail: number;
  providersWithWebsite: number;
  providersWithAddress: number;
}

export interface ProvidersData {
  scrapedAt: string;
  model: string;
  stats: ProvidersDataStats;
  providers: TrainingProvider[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(SERVER_ROOT, "..");
export const TRAINING_PROVIDERS_JSON_PATH =
  process.env.TRAINING_PROVIDERS_DATA_PATH?.trim() ||
  path.join(REPO_ROOT, "data", "training-providers.json");

export const TRAINING_PROVIDERS_CSV_PATH =
  process.env.TRAINING_PROVIDERS_CSV_PATH?.trim() ||
  path.join(REPO_ROOT, "data", "training-providers.csv");

export function computeProvidersStats(providers: TrainingProvider[]): ProvidersDataStats {
  let totalCourses = 0;
  let claimableCourses = 0;
  let providersWithClaimableCourses = 0;
  let providersWithEmail = 0;
  let providersWithWebsite = 0;
  let providersWithAddress = 0;

  for (const p of providers) {
    totalCourses += p.courses.length;
    for (const c of p.courses) {
      if (c.claimable) claimableCourses += 1;
    }
    if (p.courses.some((c) => c.claimable)) providersWithClaimableCourses += 1;
    if (p.email.trim()) providersWithEmail += 1;
    if (p.website.trim()) providersWithWebsite += 1;
    if (p.address.trim()) providersWithAddress += 1;
  }

  return {
    totalProviders: providers.length,
    totalCourses,
    claimableCourses,
    providersWithClaimableCourses,
    providersWithEmail,
    providersWithWebsite,
    providersWithAddress,
  };
}

// Re-exported from training-providers-store (database-backed).
export {
  getTrainingProviders,
  saveTrainingProviders,
  ensureTrainingProvidersInDb,
} from "./training-providers-store.js";
