export interface OutlineItem {
  title: string;
  /** 1-based page number, or null when the destination can't be resolved. */
  page: number | null;
  /** nesting level, 0 for top-level entries. */
  depth: number;
}

// the minimal slice of a pdf document this needs — keeps the resolver testable
// without a real pdf (PDFDocumentProxy satisfies it structurally).
interface OutlineNode {
  title: string;
  dest: string | unknown[] | null;
  items?: OutlineNode[];
}
export interface OutlineSource {
  getOutline(): Promise<OutlineNode[] | null>;
  getDestination(id: string): Promise<unknown[] | null>;
  getPageIndex(ref: unknown): Promise<number>;
}

/** resolve an outline destination to a 1-based page number, or null. */
async function destToPage(doc: OutlineSource, dest: OutlineNode["dest"]): Promise<number | null> {
  if (!dest) {
    return null;
  }
  try {
    // named destinations need a lookup; explicit ones are already an array.
    const explicit = typeof dest === "string" ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) {
      return null;
    }
    const ref = explicit[0];
    if (ref == null) {
      return null;
    }
    // some destinations store the page index directly instead of a ref.
    if (typeof ref === "number") {
      return ref + 1;
    }
    return (await doc.getPageIndex(ref)) + 1;
  } catch {
    return null;
  }
}

/** flatten a pdf outline (bookmarks) into a depth-tagged, page-resolved list. */
export async function resolveOutline(doc: OutlineSource): Promise<OutlineItem[]> {
  const roots = await doc.getOutline();
  if (!roots || roots.length === 0) {
    return [];
  }
  const out: OutlineItem[] = [];
  const walk = async (nodes: OutlineNode[], depth: number) => {
    for (const node of nodes) {
      out.push({ title: node.title, page: await destToPage(doc, node.dest), depth });
      if (node.items && node.items.length > 0) {
        await walk(node.items, depth + 1);
      }
    }
  };
  await walk(roots, 0);
  return out;
}
