import NodeCache from "node-cache";

// StdTTL is time to live in seconds.
// Checkperiod is period in seconds for deleting expired keys.
export const systemCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
