export type WeightedGraph = Record<string, Record<string, number>>;

// The mathematical topological map of walking distances between buildings based on the hand-drawn campus map
export const vitCampus: WeightedGraph = {
    // --- Top Left Area ---
    'Gate 2': { 'Main Canteen': 50 },
    'Main Canteen': { 'Gate 2': 50, 'Hospital': 50 },
    'Hospital': { 'Main Canteen': 50, 'GDN Block': 50 },
    'CDMM Block': { 'GDN Block': 50 },
    'GDN Block': { 'Hospital': 50, 'CDMM Block': 50, 'Anna Audi': 50, 'MGR Block (MB)': 80 },
    'Anna Audi': { 'GDN Block': 50, 'Library': 60, 'MGR Block (MB)': 50 },
    'Library': { 'Anna Audi': 60, 'MGR Block (MB)': 50 },
    'MGR Block (MB)': { 'GDN Block': 80, 'Anna Audi': 50, 'Library': 50, 'Main Gate': 50, 'KC Lawn': 50 },
    'Main Gate': { 'MGR Block (MB)': 50 },
    'KC Lawn': { 'MGR Block (MB)': 50, 'SMV Block': 50 },

    // --- Center / Left-Mid Area ---
    'SMV Block': { 'KC Lawn': 50, 'Foodys': 50, 'LH-A-Block': 50, 'LH-B-Block': 50 },
    'Foodys': { 'SMV Block': 50, 'Circle': 50, 'LH-A-Block': 50, 'LH-B-Block': 50 },
    'Circle': { 'Foodys': 50, 'Main Subway': 100, 'TT (Technology Tower)': 150 },
    'Main Subway': { 'Circle': 100, 'MH-J-Block': 50 },

    // --- Ladies Hostels & Gate 3 ---
    'LH-A-Block': { 'LH-B-Block': 10, 'SMV Block': 50, 'Foodys': 50, 'LH-G-Block': 50, 'LH-H-Block': 50 },
    'LH-B-Block': { 'LH-A-Block': 10, 'SMV Block': 50, 'Foodys': 50, 'LH-G-Block': 50, 'LH-H-Block': 50 },
    'LH-G-Block': { 'LH-H-Block': 10, 'LH-A-Block': 50, 'LH-B-Block': 50, 'Gate 3': 50, 'TT (Technology Tower)': 200 },
    'LH-H-Block': { 'LH-G-Block': 10, 'LH-A-Block': 50, 'LH-B-Block': 50, 'Gate 3': 50, 'TT (Technology Tower)': 200 },
    'Gate 3': { 'LH-G-Block': 50, 'LH-H-Block': 50 },

    // --- Technology Tower & Subways ---
    'TT (Technology Tower)': { 'Circle': 150, 'LH-G-Block': 200, 'LH-H-Block': 200, 'Stationary': 50 },
    'Stationary': { 'TT (Technology Tower)': 50, 'TT Subway': 20 },
    'TT Subway': { 'Stationary': 20, 'TT Subway Mens Side': 0, 'LH-C-Block': 100, 'LH-D-Block': 100 },
    'TT Subway Mens Side': { 'TT Subway': 0, 'MH-K-Block': 100, 'MH-E-Block': 150 },

    // --- Right Side LH & SJT ---
    'LH-C-Block': { 'LH-D-Block': 10, 'TT Subway': 100, 'LH-E-Block': 100, 'LH-F-Block': 100 },
    'LH-D-Block': { 'LH-C-Block': 10, 'TT Subway': 100, 'LH-E-Block': 100, 'LH-F-Block': 100 },
    'LH-E-Block': { 'LH-F-Block': 10, 'LH-C-Block': 100, 'LH-D-Block': 100, 'SJT (Silver Jubilee Tower)': 100 },
    'LH-F-Block': { 'LH-E-Block': 10, 'LH-C-Block': 100, 'LH-D-Block': 100, 'SJT (Silver Jubilee Tower)': 100 },
    'SJT (Silver Jubilee Tower)': { 'LH-E-Block': 100, 'LH-F-Block': 100, 'SJT Ground': 50, 'PRP Subway': 100 },
    'SJT Ground': { 'SJT (Silver Jubilee Tower)': 50 },

    // --- PRP & MGB ---
    'PRP Subway': { 'SJT (Silver Jubilee Tower)': 100, 'PRP (Pearl Research Park)': 50, 'MH-M-Block': 150 },
    'PRP (Pearl Research Park)': { 'PRP Subway': 50, 'MGB (Mahatma Gandhi Block)': 100 },
    'MGB (Mahatma Gandhi Block)': { 'PRP (Pearl Research Park)': 100 },

    // --- Mens Hostels ---
    'MH-M-Block': { 'PRP Subway': 150, 'MH-L-Block': 100 },
    'MH-L-Block': { 'MH-M-Block': 100, 'MH-K-Block': 150 },
    'MH-K-Block': { 'MH-L-Block': 150, 'TT Subway Mens Side': 100 },
    'MH-E-Block': { 'TT Subway Mens Side': 150, 'MH-D-Block': 50 },
    'MH-D-Block': { 'MH-E-Block': 50, 'MH-C-Block': 50, 'MH-G-Block': 100 },
    'MH-C-Block': { 'MH-D-Block': 50, 'MH-A-Block': 100, 'MH-F-Block': 100 },
    'MH-F-Block': { 'MH-C-Block': 100, 'MH-G-Block': 100 },
    'MH-G-Block': { 'MH-D-Block': 100, 'MH-F-Block': 100, 'Outdoor Stadium': 50 },
    'Outdoor Stadium': { 'MH-G-Block': 50 },
    'MH-A-Block': { 'MH-C-Block': 100, 'MH-H-Block': 100 },
    'MH-H-Block': { 'MH-A-Block': 100, 'MH-J-Block': 50 },
    'MH-J-Block': { 'MH-H-Block': 50, 'Main Subway': 50 }
};

// Common synonyms to normalize user/LLM input back to the strict Graph node name
export const locationSynonyms: Record<string, string> = {
    'MB': 'MGR Block (MB)',
    'MGR': 'MGR Block (MB)',
    'Main Building': 'MGR Block (MB)',
    'SMV': 'SMV Block',
    'GDN': 'GDN Block',
    'Gordon': 'GDN Block',
    'TT': 'TT (Technology Tower)',
    'Tech Tower': 'TT (Technology Tower)',
    'SJT': 'SJT (Silver Jubilee Tower)',
    'Silver Jubilee': 'SJT (Silver Jubilee Tower)',
    'PRP': 'PRP (Pearl Research Park)',
    'Pearl': 'PRP (Pearl Research Park)',
    'Foodys': 'Foodys',
    'Food Court': 'Foodys',
    'FC': 'Foodys',
    'Bakery': 'Foodys',
    'DC': 'Foodys',
    'MGB': 'MGB (Mahatma Gandhi Block)',
    'Mahatma Gandhi Block': 'MGB (Mahatma Gandhi Block)',
    'Architecture Block': 'MGB (Mahatma Gandhi Block)',
    'KC': 'KC Lawn',
    'Kalpana chawla lawn': 'KC Lawn',
    'Stadium': 'Outdoor Stadium',
    'CDMM': 'CDMM Block',

    // Men's Hostel Synonyms
    'MH A': 'MH-A-Block', 'A Block': 'MH-A-Block',
    'MH C': 'MH-C-Block', 'C Block': 'MH-C-Block',
    'MH D': 'MH-D-Block', 'D Block': 'MH-D-Block',
    'MH E': 'MH-E-Block', 'E Block': 'MH-E-Block',
    'MH F': 'MH-F-Block', 'F Block': 'MH-F-Block',
    'MH G': 'MH-G-Block', 'G Block': 'MH-G-Block',
    'MH H': 'MH-H-Block', 'H Block': 'MH-H-Block',
    'MH J': 'MH-J-Block', 'J Block': 'MH-J-Block',
    'MH K': 'MH-K-Block', 'K Block': 'MH-K-Block',
    'MH L': 'MH-L-Block', 'L Block': 'MH-L-Block',
    'MH M': 'MH-M-Block', 'M Block': 'MH-M-Block',

    // Ladies' Hostel Synonyms
    'LH A': 'LH-A-Block',
    'LH B': 'LH-B-Block',
    'LH C': 'LH-C-Block',
    'LH D': 'LH-D-Block',
    'LH E': 'LH-E-Block',
    'LH F': 'LH-F-Block',
    'LH G': 'LH-G-Block',
    'LH H': 'LH-H-Block'
};

/**
 * Normalizes a user string into a strict graph Node name using the synonym map.
 * Returns the original string if no synonym is found but it exists in the graph.
 * Returns null if the location is completely unknown.
 */
export function normalizeLocationNode(input: string): string | null {
    if (!input) return null;
    const cleanInput = input.trim();

    // Direct match in the map
    if (vitCampus[cleanInput]) return cleanInput;

    // Case-insensitive direct match
    const directMatch = Object.keys(vitCampus).find(k => k.toLowerCase() === cleanInput.toLowerCase());
    if (directMatch) return directMatch;

    // Synonym lookup (case-insensitive)
    for (const [synonym, node] of Object.entries(locationSynonyms)) {
        if (synonym.toLowerCase() === cleanInput.toLowerCase()) {
            return node;
        }
    }

    return null; // Unknown location
}

/**
 * Dijkstra's Algorithm to find the shortest path between two nodes in the weighted graph.
 * Returns an object with the path array and total distance in meters.
 * Returns null if no path exists or nodes are invalid.
 */
export function findPath(startNode: string, endNode: string): { path: string[], distance: number } | null {
    const start = normalizeLocationNode(startNode);
    const end = normalizeLocationNode(endNode);

    if (!start || !end || !vitCampus[start] || !vitCampus[end]) {
        return null; // Invalid nodes
    }

    if (start === end) {
        return { path: [start], distance: 0 };
    }

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    // Initialize
    for (const node in Object.assign({}, ...Object.keys(vitCampus).map(k => ({ [k]: true })), ...Object.values(vitCampus))) {
        const n = (node as string);
        if (vitCampus[n]) {
            distances[n] = Infinity;
            previous[n] = null;
            unvisited.add(n);
        }
    }
    distances[start] = 0;

    while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let current: string | null = null;
        let minDistance = Infinity;
        for (const node of unvisited) {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                current = node;
            }
        }

        if (current === null || distances[current] === Infinity) {
            break; // All remaining unvisited nodes are unreachable
        }

        if (current === end) {
            break; // Found the shortest path
        }

        unvisited.delete(current);

        // Update distances for neighbors
        const neighbors = vitCampus[current];
        if (!neighbors) continue;

        for (const neighbor in neighbors) {
            if (unvisited.has(neighbor)) {
                const alt = distances[current] + neighbors[neighbor];
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = current;
                }
            }
        }
    }

    // Construct the path by working backwards from the end node
    if (distances[end] === Infinity) {
        return null; // No path found
    }

    const path: string[] = [];
    let curr: string | null = end;
    while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
    }

    return { path, distance: distances[end] };
}