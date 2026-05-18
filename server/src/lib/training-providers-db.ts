import { newId } from "../db/ids.js";
import { asCount, execute, queryAll, queryOne, withTransaction } from "../db/query.js";
import type {
  ProvidersData,
  TrainingCourse,
  TrainingProvider,
} from "./training-providers.js";
import { computeProvidersStats } from "./training-providers.js";

type ProviderRow = {
  id: string;
  name: string;
  registration_no: string;
  status: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  state: string;
  description: string;
  detail_url: string;
  scraped_at: string;
};

type CourseRow = {
  id: string;
  provider_id: string;
  title: string;
  code: string;
  scheme: string;
  claimable: boolean;
  duration: string;
  fee: string;
  mode: string;
  category: string;
  sort_order: number;
};

type SyncRow = {
  scraped_at: string;
  model: string;
};

function rowToProvider(row: ProviderRow, courses: TrainingCourse[]): TrainingProvider {
  return {
    name: row.name,
    registrationNo: row.registration_no,
    status: row.status,
    email: row.email,
    phone: row.phone,
    fax: row.fax,
    website: row.website,
    address: row.address,
    state: row.state,
    description: row.description,
    courses,
    detailUrl: row.detail_url,
    scrapedAt: row.scraped_at,
  };
}

function courseFromRow(row: CourseRow): TrainingCourse {
  return {
    title: row.title,
    code: row.code,
    scheme: row.scheme,
    claimable: Boolean(row.claimable),
    duration: row.duration,
    fee: row.fee,
    mode: row.mode,
    category: row.category,
  };
}

export async function countTrainingProviders(): Promise<number> {
  const row = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM training_provider`,
  );
  return asCount(row);
}

export async function getTrainingProvidersFromDb(): Promise<ProvidersData | null> {
  const sync = await queryOne<SyncRow>(
    `SELECT scraped_at, model FROM training_provider_sync WHERE id = 'default'`,
  );
  const providerRows = await queryAll<ProviderRow>(
    `SELECT * FROM training_provider ORDER BY name ASC`,
  );
  if (providerRows.length === 0) return null;

  const courseRows = await queryAll<CourseRow>(
    `SELECT * FROM training_provider_course ORDER BY provider_id ASC, sort_order ASC`,
  );

  const coursesByProvider = new Map<string, TrainingCourse[]>();
  for (const row of courseRows) {
    const list = coursesByProvider.get(row.provider_id) ?? [];
    list.push(courseFromRow(row));
    coursesByProvider.set(row.provider_id, list);
  }

  const providers = providerRows.map((row) =>
    rowToProvider(row, coursesByProvider.get(row.id) ?? []),
  );

  const scrapedAt = sync?.scraped_at ?? providers[0]?.scrapedAt ?? new Date().toISOString();
  const model = sync?.model ?? "";

  return {
    scrapedAt,
    model,
    stats: computeProvidersStats(providers),
    providers,
  };
}

export async function saveTrainingProvidersToDb(data: ProvidersData): Promise<void> {
  const now = new Date().toISOString();

  await withTransaction(async (client) => {
    await execute(`DELETE FROM training_provider_course`, [], client);
    await execute(`DELETE FROM training_provider`, [], client);

    for (const p of data.providers) {
      const providerId = newId();
      await execute(
        `INSERT INTO training_provider (
          id, name, registration_no, status, email, phone, fax, website,
          address, state, description, detail_url, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          providerId,
          p.name,
          p.registrationNo,
          p.status,
          p.email,
          p.phone,
          p.fax,
          p.website,
          p.address,
          p.state,
          p.description,
          p.detailUrl,
          p.scrapedAt || data.scrapedAt,
        ],
        client,
      );

      for (let i = 0; i < p.courses.length; i += 1) {
        const c = p.courses[i]!;
        await execute(
          `INSERT INTO training_provider_course (
            id, provider_id, title, code, scheme, claimable,
            duration, fee, mode, category, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId(),
            providerId,
            c.title,
            c.code,
            c.scheme,
            c.claimable,
            c.duration,
            c.fee,
            c.mode,
            c.category,
            i,
          ],
          client,
        );
      }
    }

    await execute(
      `INSERT INTO training_provider_sync (id, scraped_at, model, updated_at)
       VALUES ('default', ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         scraped_at = EXCLUDED.scraped_at,
         model = EXCLUDED.model,
         updated_at = EXCLUDED.updated_at`,
      [data.scrapedAt, data.model, now],
      client,
    );
  });
}
