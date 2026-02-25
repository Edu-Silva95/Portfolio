import { useEffect, useState, useRef } from "react";

const CACHE_KEY = "taskbar-news-cache-v1";
const CACHE_TTL_MS = 15 * 60 * 1000;

export default function useNewsFeed({ enabled = false } = {}) {
  const [newsItems, setNewsItems] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasLoadedRef.current) return;

    const controller = new AbortController();

    const pickHostname = (url) => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return "Hacker News";
      }
    };

    const isValidUrl = (url) => /^https?:\/\//i.test(url);

    const mapHitsToCards = (hits = [], category = "Tech") => {
      return hits
        .filter((hit) => hit.points > 50) // filter low quality posts
        .map((hit) => {
          const url = hit.url || hit.story_url;
          const title = hit.title || hit.story_title;

          if (!url || !title || !isValidUrl(url)) return null;

          return {
            id: `${category.toLowerCase()}-${hit.objectID}`,
            category,
            title,
            source: hit.author || pickHostname(url),
            url,
          };
        })
        .filter(Boolean)
        .slice(0, 2); // 2 per category
    };

    const readCachedNews = () => {
      try {
        const raw = window.sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.timestamp || !Array.isArray(parsed?.items)) return null;
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
        return parsed.items;
      } catch {
        return null;
      }
    };

    const writeCachedNews = (items) => {
      try {
        window.sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), items })
        );
      } catch {
      }
    };

    const loadNews = async () => {
      const cached = readCachedNews();
      if (cached?.length) {
        setNewsItems(cached);
        hasLoadedRef.current = true;
        return;
      }

      setIsNewsLoading(true);
      setError(null);

      try {
        const [techRes, worldRes] = await Promise.all([
          fetch(
            "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=technology&numericFilters=points>50",
            { signal: controller.signal }
          ),
          fetch(
            "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=world&numericFilters=points>50",
            { signal: controller.signal }
          ),
        ]);

        const [techJson, worldJson] = await Promise.all([
          techRes.json(),
          worldRes.json(),
        ]);

        const cards = [
          ...mapHitsToCards(techJson?.hits, "Tech"),
          ...mapHitsToCards(worldJson?.hits, "World"),
        ].slice(0, 3);

        setNewsItems(cards);
        writeCachedNews(cards);
        hasLoadedRef.current = true;
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to load news");
          setNewsItems([]);
        }
      } finally {
        setIsNewsLoading(false);
      }
    };

    loadNews();

    return () => controller.abort();
  }, [enabled]);

  return { newsItems, isNewsLoading, error };
}