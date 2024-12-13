import tmp from 'temp-dir';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export type PluginList = Record<string, {
  name?: string;
  icon?: string;
  color?: string;
  requires?: string[];
  env?: string[];
}>;

export async function load(): Promise<PluginList> {
  if (existsSync(tmp + '/neokit-plugin-list.json')) return JSON.parse(readFileSync(tmp + '/neokit-plugin-list.json', 'utf8'));

  const list = Buffer.from(await (await fetch('https://plugins.neokit.dev/list.json')).arrayBuffer());
  writeFileSync(tmp + '/neokit-plugin-list.json', list);
  return JSON.parse(list.toString('utf8'));
};