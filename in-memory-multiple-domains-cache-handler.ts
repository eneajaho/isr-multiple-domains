import { CacheHandler, CacheData, ISROptions } from 'ngx-isr/lib/models';

interface CacheDataWithDomain extends CacheData {
  domain: string;
}

export class InMemoryMultipleDomainsCacheHandler implements CacheHandler {
  // object with domain as key and a map with the urls
  protected cache: { [key: string]: Map<string, CacheDataWithDomain> } = {};

  constructor(domains: string[] = []) {
    for (const domain of domains) {
      this.cache[domain] = new Map<string, CacheDataWithDomain>();
    }
  }

  add(
    url: string,
    html: string,
    options: ISROptions = { revalidate: null }
  ): Promise<void> {
    const htmlWithMsg = html + cacheMsg(options.revalidate);
    const domain = getDomainFromUrl(url);

    return new Promise((resolve, reject) => {
      const cacheData: CacheDataWithDomain = {
        html: htmlWithMsg,
        options,
        createdAt: Date.now(),
        domain,
      };

      this.cache[domain].set(url, cacheData);

      resolve();
    });
  }

  get(url: string): Promise<CacheData> {
    const domain = getDomainFromUrl(url);

    return new Promise((resolve, reject) => {
      if (this.cache[domain].has(url)) {
        resolve(this.cache[domain].get(url)!);
      }
      reject('This url does not exist in cache!');
    });
  }

  getAll(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      resolve([]); // TODO: add something here if you use it!
    });
  }

  has(url: string): Promise<boolean> {
    const domain = getDomainFromUrl(url);

    return new Promise((resolve, reject) => {
      resolve(this.cache[domain].has(url));
    });
  }

  delete(url: string): Promise<boolean> {
    const domain = getDomainFromUrl(url);

    return new Promise((resolve, reject) => {
      resolve(this.cache[domain].delete(url));
    });
  }
}

const cacheMsg = (revalidateTime?: number | null): string => {
  const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let msg = '<!-- ';

  msg += `\n🚀 NgxISR: Served from cache! \n⌛ Last updated: ${time}. `;

  if (revalidateTime) {
    msg += `\n⏭️ Next refresh is after ${revalidateTime} seconds. `;
  }

  msg += ' \n-->';

  return msg;
};

const getDomainFromUrl = (url: string): string => {
  let domain = new URL(url);
  return domain.hostname;
};
