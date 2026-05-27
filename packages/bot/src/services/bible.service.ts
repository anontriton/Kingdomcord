// Default Bible ID: KJV on api.bible. Find others at https://scripture.api.bible/lifechange/bibles
const DEFAULT_BIBLE_ID = 'de4e12af7f28f599-02';

// 30-verse rotation — one per day of month, cycling
const DAILY_VERSE_IDS = [
  'JHN.3.16',    'PSA.23.1',    'ROM.8.28',    'PHP.4.13',    'PRO.3.5',
  'ISA.40.31',   'JER.29.11',   'MAT.6.33',    'JHN.14.6',    'HEB.11.1',
  'ROM.12.2',    'GAL.5.22',    'EPH.2.8',     'PHP.4.7',     'PSA.46.10',
  'JOS.1.9',     '1CO.13.4',    'MAT.5.16',    'ROM.8.1',     'JHN.16.33',
  'PSA.119.105', 'PRO.22.6',    'ISA.41.10',   'MAT.11.28',   'JHN.10.10',
  'ROM.5.8',     'EPH.4.32',    'PHP.4.19',    '2TI.3.16',    'PSA.37.4',
];

interface ScriptureApiVerseResponse {
  data: {
    id: string;
    reference: string;
    content: string;
  };
}

export interface VerseData {
  verseId: string;
  reference: string;
  text: string;
}

export const BibleService = {
  async getVerse(verseId: string, bibleId = DEFAULT_BIBLE_ID): Promise<VerseData> {
    const apiKey = process.env.BIBLE_API_KEY;
    if (!apiKey) throw new Error('BIBLE_API_KEY is not set');

    const params = new URLSearchParams({
      'content-type': 'text',
      'include-notes': 'false',
      'include-titles': 'false',
      'include-chapter-numbers': 'false',
      'include-verse-numbers': 'false',
    });

    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verseId}?${params}`;
    const res = await fetch(url, { headers: { 'api-key': apiKey } });

    if (!res.ok) {
      throw new Error(`Scripture API error ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as ScriptureApiVerseResponse;

    return {
      verseId: json.data.id,
      reference: json.data.reference,
      text: json.data.content.trim(),
    };
  },

  getDailyVerseId(): string {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return DAILY_VERSE_IDS[dayOfYear % DAILY_VERSE_IDS.length];
  },
};
