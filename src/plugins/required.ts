import { PluginList } from './list';

export function required(pluginList: PluginList, plugin: string): string[] {
  const requires = pluginList[plugin].requires ?? [];

  const reqs = [];
  requires.forEach((p) => {
    reqs.push(...required(pluginList, p));
    reqs.push(p);
  });

  return reqs;
}
