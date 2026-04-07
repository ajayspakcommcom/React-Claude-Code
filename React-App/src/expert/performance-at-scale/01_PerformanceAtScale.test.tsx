// TOPIC: Performance at Scale (Expert)
// LEVEL: Expert — Performance at Scale
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Memory Optimization   — leaks, WeakRef, FinalizationRegistry, heap profiling
//   2. Browser Rendering     — critical rendering path, paint, layout, composite
//   3. Advanced Caching      — CDN, edge, stale-while-revalidate, HTTP headers
//
// ─── MEMORY OPTIMIZATION ──────────────────────────────────────────────────────
//
//   JavaScript is garbage-collected, but leaks still happen when references are
//   inadvertently kept alive longer than intended.
//
//   Common leak patterns in React:
//   - Event listeners added in useEffect without cleanup
//   - setInterval / setTimeout not cleared on unmount
//   - Closures capturing large objects in stale state
//   - Global caches that grow without bound (Map/Set with no eviction)
//   - DOM node references held past component lifetime
//
//   Tools for diagnosis:
//   - Chrome DevTools → Memory tab → Heap Snapshot / Allocation Timeline
//   - Performance tab → "Detached DOM trees"
//   - process.memoryUsage() in Node
//
//   WeakRef + FinalizationRegistry (ES2021):
//   - WeakRef holds a "weak" reference — does not prevent GC
//   - FinalizationRegistry fires a callback when the target is collected
//   - Useful for caches that should auto-evict, not for critical state
//
//   LRU Cache:
//   - Bounded cache with Least-Recently-Used eviction
//   - Prevents unbounded growth by evicting the oldest unused entry
//   - Core pattern in React Query, Apollo, webpack chunk manifests
//
// ─── BROWSER RENDERING PIPELINE ───────────────────────────────────────────────
//
//   The Critical Rendering Path (CRP):
//
//     HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite
//
//   Each stage:
//     1. Parse HTML         → DOM (Document Object Model)
//     2. Parse CSS          → CSSOM (CSS Object Model)
//     3. Combine            → Render Tree (only visible nodes + computed styles)
//     4. Layout (Reflow)    → calculate size + position of every element
//     5. Paint (Rasterise)  → fill pixels into layers
//     6. Composite          → GPU assembles layers in correct order
//
//   Layout thrashing (forced synchronous layout):
//   Reading a layout property AFTER a DOM write forces the browser to flush
//   pending styles and recalculate layout synchronously — very expensive.
//     Bad:  el.style.width = '100px'; el.offsetWidth;  // read forces layout
//     Good: batch reads before writes, use requestAnimationFrame
//
//   What triggers what:
//     - JS / CSS change → Layout + Paint + Composite  (most expensive)
//     - opacity / transform only → Composite only     (GPU, cheap)
//     - color/background → Paint + Composite          (no layout needed)
//
//   will-change: transform:
//   Tells the browser to promote the element to its own GPU layer in advance.
//   Use sparingly — each layer consumes GPU memory.
//
//   requestAnimationFrame (rAF):
//   Schedule work to run just before the browser's next paint.
//   Gives JS a "safe" moment to batch DOM reads and writes without thrashing.
//
// ─── ADVANCED CACHING ─────────────────────────────────────────────────────────
//
//   HTTP Cache-Control:
//     Cache-Control: no-store             → never cache
//     Cache-Control: no-cache             → cache but always revalidate with server
//     Cache-Control: max-age=3600         → serve from cache for 1 hr, then revalidate
//     Cache-Control: s-maxage=3600        → same but for shared caches (CDN)
//     Cache-Control: stale-while-revalidate=86400 → serve stale, refresh in background
//     Cache-Control: immutable            → never revalidate (use with content hashing)
//
//   CDN caching:
//   - CDN sits in front of origin, caches responses at PoPs worldwide
//   - Bypass CDN: Cache-Control: private (CDN skips, only browser caches)
//   - Surrogate-Control header → CDN-only TTL, overrides Cache-Control at the CDN layer
//   - Cache invalidation: purge by URL / tag, deploy new hash, CDN key varies
//
//   Stale-While-Revalidate (SWR) pattern:
//   - Serve stale content instantly (fast TTFB)
//   - Trigger background revalidation request
//   - Next visitor gets fresh content
//   - Used by Next.js ISR, TanStack Query, SWR library
//
//   Edge caching:
//   - Same as CDN but at the compute layer (Cloudflare Workers, Vercel Edge)
//   - Can modify request/response before/after cache hit
//   - `cache()` in Next.js + `revalidatePath()` / `revalidateTag()` for programmatic purge
//
//   ETag + If-None-Match (conditional requests):
//   - Server sets ETag header (hash of content)
//   - Browser sends If-None-Match: <etag> on next request
//   - Server replies 304 Not Modified if unchanged → no body transfer
//
//   Vary header:
//   - Tells CDN which request headers affect the response
//   - Vary: Accept-Encoding → cache separate gzip/brotli variants
//   - Vary: Accept-Language → separate variants per locale

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY OPTIMIZATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── LRU Cache ────────────────────────────────────────────────────────────────

class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key); // re-insert at end
    } else if (this.map.size >= this.capacity) {
      // Evict least recently used (first key in Map insertion order)
      this.map.delete(this.map.keys().next().value!);
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  keys(): K[] {
    return Array.from(this.map.keys());
  }
}

// ── Memory leak: uncleared interval ──────────────────────────────────────────

const LeakyCounter: React.FC<{ onTick: () => void }> = ({ onTick }) => {
  useEffect(() => {
    // BUG: no cleanup → interval keeps running after unmount
    const id = setInterval(onTick, 50);
    return () => clearInterval(id); // correct: return cleanup
  }, [onTick]);

  return <div>Counter running</div>;
};

// ── Memory leak: unremoved event listener ────────────────────────────────────

const LeakyListener: React.FC<{ onResize: () => void; leak?: boolean }> = ({
  onResize,
  leak = false,
}) => {
  useEffect(() => {
    window.addEventListener("resize", onResize);
    if (!leak) {
      return () => window.removeEventListener("resize", onResize);
    }
    // When leak=true: no cleanup returned → listener survives unmount
  }, [onResize, leak]);

  return <div>Listening for resize</div>;
};

// ── Bounded cache via useMemo + LRU ──────────────────────────────────────────

const useLRUCache = <K, V>(capacity: number) => {
  const cache = useRef(new LRUCache<K, V>(capacity));
  return cache.current;
};

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER RENDERING PIPELINE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Critical Rendering Path stages ───────────────────────────────────────────

type CRPStage = "HTML" | "DOM" | "CSSOM" | "RenderTree" | "Layout" | "Paint" | "Composite";

const CRP_PIPELINE: CRPStage[] = [
  "HTML", "DOM", "CSSOM", "RenderTree", "Layout", "Paint", "Composite",
];

const getCRPDescription = (stage: CRPStage): string => {
  const descriptions: Record<CRPStage, string> = {
    HTML: "Raw bytes → characters → tokens → nodes",
    DOM: "Document Object Model — JS-accessible tree of all elements",
    CSSOM: "CSS Object Model — computed styles for every selector",
    RenderTree: "Visible nodes only (display:none excluded) + computed styles",
    Layout: "Calculate exact size and position of every render tree node",
    Paint: "Fill pixels into layers (text, borders, shadows, colors)",
    Composite: "GPU assembles layers in correct order and sends to screen",
  };
  return descriptions[stage];
};

// ── Layout cost classification ────────────────────────────────────────────────

type CSSProperty = string;
type RenderCost = "composite-only" | "paint" | "layout+paint";

const getRenderCost = (property: CSSProperty): RenderCost => {
  // Composite-only: GPU-accelerated, cheapest
  const compositeOnly = new Set(["transform", "opacity", "will-change", "filter"]);
  // Paint: pixels change, no geometry change
  const paintOnly = new Set([
    "color", "background-color", "border-color", "box-shadow",
    "outline", "text-decoration", "visibility",
  ]);
  if (compositeOnly.has(property)) return "composite-only";
  if (paintOnly.has(property)) return "paint";
  return "layout+paint"; // width, height, margin, padding, font-size, etc.
};

// ── Layout thrashing simulation ───────────────────────────────────────────────

// Demonstrates the bad pattern: interleaving reads + writes forces reflow
const simulateLayoutThrashing = (elements: { read: () => number; write: (v: number) => void }[]) => {
  const reads: number[] = [];
  const writes: number[] = [];

  // BAD pattern: read-write-read-write (each read after write forces reflow)
  elements.forEach(el => {
    const value = el.read();   // forces reflow if pending writes exist
    el.write(value + 10);      // schedules write (layout dirty)
    reads.push(value);
    writes.push(value + 10);
  });

  return { reads, writes, reflowsForced: elements.length };
};

const simulateBatchedLayout = (elements: { read: () => number; write: (v: number) => void }[]) => {
  // GOOD pattern: all reads first, then all writes → 1 reflow at most
  const reads = elements.map(el => el.read());
  elements.forEach((el, i) => el.write(reads[i] + 10));
  return { reads, writes: reads.map(v => v + 10), reflowsForced: 1 };
};

// ── rAF scheduling ────────────────────────────────────────────────────────────

const useAnimationFrame = (callback: (timestamp: number) => void, active: boolean) => {
  const rafId = useRef<number>(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    const loop = (ts: number) => {
      callbackRef.current(ts);
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [active]);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED CACHING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── HTTP Cache-Control header parser ─────────────────────────────────────────

interface CacheDirectives {
  noStore?: boolean;
  noCache?: boolean;
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  immutable?: boolean;
  isPrivate?: boolean;
}

const parseCacheControl = (header: string): CacheDirectives => {
  const directives = header.split(",").map(d => d.trim().toLowerCase());
  const result: CacheDirectives = {};

  directives.forEach(d => {
    if (d === "no-store") result.noStore = true;
    else if (d === "no-cache") result.noCache = true;
    else if (d === "immutable") result.immutable = true;
    else if (d === "private") result.isPrivate = true;
    else if (d.startsWith("max-age=")) result.maxAge = parseInt(d.split("=")[1]);
    else if (d.startsWith("s-maxage=")) result.sMaxAge = parseInt(d.split("=")[1]);
    else if (d.startsWith("stale-while-revalidate="))
      result.staleWhileRevalidate = parseInt(d.split("=")[1]);
  });

  return result;
};

// ── Caching strategy resolver ─────────────────────────────────────────────────

type CachingStrategy = "no-cache" | "browser-only" | "cdn-short" | "cdn-long" | "immutable" | "swr";

const resolveCachingStrategy = (directives: CacheDirectives): CachingStrategy => {
  if (directives.noStore) return "no-cache";
  if (directives.isPrivate) return "browser-only";
  if (directives.immutable) return "immutable";
  if (directives.staleWhileRevalidate) return "swr";
  if (directives.sMaxAge) {
    return directives.sMaxAge <= 3600 ? "cdn-short" : "cdn-long";
  }
  return "browser-only";
};

// ── SWR (Stale-While-Revalidate) cache ───────────────────────────────────────

interface SWREntry<T> {
  data: T;
  fetchedAt: number;
  maxAge: number;             // ms before stale
  staleWhileRevalidate: number; // ms after stale to serve stale + revalidate
}

class SWRCache<T> {
  private store = new Map<string, SWREntry<T>>();
  private revalidating = new Set<string>();

  set(key: string, data: T, maxAgeMs: number, swrMs: number): void {
    this.store.set(key, { data, fetchedAt: Date.now(), maxAge: maxAgeMs, staleWhileRevalidate: swrMs });
  }

  get(
    key: string,
    revalidateFn: () => Promise<T>,
    now = Date.now()
  ): { data: T | null; status: "fresh" | "stale" | "miss" } {
    const entry = this.store.get(key);
    if (!entry) return { data: null, status: "miss" };

    const age = now - entry.fetchedAt;

    if (age < entry.maxAge) {
      return { data: entry.data, status: "fresh" };
    }

    if (age < entry.maxAge + entry.staleWhileRevalidate) {
      // Stale but within SWR window — serve stale + background revalidate
      if (!this.revalidating.has(key)) {
        this.revalidating.add(key);
        revalidateFn().then(fresh => {
          this.store.set(key, { ...entry, data: fresh, fetchedAt: Date.now() });
          this.revalidating.delete(key);
        });
      }
      return { data: entry.data, status: "stale" };
    }

    return { data: null, status: "miss" };
  }

  isRevalidating(key: string): boolean {
    return this.revalidating.has(key);
  }
}

// ── ETag / conditional request simulation ────────────────────────────────────

interface ServerResponse<T> {
  data: T;
  etag: string;
  status: 200 | 304;
}

const makeETag = (data: unknown): string =>
  `"${JSON.stringify(data).split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(16)}"`;

const conditionalFetch = <T,>(
  serverData: T,
  ifNoneMatch?: string
): ServerResponse<T> => {
  const currentETag = makeETag(serverData);
  if (ifNoneMatch === currentETag) {
    return { data: serverData, etag: currentETag, status: 304 };
  }
  return { data: serverData, etag: currentETag, status: 200 };
};

// ── Vary header simulation ────────────────────────────────────────────────────

// CDN uses Vary to key cache entries by request headers
const getCDNCacheKey = (url: string, vary: string[], requestHeaders: Record<string, string>): string => {
  const varyValues = vary.map(header => `${header}=${requestHeaders[header.toLowerCase()] ?? ""}`);
  return `${url}|${varyValues.join("|")}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MEMORY OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Memory optimization", () => {
  it("LRU cache evicts the least-recently-used entry when at capacity", () => {
    const lru = new LRUCache<string, number>(3);

    lru.set("a", 1);
    lru.set("b", 2);
    lru.set("c", 3);

    // Access 'a' to mark it as recently used
    lru.get("a");

    // 'd' pushes out the LRU entry — which is now 'b' (a was accessed, c is newest)
    lru.set("d", 4);

    expect(lru.has("b")).toBe(false); // evicted
    expect(lru.has("a")).toBe(true);  // still present (recently accessed)
    expect(lru.has("c")).toBe(true);
    expect(lru.has("d")).toBe(true);
    expect(lru.size).toBe(3);         // never exceeds capacity
  });

  it("LRU cache returns correct values and preserves MRU order", () => {
    const lru = new LRUCache<number, string>(2);

    lru.set(1, "one");
    lru.set(2, "two");
    expect(lru.get(1)).toBe("one");

    // Adding 3 evicts 2 (LRU), not 1 (recently accessed)
    lru.set(3, "three");
    expect(lru.get(2)).toBeUndefined();
    expect(lru.get(1)).toBe("one");
    expect(lru.get(3)).toBe("three");
  });

  it("LRU cache re-insert on set moves entry to MRU position", () => {
    const lru = new LRUCache<string, number>(2);

    lru.set("x", 10);
    lru.set("y", 20);

    // Update 'x' — moves it to MRU
    lru.set("x", 99);

    // 'z' evicts LRU — should be 'y', not 'x'
    lru.set("z", 30);

    expect(lru.has("y")).toBe(false); // evicted
    expect(lru.get("x")).toBe(99);   // updated value, still present
    expect(lru.has("z")).toBe(true);
  });

  it("useEffect cleanup prevents memory leak from setInterval", async () => {
    const ticks: number[] = [];
    const onTick = jest.fn(() => ticks.push(Date.now()));

    const { unmount } = render(<LeakyCounter onTick={onTick} />);

    // Let a tick or two fire
    await act(async () => {
      await new Promise(r => setTimeout(r, 120));
    });

    const callsBeforeUnmount = onTick.mock.calls.length;
    expect(callsBeforeUnmount).toBeGreaterThan(0);

    // Unmount — cleanup fires, interval cleared
    unmount();

    const callsAtUnmount = onTick.mock.calls.length;

    // Wait and confirm no more ticks after unmount
    await act(async () => {
      await new Promise(r => setTimeout(r, 120));
    });

    // Should not have ticked after unmount (cleanup worked)
    expect(onTick.mock.calls.length).toBe(callsAtUnmount);
  });

  it("event listener is removed on unmount when cleanup is correct", () => {
    const onResize = jest.fn();

    const { unmount } = render(<LeakyListener onResize={onResize} leak={false} />);

    // Fire a resize event while mounted
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(onResize).toHaveBeenCalledTimes(1);

    unmount();

    // Fire resize after unmount — listener should be gone
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(onResize).toHaveBeenCalledTimes(1); // still 1
  });

  it("event listener leaks when no cleanup is returned", () => {
    const onResize = jest.fn();

    const { unmount } = render(<LeakyListener onResize={onResize} leak={true} />);

    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(onResize).toHaveBeenCalledTimes(1);

    unmount();

    // Listener still attached — fires after unmount (the leak)
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(onResize).toHaveBeenCalledTimes(2); // leaked

    // Cleanup manually for test isolation
    window.removeEventListener("resize", onResize);
  });

  it("useLRUCache hook provides a bounded cache across renders", () => {
    let cache!: LRUCache<string, string>;

    const CacheConsumer: React.FC = () => {
      cache = useLRUCache<string, string>(2);
      return <div>ok</div>;
    };

    render(<CacheConsumer />);

    cache.set("a", "alpha");
    cache.set("b", "beta");
    cache.set("c", "gamma"); // evicts 'a'

    expect(cache.has("a")).toBe(false);
    expect(cache.get("b")).toBe("beta");
    expect(cache.get("c")).toBe("gamma");
    expect(cache.size).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BROWSER RENDERING PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Browser rendering pipeline", () => {
  it("CRP has 7 stages in correct order", () => {
    expect(CRP_PIPELINE).toEqual([
      "HTML", "DOM", "CSSOM", "RenderTree", "Layout", "Paint", "Composite",
    ]);
  });

  it("each CRP stage has a description", () => {
    CRP_PIPELINE.forEach(stage => {
      const desc = getCRPDescription(stage);
      expect(desc.length).toBeGreaterThan(10);
    });
  });

  it("transform and opacity trigger only composite — cheapest", () => {
    expect(getRenderCost("transform")).toBe("composite-only");
    expect(getRenderCost("opacity")).toBe("composite-only");
    expect(getRenderCost("will-change")).toBe("composite-only");
    expect(getRenderCost("filter")).toBe("composite-only");
  });

  it("color and background-color trigger paint but NOT layout", () => {
    expect(getRenderCost("color")).toBe("paint");
    expect(getRenderCost("background-color")).toBe("paint");
    expect(getRenderCost("box-shadow")).toBe("paint");
  });

  it("width, height, margin trigger layout + paint — most expensive", () => {
    expect(getRenderCost("width")).toBe("layout+paint");
    expect(getRenderCost("height")).toBe("layout+paint");
    expect(getRenderCost("margin")).toBe("layout+paint");
    expect(getRenderCost("font-size")).toBe("layout+paint");
    expect(getRenderCost("padding")).toBe("layout+paint");
  });

  it("batched layout reads/writes cause only 1 forced reflow", () => {
    const elements = [0, 0, 0].map(v => {
      let val = v;
      return {
        read: () => val,
        write: (n: number) => { val = n; },
      };
    });

    const batched = simulateBatchedLayout(elements);
    expect(batched.reflowsForced).toBe(1);
    expect(batched.writes).toEqual([10, 10, 10]);
  });

  it("layout thrashing: interleaved read-write forces a reflow per element", () => {
    const elements = [5, 10, 15].map(v => {
      let val = v;
      return {
        read: () => val,
        write: (n: number) => { val = n; },
      };
    });

    const thrashed = simulateLayoutThrashing(elements);
    expect(thrashed.reflowsForced).toBe(3);       // one per element
    expect(thrashed.reads).toEqual([5, 10, 15]);   // original values
    expect(thrashed.writes).toEqual([15, 20, 25]); // +10 each
  });

  it("useAnimationFrame cleans up rAF on unmount", async () => {
    const frames: number[] = [];
    const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");

    const Animated: React.FC = () => {
      useAnimationFrame(ts => frames.push(ts), true);
      return <div>animating</div>;
    };

    const { unmount } = render(<Animated />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    unmount();
    expect(cancelSpy).toHaveBeenCalled(); // cleanup cancelled the loop

    cancelSpy.mockRestore();
  });

  it("useAnimationFrame does not start loop when inactive", async () => {
    const frames: number[] = [];

    const Paused: React.FC = () => {
      useAnimationFrame(ts => frames.push(ts), false);
      return <div>paused</div>;
    };

    render(<Paused />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    expect(frames.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ADVANCED CACHING
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Advanced caching", () => {
  // ── HTTP Cache-Control parsing ──────────────────────────────────────────────

  it("parses no-store directive", () => {
    const d = parseCacheControl("no-store");
    expect(d.noStore).toBe(true);
  });

  it("parses max-age and s-maxage", () => {
    const d = parseCacheControl("max-age=3600, s-maxage=86400");
    expect(d.maxAge).toBe(3600);
    expect(d.sMaxAge).toBe(86400);
  });

  it("parses stale-while-revalidate", () => {
    const d = parseCacheControl("max-age=60, stale-while-revalidate=3600");
    expect(d.maxAge).toBe(60);
    expect(d.staleWhileRevalidate).toBe(3600);
  });

  it("parses immutable and private", () => {
    const di = parseCacheControl("max-age=31536000, immutable");
    expect(di.immutable).toBe(true);

    const dp = parseCacheControl("private, max-age=600");
    expect(dp.isPrivate).toBe(true);
  });

  // ── Caching strategy resolution ─────────────────────────────────────────────

  it("no-store → no-cache strategy", () => {
    expect(resolveCachingStrategy(parseCacheControl("no-store"))).toBe("no-cache");
  });

  it("private → browser-only strategy", () => {
    expect(resolveCachingStrategy(parseCacheControl("private, max-age=600"))).toBe("browser-only");
  });

  it("immutable → immutable strategy (versioned assets)", () => {
    expect(resolveCachingStrategy(parseCacheControl("max-age=31536000, immutable"))).toBe("immutable");
  });

  it("stale-while-revalidate → swr strategy", () => {
    const d = parseCacheControl("max-age=60, stale-while-revalidate=3600");
    expect(resolveCachingStrategy(d)).toBe("swr");
  });

  it("s-maxage ≤ 3600 → cdn-short strategy", () => {
    const d = parseCacheControl("s-maxage=1800");
    expect(resolveCachingStrategy(d)).toBe("cdn-short");
  });

  it("s-maxage > 3600 → cdn-long strategy", () => {
    const d = parseCacheControl("s-maxage=86400");
    expect(resolveCachingStrategy(d)).toBe("cdn-long");
  });

  // ── SWR cache behaviour ──────────────────────────────────────────────────────

  it("SWR cache returns fresh data within max-age window", () => {
    const swr = new SWRCache<string>();
    const revalidate = jest.fn().mockResolvedValue("refreshed");

    const now = Date.now();
    swr.set("key", "original", 60_000, 300_000);

    // Within max-age → fresh
    const result = swr.get("key", revalidate, now + 30_000);
    expect(result.status).toBe("fresh");
    expect(result.data).toBe("original");
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("SWR cache serves stale data and triggers background revalidation", async () => {
    const swr = new SWRCache<string>();

    let serverData = "v1";
    const revalidate = jest.fn(async () => {
      serverData = "v2";
      return serverData;
    });

    const setTime = Date.now();
    swr.set("key", "v1", 10_000, 60_000);

    // 20 seconds later — past max-age, within SWR window
    const result = swr.get("key", revalidate, setTime + 20_000);
    expect(result.status).toBe("stale");
    expect(result.data).toBe("v1");         // stale served immediately
    expect(revalidate).toHaveBeenCalled();  // background revalidation triggered

    // Wait for revalidation to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 20));
    });

    // Next request gets fresh data
    const fresh = swr.get("key", revalidate, Date.now());
    expect(fresh.status).toBe("fresh");
    expect(fresh.data).toBe("v2");
  });

  it("SWR cache returns miss when beyond both max-age and SWR window", () => {
    const swr = new SWRCache<string>();
    const revalidate = jest.fn();

    const setTime = Date.now();
    swr.set("key", "old", 10_000, 30_000);

    // 60 seconds later — beyond both windows
    const result = swr.get("key", revalidate, setTime + 60_000);
    expect(result.status).toBe("miss");
    expect(result.data).toBeNull();
  });

  it("SWR background revalidation does not double-fetch", async () => {
    const swr = new SWRCache<string>();
    const revalidate = jest.fn(async () => "fresh");

    const setTime = Date.now();
    swr.set("key", "stale", 1_000, 60_000);

    const staleTime = setTime + 5_000; // past max-age, within SWR window

    // Three concurrent requests while stale → only one revalidation
    swr.get("key", revalidate, staleTime);
    swr.get("key", revalidate, staleTime);
    swr.get("key", revalidate, staleTime);

    expect(revalidate).toHaveBeenCalledTimes(1);

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
  });

  // ── ETag / conditional requests ──────────────────────────────────────────────

  it("first fetch returns 200 with ETag", () => {
    const data = { posts: ["React", "Next.js"] };
    const response = conditionalFetch(data);
    expect(response.status).toBe(200);
    expect(response.etag).toBeTruthy();
    expect(response.data).toEqual(data);
  });

  it("conditional request with matching ETag returns 304 Not Modified", () => {
    const data = { posts: ["React", "Next.js"] };

    // First fetch — get ETag
    const first = conditionalFetch(data);
    expect(first.status).toBe(200);

    // Second fetch with If-None-Match → 304
    const second = conditionalFetch(data, first.etag);
    expect(second.status).toBe(304);
  });

  it("conditional request with stale ETag returns 200 with new content", () => {
    const oldData = { posts: ["React"] };
    const newData = { posts: ["React", "Next.js"] };

    const oldResponse = conditionalFetch(oldData);
    const newResponse = conditionalFetch(newData, oldResponse.etag);

    // Content changed → ETag mismatch → 200 with new data
    expect(newResponse.status).toBe(200);
    expect(newResponse.data).toEqual(newData);
    expect(newResponse.etag).not.toBe(oldResponse.etag);
  });

  // ── Vary header / CDN cache key ─────────────────────────────────────────────

  it("Vary: Accept-Encoding produces different cache keys per encoding", () => {
    const gzipKey = getCDNCacheKey("/api/posts", ["Accept-Encoding"], {
      "accept-encoding": "gzip",
    });
    const brotliKey = getCDNCacheKey("/api/posts", ["Accept-Encoding"], {
      "accept-encoding": "br",
    });

    expect(gzipKey).not.toBe(brotliKey);
  });

  it("Vary: Accept-Language produces different cache keys per locale", () => {
    const enKey = getCDNCacheKey("/api/posts", ["Accept-Language"], {
      "accept-language": "en-US",
    });
    const esKey = getCDNCacheKey("/api/posts", ["Accept-Language"], {
      "accept-language": "es-ES",
    });

    expect(enKey).not.toBe(esKey);
  });

  it("same URL + same Vary headers = same cache key (hit)", () => {
    const key1 = getCDNCacheKey("/api/posts", ["Accept-Language"], {
      "accept-language": "en-US",
    });
    const key2 = getCDNCacheKey("/api/posts", ["Accept-Language"], {
      "accept-language": "en-US",
    });

    expect(key1).toBe(key2);
  });
});
