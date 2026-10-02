// Isolated test transport. It is never imported by the production build.
type Call = { kind: string; name: string; args?: any; steps?: [string, any[]][] };
export const calls: Call[] = [];
export const handlers: { query: (call: Call) => any; rpc: (call: Call) => any; auth: (call: Call) => any; storage: (call: Call) => any } = {
  query: () => ({ data: [], error: null }), rpc: () => ({ data: null, error: null }),
  auth: () => ({ data: { session: null }, error: null }), storage: () => ({ data: [], error: null }),
};
const listeners = new Set<(event: string, session: any) => void>();
export function emitAuth(session: any, event = 'SIGNED_IN') { for (const listener of listeners) listener(event, session); }
export function resetBackend() {
  calls.length = 0;
  handlers.query = () => ({ data: [], error: null });
  handlers.rpc = () => ({ data: null, error: null });
  handlers.auth = () => ({ data: { session: null }, error: null });
  handlers.storage = call => call.name === 'sign' ? { data: call.args.paths.map((path: string) => ({ path, signedUrl: `https://images.invalid/${path}?fresh=1` })), error: null } : { data: [], error: null };
}
function call(kind: keyof typeof handlers, name: string, args?: any) { const item = { kind, name, args }; calls.push(item); return Promise.resolve().then(() => handlers[kind](item)); }
class Query {
  kind = 'select'; args: any; steps: [string, any[]][] = [];
  constructor(readonly name: string) {}
  select(...args: any[]) { this.steps.push(['select', args]); return this; }
  insert(args: any) { this.kind = 'insert'; this.args = args; return this; }
  upsert(args: any, options?: any) { this.kind = 'upsert'; this.args = { rows: args, options }; return this; }
  delete() { this.kind = 'delete'; return this; }
  eq(...args: any[]) { this.steps.push(['eq', args]); return this; }
  neq(...args: any[]) { this.steps.push(['neq', args]); return this; }
  gt(...args: any[]) { this.steps.push(['gt', args]); return this; }
  in(...args: any[]) { this.steps.push(['in', args]); return this; }
  or(...args: any[]) { this.steps.push(['or', args]); return this; }
  order(...args: any[]) { this.steps.push(['order', args]); return this; }
  limit(...args: any[]) { this.steps.push(['limit', args]); return this; }
  range(...args: any[]) { this.steps.push(['range', args]); return this; }
  single() { this.steps.push(['single', []]); return this; }
  maybeSingle() { this.steps.push(['maybeSingle', []]); return this; }
  then(resolve: any, reject: any) {
    const item = { kind: this.kind, name: this.name, args: this.args, steps: this.steps };
    calls.push(item); return Promise.resolve().then(() => handlers.query(item)).then(resolve, reject);
  }
}
export const supabase = {
  from: (name: string) => new Query(name),
  rpc: (name: string, args: any) => call('rpc', name, args),
  auth: {
    getSession: () => call('auth', 'getSession'),
    onAuthStateChange: (listener: (event: string, session: any) => void) => { listeners.add(listener); return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }; },
    signInWithOAuth: (args: any) => call('auth', 'oauth', args),
    signInWithOtp: (args: any) => call('auth', 'phone', args),
    verifyOtp: (args: any) => call('auth', 'otp', args),
    updateUser: (args: any) => call('auth', 'update', args),
    signOut: (args: any) => call('auth', 'signOut', args),
    mfa: { getAuthenticatorAssuranceLevel: () => call('auth', 'mfa.level'), listFactors: () => call('auth', 'mfa.factors'), enroll: (args: any) => call('auth', 'mfa.enroll', args), challengeAndVerify: (args: any) => call('auth', 'mfa.verify', args) },
  },
  storage: { from: (bucket: string) => ({ createSignedUrls: (paths: string[]) => call('storage', 'sign', { bucket, paths }), remove: (paths: string[]) => call('storage', 'remove', { bucket, paths }), upload: (path: string, file: File) => call('storage', 'upload', { bucket, path, file }) }) },
};
